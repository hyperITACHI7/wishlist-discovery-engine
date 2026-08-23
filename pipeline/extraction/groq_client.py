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


# --- Multi-key rotation state (problem_statement.md §23) ---------------
# Module-level on purpose: rotation state must persist across every
# extract_one() call in a batch run, otherwise each item would start back
# at an already-exhausted key. _exhausted holds indexes whose daily token
# budget looks spent, so a run never cycles back into a dead key.
_key_index = 0
_exhausted: set[int] = set()


def _current_key() -> str:
    if not config.GROQ_API_KEYS:
        raise GroqNotConfigured(
            "No Groq key configured. Get a free key at https://console.groq.com/keys "
            "and set GROQ_API_KEY in pipeline/.env. For extra daily budget, add "
            "GROQ_API_KEY_2 (must be from a SEPARATE Groq account — same-account "
            "keys share one 200k/day pool)."
        )
    return config.GROQ_API_KEYS[_key_index]


def _rotate_key(reason: str) -> bool:
    """Mark the current key spent and move to the next usable one.
    Returns False when every key is exhausted."""
    global _key_index
    _exhausted.add(_key_index)
    total = len(config.GROQ_API_KEYS)
    for offset in range(1, total + 1):
        candidate = (_key_index + offset) % total
        if candidate not in _exhausted:
            _key_index = candidate
            print(f"    Key #{_key_index} activated ({reason}); {total - len(_exhausted)} of {total} keys still usable.")
            return True
    print(f"    All {total} key(s) exhausted ({reason}).")
    return False


def keys_status() -> str:
    total = len(config.GROQ_API_KEYS)
    return f"{total - len(_exhausted)}/{total} Groq keys usable (active: #{_key_index})"


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
    _current_key()  # raises GroqNotConfigured if nothing is set at all

    for attempt in range(max_retries):
        time.sleep(config.GROQ_REQUEST_DELAY_SECONDS)

        try:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {_current_key()}",
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

            # Groq states WHICH limit was hit in the error body ("tokens per
            # day (TPD)" vs "tokens per minute (TPM)"). Read it rather than
            # inferring from retry-after length: the 2026-08-23 run rotated
            # on 261s/289s waits assuming daily exhaustion, which may have
            # retired keys that still had budget. The header alone can't tell
            # these apart; the body can.
            body = (response.text or "")[:400]
            is_daily = "per day" in body.lower() or "tpd" in body.lower()
            is_minute = "per minute" in body.lower() or "tpm" in body.lower()

            # Fall back to the retry-after heuristic only when the body is
            # uninformative, and say which basis was used so the log is
            # diagnosable rather than mysterious.
            if is_daily:
                reason, rotate = "TPD stated in error body", True
            elif is_minute:
                reason, rotate = "TPM stated in error body", False
            else:
                reason = f"retry-after {wait}s, no limit type in body"
                rotate = wait >= config.GROQ_TPD_RETRY_AFTER_THRESHOLD_SECONDS

            if rotate:
                print(f"    Key #{_key_index} out of daily budget ({reason}).")
                if _rotate_key(reason):
                    continue  # retry immediately on the fresh key
                print(f"    No keys left — waiting {wait}s as a last resort.")

            print(f"    Rate limited ({reason}), waiting {wait}s...")
            time.sleep(wait)
            continue

        # 401 = bad/revoked key, 403 = key valid but this model isn't enabled
        # for its project (a real, previously-hit Groq footgun — see §10).
        # Both are key-specific, so rotate rather than returning None for
        # every remaining item and silently losing the batch.
        if response.status_code in (401, 403) and len(config.GROQ_API_KEYS) > 1:
            print(f"    Key #{_key_index} rejected ({response.status_code}): {response.text[:120]}")
            if _rotate_key(f"HTTP {response.status_code}"):
                continue
            return None

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
