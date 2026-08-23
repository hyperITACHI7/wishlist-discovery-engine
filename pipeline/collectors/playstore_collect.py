"""Google Play Store review collector — retrospective lens source.

Highest-volume, cheapest, most ToS-friendly source (problem_statement.md
§9). No auth needed; google-play-scraper reads the public reviews endpoint.

TWO COLLECTION MODES, and the second one exists for a real reason
(problem_statement.md §22):

`collect()` pulls newest-first, which mirrors the store's own rating
distribution — and Myntra's is 82.6% five-star. Measured on the first 700
raw reviews: only 59 were 1-2 star, and only 4.3% of extracted App/Play
records carried ANY friction signal (blocker, workaround, deferral, or a
regret/returned outcome). A corpus that lopsided doesn't just dilute the
blocker analysis, it actively corrupts it — theme ranking driven by phrase
frequency will rank "Price & Value" first on the strength of hundreds of
people saying "value for money" as PRAISE.

`collect_critical()` fixes the intake side of that by pulling low-star
reviews explicitly via google-play-scraper's `filter_score_with`. This is
deliberate, disclosed sampling bias, not a neutral sample: it is the
correct move when the question is "what blocks purchase" and the default
sample answers "did the product arrive nice." Both pools stay in the same
corpus and every record keeps its `rating`, so the mix is always auditable
and can be re-weighted later.

No App Store equivalent exists. Apple's RSS feed supports only
sortby=mostrecent/mosthelpful — `sortby=mostcritical` returns HTTP 500
(tested live 2026-08-23) — and the feed is hard-capped at 500 reviews,
which this project has already fully pulled. So the negative-signal top-up
is Play-Store-only, and the resulting Play/App imbalance is a known,
stated consequence rather than an oversight.

Usage:
    python -m collectors.playstore_collect            # newest-first (default mix)
    python run_pipeline.py collect-playstore-critical  # 1/2/3-star only
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


def collect_critical() -> None:
    """Pull 1/2/3-star reviews specifically — the friction-bearing tail the
    default newest-first sample buries under 5-star praise. See the module
    docstring for why this deliberate skew is the right call here."""
    try:
        from google_play_scraper import Sort, reviews
    except ImportError:
        print("google-play-scraper is not installed. Run: pip install -r pipeline/requirements.txt")
        return

    print(f"Pulling CRITICAL (1/2/3-star) Play Store reviews for {config.PLAYSTORE_APP_ID}")

    all_reviews = []
    for score in config.PLAYSTORE_CRITICAL_SCORES:
        collected_for_score = 0
        continuation_token = None
        while collected_for_score < config.PLAYSTORE_CRITICAL_PER_SCORE:
            try:
                batch, continuation_token = reviews(
                    config.PLAYSTORE_APP_ID,
                    lang=config.PLAYSTORE_LANG,
                    country=config.PLAYSTORE_COUNTRY,
                    sort=Sort.NEWEST,
                    count=200,
                    filter_score_with=score,
                    continuation_token=continuation_token,
                )
            except Exception as exc:
                print(f"  {score}-star pull failed: {exc}")
                break
            if not batch:
                break
            all_reviews.extend(batch)
            collected_for_score += len(batch)
            if continuation_token is None:
                break
        print(f"  {score}-star: {collected_for_score} pulled")

    records = [
        {
            "source": "playstore_review",
            "source_url": f"https://play.google.com/store/apps/details?id={config.PLAYSTORE_APP_ID}&reviewId={r['reviewId']}",
            "date": r["at"].isoformat() if r.get("at") else None,
            "rating": r.get("score"),
            "text": r.get("content", ""),
            # Flags which intake path produced this record. The default
            # newest-first pull leaves this absent, so the two pools stay
            # distinguishable in the corpus for honest re-weighting later.
            "collection_mode": "critical_filtered",
        }
        for r in all_reviews
        if r.get("content")
    ]

    out_path = config.RAW_DIR / "playstore.jsonl"
    written = append_jsonl(out_path, records)
    print(f"Done. {written} new critical reviews written to {out_path} ({len(records)} pulled, rest were already collected)")


if __name__ == "__main__":
    collect()
