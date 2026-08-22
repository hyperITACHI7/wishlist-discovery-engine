"""One-off manual Reddit ingestion batch — 2026-08-18.

Why this file exists and why it looks different from the rest of the
pipeline: Reddit blocks both the official OAuth API (no free script-app
credentials issued anymore) and reddit_collect.py's unauthenticated .json
fallback (confirmed live — 403 on every search term from this network, see
problem_statement.md §9). As an interim, small-scale substitute, threads
were browsed interactively via the Claude Chrome extension (a real,
human-driven browser session) and read for relevant signal.

This does NOT store raw copied post/comment text. Each record here is a
human-written STRUCTURED EXTRACTION (same shape extraction/batch_extract.py
would have produced from an LLM) — short paraphrases in the analyst's own
words plus, where one exists, a single short contiguous quote (<15 words,
attributed via source_url) as evidence. That's a deliberate choice, not
just a style preference: bulk-copying full comment bodies into a dataset
file would be reproducing copyrighted material at a scale this project
doesn't need and shouldn't do, whereas short evidentiary fragments backing
an analytical extraction is exactly what the schema in problem_statement.md
§6 was designed to produce either way (LLM-run or human-run).

Threads read (all r/IndianFashionAddicts unless noted), all genuinely
relevant to wishlist/cart decision behaviour in Indian online fashion
shopping — two are Savana-primary with Myntra mentioned alongside, flagged
via platform_mentioned on each record so this doesn't get silently treated
as Myntra-specific fact (see 06-Assumptions-Register.md #14 in the vault):

1. r/MyntraSucks — "Myntra doesn't want me to wishlist the products" —
   the wishlist has a ~1000-item cap; heavy wishlisters hit it and have to
   delete old items to keep saving new ones.
2. r/IndianFashionAddicts — "Do you also remove half your cart right
   before ordering?" — rich thread on cart-culling heuristics (fabric
   checks, review-recency + customer-photo trust over star rating,
   cost-per-wear, side-by-side variant comparison, "sleep on it" delay,
   passive resolution via stockout).
3. r/IndianFashionAddicts — "Do people actually buy clothes for their real
   life anymore or just for the vibe?" — direct evidence of wishlisting an
   imagined future self/occasion rather than a planned purchase, plus two
   concrete versatility heuristics ("4 outfits or it goes", "two normal
   styling options before buying").

Dates are approximate, computed from Reddit's relative timestamps
("28 days ago" etc.) against the browsing date — not exact.

Run once: `python -m collectors._manual_reddit_batch_20260818`
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

THREAD_1 = "https://old.reddit.com/r/MyntraSucks/comments/1pemstf/myntra_doesnt_want_me_to_wishlist_the_products/"
THREAD_2 = "https://old.reddit.com/r/IndianFashionAddicts/comments/1v1wlcg/do_you_also_remove_half_your_cart_right_before/"
THREAD_3 = "https://old.reddit.com/r/IndianFashionAddicts/comments/1umsu9n/do_people_actually_buy_clothes_for_their_real/"

RECORDS = [
    # --- Thread 1: wishlist cap (Myntra-specific) ---
    {
        "source": "reddit_post",
        "source_url": THREAD_1,
        "date": "2025-12-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "MyntraSucks",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "Myntra won't let me wishlist after a certain point",
            "segment_signal": "heavy/frequent wishlister",
            "decision_factors": ["wishlist capacity limit"],
            "confidence": "medium",
            "current_blocker_freeform": "hit an undisclosed wishlist item cap and can no longer add new items without first removing old ones",
            "mentions_wishlist": True,
            "verbatim_quote": "Myntra won't let me wishlist after a certain point",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_1}#by-deleted-user-1",
        "date": "2025-12-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "MyntraSucks",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "have to go there and remove some products to keep wishlisting",
            "segment_signal": "heavy wishlister, cap confirmed at ~1000 items",
            "decision_factors": ["wishlist capacity limit"],
            "confidence": "high",
            "workaround": "manually deletes older wishlist items specifically to free up room to save new ones",
            "current_blocker_freeform": "the 1000-product wishlist limit",
            "mentions_wishlist": True,
            "verbatim_quote": "have to go there and remove some products to keep wishlisting",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_1}#by-666wife",
        "date": "2025-12-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "MyntraSucks",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "not-determinable",
            "segment_signal": "self-identified chronic/heavy online shopper",
            "decision_factors": ["cross-platform comparison of wishlist limits"],
            "confidence": "medium",
            "offsite_research": "notes the same wishlist-cap pattern exists on other apps (Urbanic/Savana capped around 500), framing it as an industry norm rather than a Myntra-specific flaw",
            "mentions_wishlist": True,
        },
    },
    # --- Thread 2: cart-culling behaviour (Savana-primary, cross-platform pattern) ---
    {
        "source": "reddit_post",
        "source_url": THREAD_2,
        "date": "2026-07-21",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "intent_evidence": "my cart goes from 12 items to 3 items",
            "decision_factors": ["fabric quality", "outfit repeatability", "occasion fit", "reviews"],
            "confidence": "high",
            "current_blocker_freeform": "adds items to cart with real intent, then at checkout re-evaluates each one against actual planned occasions and removes most of them",
            "workaround": "treats the checkout screen itself as a forced deliberation step, deliberately trimming the cart down before paying rather than deciding at add-to-cart time",
            "mentions_wishlist": False,
            "verbatim_quote": "my cart goes from 12 items to 3 items",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_2}#by-AssignmentEnough639",
        "date": "2026-07-21",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "intent_evidence": "cost per wear beats cuteness",
            "segment_signal": "works in clothing production, applies professional fabric-composition scrutiny while shopping",
            "decision_factors": ["fabric composition/weight transparency", "review recency + customer photos over star rating", "cost-per-wear vs cuteness", "a delay before purchase"],
            "confidence": "high",
            "workaround": "sorts reviews by newest and only trusts ones with customer photos rather than the aggregate star rating (reasoning: fabric quality drifts between production batches); sleeps on borderline items overnight as a final filter",
            "resolution_reason": "an item that's still remembered/wanted the next day is judged worth buying; the overnight gap functions as the actual decision mechanism",
            "mentions_wishlist": False,
            "verbatim_quote": "cost per wear beats cuteness",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_2}#by-DeliberatelyInsane",
        "date": "2026-07-21",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "decision_factors": ["direct side-by-side comparison of near-identical options"],
            "confidence": "medium",
            "comparison_behavior": "deliberately adds several close variants of the same item type (e.g. multiple shirts) to cart at once specifically so they render side by side in the cart UI, making the final choice between them easier",
            "mentions_wishlist": False,
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_2}#by-Objective-Isopod5443",
        "date": "2026-07-21",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "let it marinate while I overthink",
            "decision_factors": ["overconsumption awareness"],
            "confidence": "medium",
            "current_blocker_freeform": "leaves items in cart to think it over, and a meaningful share of the time the decision never actually gets made",
            "resolution_reason": "passive resolution — the item goes out of stock, or the user simply backs out, rather than an active decision either way",
            "post_purchase_outcome": "unclear",
            "mentions_wishlist": False,
            "verbatim_quote": "let it marinate while I overthink",
        },
    },
    # --- Thread 3: wishlisting an imagined future self vs. planned use (names Myntra directly) ---
    {
        "source": "reddit_post",
        "source_url": THREAD_3,
        "date": "2026-07-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "half the clothes I save are not for anything I actually have planned",
            "decision_factors": ["imagined future occasion vs. actual calendar"],
            "confidence": "high",
            "save_motivation": "saves items while picturing an idealized future occasion or version of themselves (a cafe day, a trip) rather than a real planned event",
            "current_blocker_freeform": "on reviewing the wishlist later, realizes most saved items don't map to anything actually scheduled",
            "mentions_wishlist": True,
            "verbatim_quote": "half the clothes I save are not for anything I actually have planned",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_3}#by-mihikittyHoarder",
        "date": "2026-07-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "decision_factors": ["wardrobe-versatility threshold"],
            "confidence": "high",
            "workaround": "applies a concrete rule before buying: if the item can't be combined into at least 4 different outfits using clothes already owned, it gets removed from the cart/wishlist",
            "resolution_reason": "the outfit-count threshold is the deciding test, not a subjective feeling",
            "mentions_wishlist": False,
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_3}#by-Interesting_Talk7144",
        "date": "2026-07-18",
        "date_precision": "approximate_from_relative_timestamp",
        "subreddit": "IndianFashionAddicts",
        "matched_term": "myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Savana"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "buy-intent",
            "intent_evidence": "style the same thing in at least two normal ways",
            "decision_factors": ["styling versatility beyond the imagined special occasion"],
            "confidence": "medium",
            "current_blocker_freeform": "used to save items for a specific imagined occasion (vacation, nice dinner) that often wasn't actually planned",
            "workaround": "now checks whether a saved item can be styled at least two ordinary, non-special-occasion ways before buying it",
            "mentions_wishlist": True,
            "verbatim_quote": "style the same thing in at least two normal ways",
        },
    },
]


def main() -> None:
    out_path = config.EXTRACTED_DIR / "extracted.jsonl"
    written = append_jsonl(out_path, RECORDS)
    print(f"Wrote {written} manually-extracted Reddit records to {out_path} ({len(RECORDS)} candidates, deduped by source_url).")


if __name__ == "__main__":
    main()
