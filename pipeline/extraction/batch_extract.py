"""Full-corpus batch extraction — run only after the pilot's null-rate
report looks acceptable (extraction/pilot.py). Uses the fast/small model
per the tiering decision in problem_statement.md §10.

Usage:
    python -m extraction.batch_extract
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl, read_jsonl
from extraction.groq_client import GroqNotConfigured, extract_one
from extraction.prompts import build_prompt, lens_for_source

RAW_FILES = ["reddit.jsonl", "playstore.jsonl", "appstore.jsonl"]


def run_batch() -> None:
    out_path = config.EXTRACTED_DIR / "extracted.jsonl"
    already_done = {r["source_url"] for r in read_jsonl(out_path) if r.get("source_url")}

    total_new = 0
    for filename in RAW_FILES:
        raw_path = config.RAW_DIR / filename
        items = [r for r in read_jsonl(raw_path) if r.get("source_url") not in already_done]
        if not items:
            continue

        print(f"{filename}: extracting {len(items)} items")
        for i, item in enumerate(items, 1):
            try:
                lens = lens_for_source(item["source"])
            except (ValueError, KeyError):
                continue

            prompt = build_prompt(item["text"], lens)
            try:
                extracted = extract_one(prompt, config.GROQ_MODEL_EXTRACTION)
            except GroqNotConfigured as exc:
                print(str(exc))
                return
            except Exception as exc:
                # Confirmed 2026-08-19: an uncaught network-level exception
                # (SSL handshake timeout) took down an entire 700-item run
                # after 100+ successful extractions. groq_client.py now
                # retries network errors internally, but this is a second
                # line of defense — no single item should ever be able to
                # kill a multi-hundred-item batch again. Resumable design
                # (skip already-done source_urls) means a real crash still
                # loses nothing except this one item.
                print(f"    Unexpected error on item, skipping: {exc.__class__.__name__}: {exc}")
                continue

            if extracted is None:
                continue

            record = {**item, "lens": lens, "extraction": extracted}
            append_jsonl(out_path, [record])
            total_new += 1

            if i % 50 == 0:
                print(f"  {i}/{len(items)} processed")

    print(f"\nBatch extraction done. {total_new} new records written to {out_path}")
    print("Next: dedupe + frequency-count in plain code, then one synthesis call (see problem_statement.md §10 steps 5-6).")


if __name__ == "__main__":
    run_batch()
