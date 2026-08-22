"""iOS App Store review collector — retrospective lens source.

Uses Apple's public RSS customer-reviews feed directly (itunes.apple.com/
.../rss/customerreviews/...) rather than the `app-store-scraper` PyPI
package — that package returned "Expecting value" JSON-decode errors on
every request when tested against the real Myntra app id (2026-08-19,
confirmed via `AppStore.review()`), while the RSS endpoint itself works
fine when hit directly with plain `requests`. Apple caps this feed at 10
pages of 50 reviews each (500 total) — confirmed live: page 11 returns the
plain-text error "CustomerReviews RSS page depth is limited to 10". That's
a hard Apple-side limit, not a bug to work around.

Usage:
    python -m collectors.appstore_collect
"""

import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

MAX_PAGES = 10  # Apple's own RSS feed depth limit — confirmed live, not adjustable


def collect() -> None:
    if config.APPSTORE_APP_ID is None:
        print(
            "config.APPSTORE_APP_ID is not set. Look up Myntra's numeric App Store ID "
            "from its listing URL (apps.apple.com/in/app/<slug>/id<NUMBER>) and set "
            "APPSTORE_APP_ID in config.py before running this."
        )
        return

    print(f"Pulling App Store reviews for {config.APPSTORE_APP_NAME} (id={config.APPSTORE_APP_ID})")

    records = []
    for page in range(1, MAX_PAGES + 1):
        url = (
            f"https://itunes.apple.com/{config.APPSTORE_COUNTRY}/rss/customerreviews/"
            f"page={page}/id={config.APPSTORE_APP_ID}/sortby=mostrecent/json"
        )
        try:
            resp = requests.get(url, timeout=15)
        except requests.RequestException as exc:
            print(f"  Page {page} request failed: {exc}")
            break

        if not resp.ok:
            print(f"  Page {page}: HTTP {resp.status_code}, stopping.")
            break

        try:
            data = resp.json()
        except ValueError:
            print(f"  Page {page}: non-JSON response (likely Apple's page-depth limit), stopping.")
            break

        entries = data.get("feed", {}).get("entry", [])
        if not entries:
            print(f"  Page {page}: no entries, stopping.")
            break

        for entry in entries:
            if "im:rating" not in entry:
                continue  # feed metadata entry (app info), not a review
            record = _entry_to_record(entry)
            if record["text"]:
                records.append(record)

        print(f"  Page {page}: {len(entries)} entries")

        if len(records) >= config.APPSTORE_MAX_REVIEWS:
            break

    records = records[: config.APPSTORE_MAX_REVIEWS]
    out_path = config.RAW_DIR / "appstore.jsonl"
    written = append_jsonl(out_path, records)
    print(f"Done. {written} new App Store reviews written to {out_path} (pulled {len(records)} total, Apple caps this feed at {MAX_PAGES * 50})")


def _entry_to_record(entry: dict) -> dict:
    review_id = entry.get("id", {}).get("label", "")
    rating_label = entry.get("im:rating", {}).get("label", "")
    return {
        "source": "appstore_review",
        "source_url": f"https://apps.apple.com/{config.APPSTORE_COUNTRY}/app/{config.APPSTORE_APP_NAME}/id{config.APPSTORE_APP_ID}?see-all=reviews#review-{review_id}",
        "date": entry.get("updated", {}).get("label"),
        "rating": int(rating_label) if rating_label.isdigit() else None,
        "text": entry.get("content", {}).get("label", ""),
    }


if __name__ == "__main__":
    collect()
