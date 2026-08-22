"""Step 5 — dedupe + frequency-count extracted phrases. Plain code, no LLM.

Per problem_statement.md §5/§10: this stage does NOT do semantic grouping
(that's synthesis's job, §6). It flattens every freeform field across all
extracted records into one list, collapses exact/near-exact repeats
(case/whitespace-insensitive), and counts frequency — reducing the raw
volume before the one synthesis call has to read it, and giving synthesis
real counts to reason about instead of guessing at frequency itself.

Usage:
    python -m extraction.dedupe
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import read_jsonl

FREEFORM_FIELDS = [
    "save_motivation",
    "comparison_behavior",
    "offsite_research",
    "workaround",
    "hesitation_signal",
    "resolution_reason",
    "current_blocker_freeform",
    "deferral_trigger",
]
# decision_factors is a list field, handled separately (each item is its own phrase)


def normalize(phrase: str) -> str:
    p = phrase.strip().lower()
    p = re.sub(r"[^\w\s]", "", p)
    p = re.sub(r"\s+", " ", p)
    return p.strip()


def run_dedupe() -> dict:
    records = list(read_jsonl(config.EXTRACTED_DIR / "extracted.jsonl"))
    if not records:
        print(f"No records in {config.EXTRACTED_DIR / 'extracted.jsonl'} — run batch-extract first.")
        return {}

    # phrase_key -> {field, phrase (first-seen original casing), count, record_urls: []}
    phrases: dict[tuple[str, str], dict] = {}

    for idx, record in enumerate(records):
        extraction = record.get("extraction", {})
        source_url = record.get("source_url", f"record-{idx}")

        for field in FREEFORM_FIELDS:
            value = extraction.get(field)
            if not value or not isinstance(value, str):
                continue
            norm = normalize(value)
            if not norm:
                continue
            key = (field, norm)
            if key not in phrases:
                phrases[key] = {"field": field, "phrase": value.strip(), "count": 0, "record_urls": []}
            phrases[key]["count"] += 1
            phrases[key]["record_urls"].append(source_url)

        for factor in extraction.get("decision_factors") or []:
            if not isinstance(factor, str) or not factor.strip():
                continue
            norm = normalize(factor)
            if not norm:
                continue
            key = ("decision_factors", norm)
            if key not in phrases:
                phrases[key] = {"field": "decision_factors", "phrase": factor.strip(), "count": 0, "record_urls": []}
            phrases[key]["count"] += 1
            phrases[key]["record_urls"].append(source_url)

    phrase_list = []
    for i, (key, data) in enumerate(sorted(phrases.items(), key=lambda kv: -kv[1]["count"])):
        phrase_list.append({"id": i, **data})

    out = {
        "total_records": len(records),
        "total_unique_phrases": len(phrase_list),
        "phrases": phrase_list,
    }

    out_path = config.EXTRACTED_DIR / "phrases.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"{len(records)} records -> {len(phrase_list)} unique phrases across {len(FREEFORM_FIELDS) + 1} fields")
    print(f"Written to {out_path}")

    field_counts: dict[str, int] = {}
    for p in phrase_list:
        field_counts[p["field"]] = field_counts.get(p["field"], 0) + 1
    for field, count in sorted(field_counts.items(), key=lambda kv: -kv[1]):
        print(f"  {field:<24}{count:>5} unique phrases")

    return out


if __name__ == "__main__":
    run_dedupe()
