"""Thin Groq (OpenAI-compatible) client with retry/backoff for batch runs."""

import json
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqNotConfigured(Exception):
    pass


def extract_one(prompt: str, model: str, max_retries: int = 5, max_tokens: int = 4096) -> dict | None:
    """Run one extraction call. Returns the parsed JSON dict, or None if the
    model produced empty/invalid output (logged, not raised — one bad item
    shouldn't kill a batch run).

    Confirmed 2026-08-19: this Groq free-tier project rate-limits hard
    enough that a 50-item pilot with no proactive delay lost 34% of items
    even with exponential backoff. Two mitigations: a fixed delay before
    every call (config.GROQ_REQUEST_DELAY_SECONDS), and honoring the
    `retry-after` header Groq sends on 429 instead of guessing a backoff.

    Also confirmed 2026-08-19: a bare network-level failure (SSL handshake
    timeout mid-batch) is NOT an HTTP status code — it raises before a
    response object even exists. The first version of this function only
    handled response.status_code, so one transient timeout took down an
    entire 700-item batch run. requests.RequestException (covers timeouts,
    connection resets, DNS blips) is now caught and retried exactly like a
    429, rather than being allowed to propagate and kill the whole batch.

    Also confirmed 2026-08-19: no max_tokens was set, and the synthesis
    call (a much longer response than per-item extraction — naming themes
    across dozens of phrases) hit Groq's `json_validate_failed` error
    consistently across retries, consistent with the response being cut
    off mid-JSON at a small default token cap. max_tokens now defaults
    generously high; this only raises the ceiling; it doesn't inflate
    actual token usage for the many short extraction responses.
    """
    if not config.GROQ_API_KEY:
        raise GroqNotConfigured(
            "GROQ_API_KEY missing. Get a free key at https://console.groq.com/keys "
            "and set it in pipeline/.env."
        )

    for attempt in range(max_retries):
        time.sleep(config.GROQ_REQUEST_DELAY_SECONDS)

        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {config.GROQ_API_KEY}",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": max_tokens,
                    "response_format": {"type": "json_object"},
                },
                timeout=30,
            )
        except requests.RequestException as exc:
            wait = 2 ** attempt
            print(f"    Network error ({exc.__class__.__name__}), waiting {wait}s and retrying...")
            time.sleep(wait)
            continue

        if response.status_code == 429:
            retry_after = response.headers.get("retry-after")
            wait = float(retry_after) if retry_after else (2 ** attempt)
            print(f"    Rate limited, waiting {wait}s...")
            time.sleep(wait)
            continue

        if not response.ok:
            print(f"    Groq API error {response.status_code}: {response.text[:200]}")
            return None

        raw = response.json()["choices"][0]["message"]["content"]
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            print(f"    Model output was not valid JSON, skipping item: {raw[:200]}")
            return None

    print("    Gave up after repeated rate limiting.")
    return None
