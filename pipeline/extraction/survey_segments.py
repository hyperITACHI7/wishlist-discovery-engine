"""Compute segment-composition cross-tabs from raw survey responses. Plain
code, no LLM — there's no text here to extract, just structured answers to
count. See config.py's "Survey (Google Forms)" block for why this is kept
separate from the review/Reddit theme pipeline rather than merged into it.

Usage:
    python -m extraction.survey_segments
"""

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import read_jsonl

# Order matters for legible bar-chart-style output — roughly low-to-high or
# a natural reading order per question, not alphabetical.
ANSWER_ORDER = {
    "age": ["18-24", "25–34", "35–44", "45+"],
    "city_tier": ["Metro city (Delhi, Mumbai, Bengaluru, etc.)", "Tier 2 city", "Tier 3 city / Town", "Rural area"],
    "purchase_frequency": ["Weekly", "Monthly", "Every few months", "A few times a year"],
    "spend_per_item": ["Under ₹500", "₹500–999", "₹1,000–1,999", "₹2,000–3,999", "₹4,000+"],
    "wishlist_item_price": ["Under ₹500", "₹500–999", "₹1,000–1,999", "₹2,000–3,999", "₹4,000+"],
    "wishlist_save_frequency": ["Multiple times a week", "A few times a month", "Rarely", "Never"],
}

QUESTION_LABELS = {
    "age": "Age",
    "city_tier": "Where do you live?",
    "purchase_frequency": "How often do you buy fashion online?",
    "spend_per_item": "Usual spend on a single fashion item",
    "wishlist_item_price": "Price of most expensive wishlist item",
    "wishlist_save_frequency": "How often do you save items to a wishlist",
    # Added when the form grew from 6 to 19 questions (2026-08-19). No
    # ANSWER_ORDER entry yet for these — falls back to Counter's natural
    # order until the full canonical option set is confirmed.
    "wishlist_size": "Roughly how many items are in your wishlist",
    "return_visit_frequency": "How often did you re-open something you'd saved (last month)",
    "outcome_pattern": "What usually happens to things you save",
    "primary_blocker_reason": "Single biggest reason a saved item goes unbought",
    "resolution_trigger": "What brings you back to buy a saved item",
    "decision_ease": "How easy is it to decide when you open your wishlist to buy",
    "social_validation_check": "Do you ask someone's opinion before buying clothes online",
    # blocker_categories_raw / offsite_check_raw deliberately excluded —
    # multi-select, stored raw (not split), not a clean single-answer
    # distribution. See collectors/survey_collect_csv.py's COLUMN_MAP note.
}

# "Heavy" vs "light" wishlister split, used for the one cross-question cut —
# directly the kind of segment distinction Q9 needs and public reviews can't give.
HEAVY_WISHLISTER_ANSWERS = {"Multiple times a week", "A few times a month"}


def distribution(records: list[dict], field: str) -> list[dict]:
    values = [r["answers"].get(field) for r in records if r["answers"].get(field)]
    n = len(values)
    if n == 0:
        return []
    counts = Counter(values)
    order = ANSWER_ORDER.get(field, list(counts.keys()))
    cells = []
    for label in order:
        count = counts.get(label, 0)
        if count == 0:
            continue
        cells.append({"label": label, "valuePct": round(count / n * 100), "n": count, **({"smallCell": True} if count < 5 else {})})
    return cells


def run_survey_segments() -> dict | None:
    raw_path = config.RAW_DIR / "survey_responses.jsonl"
    records = list(read_jsonl(raw_path))
    if not records:
        print(f"No survey responses in {raw_path} — run collectors.survey_collect first.")
        return None

    distributions = []
    for field, label in QUESTION_LABELS.items():
        cells = distribution(records, field)
        if cells:
            distributions.append({"question": label, "field": field, "cells": cells})

    heavy = [r for r in records if r["answers"].get("wishlist_save_frequency") in HEAVY_WISHLISTER_ANSWERS]
    light = [r for r in records if r["answers"].get("wishlist_save_frequency") and r["answers"].get("wishlist_save_frequency") not in HEAVY_WISHLISTER_ANSWERS]

    heavy_vs_light = None
    if heavy and light:
        heavy_vs_light = {
            "dimension": "wishlist item price, heavy vs. light wishlisters",
            "groups": [
                {"label": f"Heavy wishlisters (n={len(heavy)})", "cells": distribution(heavy, "wishlist_item_price")},
                {"label": f"Light wishlisters (n={len(light)})", "cells": distribution(light, "wishlist_item_price")},
            ],
        }

    findings = {
        "totalResponses": len(records),
        "distributions": distributions,
        "heavyVsLightWishlisters": heavy_vs_light,
        "note": (
            "Structured self-report data from a convenience-sample survey, not statistically "
            "representative. Never cross-tabbed against review/Reddit themes — respondents and "
            "reviewers are different, unlinked, anonymous populations."
        ),
    }

    out_path = config.EXTRACTED_DIR / "survey_findings.json"
    out_path.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Survey segment findings written to {out_path} ({len(records)} responses)")

    return findings


if __name__ == "__main__":
    run_survey_segments()
