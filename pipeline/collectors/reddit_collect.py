"""Reddit collector — unauthenticated public .json endpoints (fallback).

Originally built on PRAW/OAuth (Reddit's official free "script" app tier).
Reddit has since tightened API access and no longer reliably issues free
OAuth credentials for a student/non-commercial account — see
problem_statement.md §9 for the full note. This collector falls back to
Reddit's public .json representation of ordinary pages instead, which needs
no registration at all.

This is a lower-confidence-on-ToS path than the official API was, so it's
used deliberately lightly: a descriptive, honest User-Agent (not a spoofed
browser one), a fixed delay between requests, and comments pulled for only
the top N posts per search term rather than every result. If Reddit blocks
or rate-limits this from your network, that's an acceptable outcome, not a
bug to work around harder — treat Reddit as a best-effort minor source and
lean the corpus on Play/App Store instead (problem_statement.md
§9), or manually paste individual Reddit posts/comments you find by normal
browsing into the dashboard's Panel B live extractor, which needs no Reddit
access at all.

Usage:
    python -m collectors.reddit_collect
"""

import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

HEADERS = {"User-Agent": config.REDDIT_USER_AGENT}


def _get(url: str, params: dict | None = None) -> object | None:
    time.sleep(config.REDDIT_REQUEST_DELAY_SECONDS)
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
    except requests.RequestException as exc:
        print(f"    Request failed: {exc}")
        return None

    if resp.status_code == 429:
        print("    Rate limited by Reddit — stopping this term early.")
        return None
    if not resp.ok:
        print(f"    HTTP {resp.status_code} from Reddit — stopping this term early.")
        return None
    try:
        return resp.json()
    except ValueError:
        print("    Non-JSON response (likely blocked) — stopping this term early.")
        return None


def collect() -> None:
    out_path = config.RAW_DIR / "reddit.jsonl"
    total_written = 0

    for term in config.REDDIT_SEARCH_TERMS:
        print(f"Searching Reddit for: {term!r}")
        data = _get(
            "https://www.reddit.com/search.json",
            params={"q": term, "sort": "relevance", "limit": min(100, config.REDDIT_MAX_ITEMS_PER_TERM)},
        )
        if not data:
            continue

        posts = data.get("data", {}).get("children", [])
        records = [_post_to_record(p.get("data", {}), term) for p in posts]

        for post in posts[: config.REDDIT_MAX_POSTS_FOR_COMMENTS_PER_TERM]:
            p = post.get("data", {})
            permalink = p.get("permalink")
            if not permalink:
                continue
            comment_page = _get(f"https://www.reddit.com{permalink}.json")
            if not comment_page or len(comment_page) < 2:
                continue
            comments = comment_page[1].get("data", {}).get("children", [])
            for c in comments:
                cd = c.get("data", {})
                body = cd.get("body", "")
                if body and body not in ("[deleted]", "[removed]") and len(body) > 20:
                    records.append(_comment_to_record(cd, p, term))

        written = append_jsonl(out_path, records)
        total_written += written
        print(f"  +{written} new items (from {len(records)} candidates)")

    print(f"Done. {total_written} new Reddit items written to {out_path}")
    if total_written == 0:
        print(
            "  Zero items collected — Reddit may be blocking unauthenticated requests from "
            "this network. See this file's module docstring for fallback options."
        )


def _post_to_record(p: dict, matched_term: str) -> dict:
    created = p.get("created_utc")
    return {
        "source": "reddit_post",
        "source_url": f"https://reddit.com{p.get('permalink', '')}",
        "date": datetime.fromtimestamp(created, tz=timezone.utc).isoformat() if created else None,
        "subreddit": p.get("subreddit"),
        "matched_term": matched_term,
        "text": f"{p.get('title', '')}\n\n{p.get('selftext', '')}".strip(),
    }


def _comment_to_record(c: dict, post: dict, matched_term: str) -> dict:
    created = c.get("created_utc")
    return {
        "source": "reddit_comment",
        "source_url": f"https://reddit.com{post.get('permalink', '')}{c.get('id', '')}/",
        "date": datetime.fromtimestamp(created, tz=timezone.utc).isoformat() if created else None,
        "subreddit": c.get("subreddit"),
        "matched_term": matched_term,
        "text": c.get("body", ""),
    }


if __name__ == "__main__":
    collect()
