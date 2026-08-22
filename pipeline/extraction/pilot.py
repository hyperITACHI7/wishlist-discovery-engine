"""50-item pilot — run before paying for the full batch.

Locked decision (problem_statement.md §6): measure per-field null rates on
a small pilot first. Any field >95% empty gets its prompt line rewritten or
dropped rather than carried dead-weight across thousands of items.

Usage:
    python -m extraction.pilot [--n 50]
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl, read_jsonl
from extraction.groq_client import GroqNotConfigured, extract_one
from extraction.prompts import build_prompt, lens_for_source

RAW_FILES = ["reddit.jsonl", "playstore.jsonl", "appstore.jsonl"]


def load_sample(n: int) -> list[dict]:
    items: list[dict] = []
    for filename in RAW_FILES:
        path = config.RAW_DIR / filename
        items.extend(read_jsonl(path))
    return items[:n]


def run_pilot(n: int = 50) -> None:
    sample = load_sample(n)
    if not sample:
        print(
            f"No raw items found in {config.RAW_DIR}. Run the collectors first "
            "(collectors/reddit_collect.py etc.)."
        )
        return

    print(f"Running pilot on {len(sample)} items (requested {n})...")

    out_path = config.PILOT_DIR / "pilot_output.jsonl"
    field_present: dict[str, int] = {}
    total = 0

    for i, item in enumerate(sample, 1):
        try:
            lens = lens_for_source(item["source"])
        except (ValueError, KeyError):
            continue

        prompt = build_prompt(item["text"], lens)
        model = config.GROQ_MODEL_EXTRACTION
        try:
            extracted = extract_one(prompt, model)
        except GroqNotConfigured as exc:
            print(str(exc))
            return

        if extracted is None:
            continue

        total += 1
        record = {**item, "lens": lens, "extraction": extracted}
        append_jsonl(out_path, [record])

        for key in extracted:
            field_present[key] = field_present.get(key, 0) + 1

        if i % 10 == 0:
            print(f"  {i}/{len(sample)} processed")

    print(f"\nPilot done. {total} successful extractions written to {out_path}\n")
    print_null_rate_report(field_present, total)


def print_null_rate_report(field_present: dict[str, int], total: int) -> None:
    if total == 0:
        print("No successful extractions — nothing to report.")
        return

    print(f"{'Field':<28}{'Present':>10}{'Null rate':>12}  Verdict")
    print("-" * 70)
    for field in sorted(field_present, key=lambda f: field_present[f]):
        present = field_present[field]
        null_rate = 1 - (present / total)
        verdict = "DROP OR REWRITE" if null_rate > 0.95 else "ok"
        print(f"{field:<28}{present:>10}{null_rate:>11.0%}  {verdict}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=50)
    args = parser.parse_args()
    run_pilot(args.n)
