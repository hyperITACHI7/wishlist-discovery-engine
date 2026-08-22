"""Second manual Reddit ingestion batch — 2026-08-19. Same method and same
copyright/extraction discipline as _manual_reddit_batch_20260818.py (see
that file's docstring for the full rationale) — human-driven Chrome
session, structured extractions in the analyst's own words, at most one
short attributed quote per record, never bulk-copied text.

Found via DuckDuckGo site:reddit.com search (Reddit's own search and the
unauthenticated .json fallback are both blocked — see reddit_collect.py).

Threads read, all genuinely new (not overlapping the 2026-08-18 batch):

4. r/IndianFashionAddicts — "Do you guys buy from Myntra? How do you
   discover clothes?" — rich thread on browsing/choice-overload paralysis
   and offsite research (Pinterest/Instagram/Google) used to form purchase
   intent before returning to Myntra to filter-search. OP explicitly wishes
   Myntra had its own "inspiration board" — a real unmet need distinct from
   the platform's existing size/fit tooling.
5. r/IndianBeautyDeals — "List of some myntra eors offers" (a sale-event
   thread) — strong price-watching wishlist evidence: multiple commenters
   describe wishlisting items specifically to track a sale price, and
   frustration when items got MORE expensive once the sale started, or
   when they delayed and missed a better window. Beauty category, not
   apparel — useful category diversity.
6. r/IndianFashionAddicts — "Whats going on with Myntra?" — mostly an
   unrelated delivery-date-estimate bug thread; only one comment (trust/
   quality scepticism toward a third-party marketplace brand sitting in a
   wishlist) was on-topic enough to extract.

Dates are approximate ("3 years ago" relative timestamps, year-only
precision — no day/month signal available).

Run once: `python -m collectors._manual_reddit_batch_20260819`
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

THREAD_4 = "https://old.reddit.com/r/IndianFashionAddicts/comments/14k5wqe/do_you_guys_buy_from_myntra_how_do_you_discover/"
THREAD_5 = "https://old.reddit.com/r/IndianBeautyDeals/comments/zga66x/list_of_some_myntra_eors_offers/"
THREAD_6 = "https://old.reddit.com/r/IndianFashionAddicts/comments/14cbt53/whats_going_on_with_myntra/"

RECORDS = [
    # --- Thread 4: discovery/choice-overload paralysis + offsite research ---
    {
        "source": "reddit_post",
        "source_url": THREAD_4,
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Pinterest", "Instagram"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "decision_factors": ["no specific purchase target", "choice overload from undifferentiated browsing"],
            "confidence": "high",
            "current_blocker_freeform": "opens Myntra with no specific item in mind, scrolls endlessly across Myntra/Pinterest/Instagram in a loop, and never converges on a decision — describes it as no longer even enjoyable",
            "offsite_research": "cycles between Myntra, Pinterest, and Instagram looking for style inspiration before being able to narrow a search on Myntra itself",
            "mentions_wishlist": False,
            "verbatim_quote": "It's just a never-ending cycle",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_4}#by-a_leaf_yaaaa",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "not-determinable",
            "decision_factors": ["undirected browsing produces too many competing options to choose between"],
            "confidence": "high",
            "current_blocker_freeform": "states as a general rule that scrolling without a specific target makes a shopper like ~100 items and dislike ~100 more, and the volume itself is what prevents any purchase",
            "workaround": "recommends knowing the specific item type wanted before browsing, then applying filters (price, colour, brand, fit) immediately rather than browsing openly",
            "mentions_wishlist": False,
            "verbatim_quote": "you will like 100 things and dislike another 100 and eventually won't end up buying anything",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_4}#by-popi121-followup",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Pinterest"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "decision_factors": ["Myntra lacks a moodboard/inspiration-collection feature"],
            "confidence": "medium",
            "offsite_research": "builds a Pinterest board first to identify recurring styles/colours before searching Myntra with that reference in mind — explicitly frames this as a workaround, not a preference",
            "workaround": "maintains the style-reference step entirely outside Myntra (Pinterest board) since no equivalent inspiration/moodboard tool exists inside the app",
            "mentions_wishlist": False,
            "verbatim_quote": "it would have been easier if such pinterest board thing available in myntra itself",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_4}#by-Early_Implement0",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "segment_signal": "distinguishes easy vs. hard product categories from direct purchase experience",
            "decision_factors": ["category-specific fit/style uncertainty (shirts, casual shoes, perfume) vs. low-risk basics (tees, socks, pyjamas)"],
            "confidence": "high",
            "current_blocker_freeform": "basics (tees, shorts, socks) are bought confidently, but shirts/casual shoes/perfume are described as much harder to get right sight-unseen",
            "post_purchase_outcome": "returned",
            "resolution_reason": "gift-card balance was refunded cleanly after the return, which is why the category was still attempted despite the known risk",
            "mentions_wishlist": False,
            "verbatim_quote": "Harder to get right are shirts, casual shoes, perfumes etc",
        },
    },
    # --- Thread 5: price-watching wishlist behaviour (beauty category, EORS sale) ---
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_5}#by-preetivish",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "intent_evidence": "Some of the products I wishlisted, actually became costlier once the sale started",
            "segment_signal": "explicitly a sale-price-watcher — wishlist used to time a purchase around a known sale event",
            "decision_factors": ["wishlisted specifically anticipating a sale-time price drop"],
            "confidence": "high",
            "current_blocker_freeform": "wishlisted items ahead of a known sale event expecting a price drop, and instead saw prices rise once the sale began",
            "mentions_wishlist": True,
            "verbatim_quote": "Some of the products I wishlisted, actually became costlier once the sale started",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_5}#by-witchywitch8",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "decision_factors": ["deferred purchase waiting for a believed-better price window"],
            "confidence": "high",
            "current_blocker_freeform": "saw the best offers at the sale's opening hour (midnight) but delayed purchase, and by the time they returned to buy, pricing had gotten worse",
            "deferral_trigger": "expected prices to stay flat or improve further into the sale window; the actual pattern (best pricing right at launch) worked against that expectation",
            "mentions_wishlist": False,
            "verbatim_quote": "There were far better offers at midnight and i delayed",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_5}#by-Lazy-Me",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "intent_evidence": "I added a lot of things in wish list and they all have increased prices now",
            "decision_factors": ["wishlist used explicitly as a price-tracking tool ahead of a sale"],
            "confidence": "high",
            "current_blocker_freeform": "multiple wishlisted items rose in price after the sale's opening window passed, directly blocking the intended purchases",
            "mentions_wishlist": True,
            "verbatim_quote": "I added a lot of things in wish list and they all have increased prices now",
        },
    },
    # --- Thread 6: trust/quality scepticism toward a marketplace brand (minor, one relevant comment) ---
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_6}#by-harshit1151",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Trendyol"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "I have few items in wishlist z sceptical about the price/quality",
            "segment_signal": "specifically distrustful of a third-party/imported marketplace brand rather than Myntra-stocked brands generally",
            "decision_factors": ["unfamiliar/imported brand", "no personal or peer track record for quality"],
            "confidence": "medium",
            "current_blocker_freeform": "items from a specific imported marketplace brand sit in the wishlist unpurchased due to price/quality scepticism, distinct from trust in Myntra's own better-known brands",
            "mentions_wishlist": True,
            "verbatim_quote": "I have few items in wishlist z sceptical about the price/quality",
        },
    },
]


def main() -> None:
    out_path = config.EXTRACTED_DIR / "extracted.jsonl"
    written = append_jsonl(out_path, RECORDS)
    print(f"Wrote {written} manually-extracted Reddit records to {out_path} ({len(RECORDS)} candidates, deduped by source_url).")


if __name__ == "__main__":
    main()
