"""Step 6 — synthesis: name emergent opportunity themes from the deduped
phrase list, then map each theme onto the brief's 7 named factors + an
emergent bucket. One Groq call (large model), per problem_statement.md §5/§10.

Deliberately does NOT compute any rate, percentage, or score here — that's
step 7's job, in plain code. This call's only output is qualitative:
naming/grouping. Matching phrases back to themes happens in code afterward
(score.py) using the phrase_ids this call returns, not by re-parsing text —
avoids compounding LLM unreliability into the numbers.

Usage:
    python -m extraction.synthesize
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.phrase_ids import parse_phrase_ids
from extraction.groq_client import GroqNotConfigured, extract_one

FACTORS = ["fit", "size", "styling", "price", "reviews", "occasion", "social_validation", "emergent"]

# Cap prompt size — if the real corpus produces more unique phrases than
# this, send the highest-count ones first (most decision-useful signal)
# rather than truncating arbitrarily.
# Confirmed 2026-08-19 by direct testing: this specific Groq project/model
# combo reliably succeeds at 60 phrases and reliably fails (400
# json_validate_failed, empty failed_generation body — not a max_tokens
# issue, already ruled out) at 80. No time to bisect the exact boundary
# given how slow each test call is under the rate limit; 60 is a tested
# safe value, not a theoretical one.
MAX_PHRASES_IN_PROMPT = 60


def build_prompt(phrases: list[dict]) -> str:
    lines = [f'{p["id"]}. [{p["field"]}, seen {p["count"]}x] "{p["phrase"]}"' for p in phrases]
    phrase_block = "\n".join(lines)

    return f"""You are analysing a corpus of extracted phrases from public reviews and posts about Myntra (an Indian fashion e-commerce app), specifically about why people don't convert a wishlisted item into a purchase.

You were NOT given any taxonomy in advance. Below is a deduped, frequency-counted list of short phrases extracted from real user text — each tagged with which extraction field it came from and how many times it was seen. Your job:

1. Group these phrases into 4-8 named "opportunity areas" (emergent themes) that genuinely reflect what the corpus says, not a taxonomy you already knew. Name each theme clearly and specifically (e.g. "Fit/size uncertainty on return visits", not just "Fit").
2. For each theme, map it onto exactly one of these 7 factors: fit, size, styling, price, reviews, occasion, social_validation — or "emergent" if it genuinely doesn't fit any of them. Do this AFTER naming themes from the data, not before.
3. For each theme, list the numeric ids of every phrase below that belongs to it. Every phrase should belong to at most one theme; phrases that are too generic/unclear to fit a theme can be left out.

Phrases:
{phrase_block}

Return ONLY a JSON object of this exact shape, no prose. IMPORTANT: "phrase_ids" must be a single STRING of comma-separated numbers (e.g. "1, 4, 9, 23"), NOT a JSON array — this avoids a known formatting failure where number arrays get mangled.
{{
  "themes": [
    {{ "name": "...", "factor": "one of: {', '.join(FACTORS)}", "phrase_ids": "1, 4, 9, 23" }}
  ]
}}"""


def run_synthesis() -> dict | None:
    phrases_path = config.EXTRACTED_DIR / "phrases.json"
    if not phrases_path.exists():
        print(f"{phrases_path} not found — run extraction.dedupe first.")
        return None

    data = json.loads(phrases_path.read_text(encoding="utf-8"))
    phrases = data["phrases"]

    if len(phrases) > MAX_PHRASES_IN_PROMPT:
        print(f"{len(phrases)} unique phrases > cap of {MAX_PHRASES_IN_PROMPT}; using the highest-count ones.")
        phrases = sorted(phrases, key=lambda p: -p["count"])[:MAX_PHRASES_IN_PROMPT]

    print(f"Synthesizing themes from {len(phrases)} phrases using {config.GROQ_MODEL_SYNTHESIS}...")

    prompt = build_prompt(phrases)
    try:
        result = extract_one(prompt, config.GROQ_MODEL_SYNTHESIS)
    except GroqNotConfigured as exc:
        print(str(exc))
        return None

    if result is None or "themes" not in result:
        print("Synthesis call failed or returned unexpected shape.")
        return None

    out_path = config.EXTRACTED_DIR / "themes.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"{len(result['themes'])} themes identified, written to {out_path}:")
    for t in result["themes"]:
        # The model names themes in real prose, which can include characters
        # the Windows console's cp1252 codec cannot encode (a non-breaking
        # hyphen in "Occasion-driven styling intent" crashed this loop on
        # 2026-08-23 AFTER themes.json had already been written correctly —
        # a purely cosmetic failure that looked like a pipeline crash).
        # themes.json itself is always written UTF-8 above; only this console
        # echo needs to tolerate a lossy terminal.
        line = f"  {t['name']} ({t['factor']}) - {len(parse_phrase_ids(t.get('phrase_ids')))} phrases"
        enc = sys.stdout.encoding or "utf-8"
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"))

    return result


if __name__ == "__main__":
    run_synthesis()
