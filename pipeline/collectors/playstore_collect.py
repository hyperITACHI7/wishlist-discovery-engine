"""Google Play Store review collector — retrospective lens source.

Highest-volume, cheapest, most ToS-friendly source (problem_statement.md
§9). No auth needed; google-play-scraper reads the public reviews endpoint.

Usage:
    python -m collectors.playstore_collect
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl


def collect() -> None:
    try:
        from google_play_scraper import Sort, reviews
    except ImportError:
        print("google-play-scraper is not installed. Run: pip install -r pipeline/requirements.txt")
        return

    print(f"Pulling Play Store reviews for {config.PLAYSTORE_APP_ID} (verify this is still the correct package id)")

    all_reviews = []
    continuation_token = None
    try:
        while len(all_reviews) < config.PLAYSTORE_MAX_REVIEWS:
            batch, continuation_token = reviews(
                config.PLAYSTORE_APP_ID,
                lang=config.PLAYSTORE_LANG,
                country=config.PLAYSTORE_COUNTRY,
                sort=Sort.NEWEST,
                count=200,
                continuation_token=continuation_token,
            )
            if not batch:
                break
            all_reviews.extend(batch)
            if continuation_token is None:
                break
    except Exception as exc:
        print(f"Play Store pull failed: {exc}")
        print("If this is a 404/lookup error, double-check PLAYSTORE_APP_ID in config.py.")
        return

    records = [
        {
            "source": "playstore_review",
            "source_url": f"https://play.google.com/store/apps/details?id={config.PLAYSTORE_APP_ID}&reviewId={r['reviewId']}",
            "date": r["at"].isoformat() if r.get("at") else None,
            "rating": r.get("score"),
            "text": r.get("content", ""),
        }
        for r in all_reviews
        if r.get("content")
    ]

    out_path = config.RAW_DIR / "playstore.jsonl"
    written = append_jsonl(out_path, records)
    print(f"Done. {written} new Play Store reviews written to {out_path} (pulled {len(all_reviews)} total)")


if __name__ == "__main__":
    collect()
