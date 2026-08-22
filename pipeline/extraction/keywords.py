"""Keyword Buzz — buckets the deduped phrase list (phrases.json) into
Frustrations vs. Praise for the dashboard's keyword cloud widget.

Deliberately NOT a trained sentiment model, and NOT based on which
extraction field a phrase came from either — an earlier pass tried
field-name-as-polarity (e.g. "resolution_reason = praise") and it was
wrong on inspection: several real resolution_reason phrases are negative
("size not available in discount price", "size is not good even in my
size"), because that field just captures "what happened at the decision
point," not "was it positive." Polarity has to come from the phrase TEXT
itself.

What this actually is: a short, visible keyword-marker lexicon applied to
each phrase's own text. Phrases matching neither list are left out of the
cloud entirely rather than guessed at — same principle as score.py's
"auditable, not a black-box call," just applied to a heuristic instead of
an LLM. Good enough for "what's the buzz," not a claim of measured
sentiment.

Usage:
    python -m extraction.keywords
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

NEGATIVE_MARKERS = [
    "not good", "not available", "no ", "n't", "never", "worst", "bad ", "poor",
    "delay", "late", "issue", "problem", "difficult", "hard to", "confus",
    "limit", "cap", "return", "refund", "cancel", "fail", "broke", "broken",
    "expensive", "costly", "overpriced", "fake", "fraud", "complain", "annoy",
    "frustrat", "disappoint", "wrong", "damage", "stuck", "forgot", "forget",
]

POSITIVE_MARKERS = [
    "good", "great", "best", "excellent", "amazing", "love", "perfect",
    "comfortable", "comfort", "worth", "value for money", "fast", "quick",
    "on time", "smooth", "easy", "impressive", "reliable", "premium",
    "convenient", "soft", "classy", "stylish", "luxury", "genuine", "enjoy",
    "authentic", "trust", "quality", "spacious", "clean", "secure", "helpful",
]

TOP_N_PER_BUCKET = 20


def classify(phrase_text: str) -> str | None:
    text = phrase_text.lower()
    is_negative = any(m in text for m in NEGATIVE_MARKERS)
    is_positive = any(m in text for m in POSITIVE_MARKERS)
    if is_negative and not is_positive:
        return "negative"
    if is_positive and not is_negative:
        return "positive"
    return None  # ambiguous or hits both lists — leave out rather than guess


def clean_label(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) > 40:
        text = text[:37].rstrip() + "..."
    return text[0].upper() + text[1:] if text else text


def run_keywords() -> dict | None:
    phrases_path = config.EXTRACTED_DIR / "phrases.json"
    if not phrases_path.exists():
        print(f"{phrases_path} not found — run extraction.dedupe first.")
        return None

    data = json.loads(phrases_path.read_text(encoding="utf-8"))

    negative, positive = [], []
    for p in data["phrases"]:
        bucket = classify(p["phrase"])
        entry = {"text": clean_label(p["phrase"]), "value": p["count"]}
        if bucket == "negative":
            negative.append(entry)
        elif bucket == "positive":
            positive.append(entry)

    negative.sort(key=lambda e: -e["value"])
    positive.sort(key=lambda e: -e["value"])

    result = {
        "negative": negative[:TOP_N_PER_BUCKET],
        "positive": positive[:TOP_N_PER_BUCKET],
        "method": "keyword-marker lexicon applied to phrase text, not a trained sentiment model — ambiguous or unmatched phrases are left out rather than guessed at",
    }

    out_path = config.EXTRACTED_DIR / "keywords.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Keyword buzz written to {out_path}: {len(result['negative'])} frustrations, {len(result['positive'])} praise")
    return result


if __name__ == "__main__":
    run_keywords()
