"""Third manual Reddit ingestion batch — 2026-08-23. Same method and same
copyright/extraction discipline as _manual_reddit_batch_20260818.py and
_manual_reddit_batch_20260819.py (see the first file's docstring for the
full rationale) — human-driven Chrome session via the Claude Chrome
extension, structured extractions in the analyst's own words, at most one
short attributed quote per record, never bulk-copied text.

Motivation: problem_statement.md §21 found that 6 of the brief's 10
questions (Q1, Q2, Q3, Q6, Q9, Q10) were capped not by weak signal but by
Reddit corpus SIZE — their fields fire at 6-72% per-record on the 18-record
Reddit lens, essentially never on the 560-record App/Play lens. This batch
exists to test that diagnosis directly by adding real Reddit volume.

Threads found via DuckDuckGo site:reddit.com searches (Reddit's own search
and the unauthenticated .json fallback are both blocked — see
reddit_collect.py). None overlap the 18-08 or 19-08 batches (verified by
comparing thread IDs before writing anything).

Threads read:

7. r/IndianBeautyDeals — "What's in your Myntra cart??" — cart-culling and
   budget-ceiling behaviour (cutting a ~12k cart in half), a
   replenishment-gated wishlist habit (only rebuy once the old one runs
   out), and a "wait for the bigger sale" deferral.
8. r/developersIndia — "I'm genuinely curious how Myntra's pricing
   algorithm works!" — the richest thread in this batch. Multiple
   independent accounts of watching a wishlisted/carted item's price rise
   rather than fall while waiting, including one user (Brilliant-Change-111)
   who names concrete offsite price-history tools (BuyHatke, cross-checking
   Flipkart/Amazon) and states a wishlist-first, price-check-before-buying
   workaround explicitly. Genuine new offsite_research signal, a field this
   corpus was thin on (3/578 before this batch).
9. r/IndianFashionAddicts — "Myntra and west side" — read in full (109
   comments), rejected entirely. Pure outfit-styling compliments, no
   purchase-decision content. Extracting nothing here rather than
   force-fitting marginal records was the deliberate call.
10. r/IndianBeautyDeals — "MYNTRA IS INSANE! 90% on Clinique!!!!!" — discount
    depth vs. authenticity suspicion (old-stock/counterfeit doubt from
    Fragrantica reviews outweighing a steep discount), and a "no real
    occasion, so no real need" self-talk-out-of-it pattern.
11. r/IndianBeautyTalks — "Drop your best Myntra/Ajio sale finds—before I
    buy nonsense again" — crowdsourced pre-purchase validation (asking a
    subreddit which deals are real before buying), direct platform price
    comparison (Myntra vs. Nykaa on the same item), and the sharpest single
    finding in this batch: a shortlisted dress that went FROM 1300 TO 1800
    once the sale it was held for actually started — the deferral didn't
    just fail to pay off, it actively backfired. This one record
    (okbyebitch_) is about Ajio, not Myntra; kept anyway since the
    behaviour pattern is identical and platform_mentioned records it
    honestly rather than silently folding it into Myntra's numbers.

Two boundary calls made during extraction:
- The okbyebitch_ record above describes Ajio. Kept, not discarded — see
  above.
- Several qualifying comments from [deleted] accounts were skipped
  (including a good "should've just bought it, now regret waiting"
  quote) because a [deleted] username can't anchor a verifiable
  #by-username source_url, which would break this file's own audit trail.

Run once: `python -m collectors._manual_reddit_batch_20260823`
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

THREAD_7 = "https://old.reddit.com/r/IndianBeautyDeals/comments/pztrbt/whats_in_your_myntra_cart/"
THREAD_8 = "https://old.reddit.com/r/developersIndia/comments/1n81vxa/im_genuinely_curious_how_myntras_pricing/"
# THREAD_9 (r/IndianFashionAddicts, "Myntra and west side") yielded zero
# records — read in full and rejected, see docstring above.
THREAD_10 = "https://old.reddit.com/r/IndianBeautyDeals/comments/13vx5d4/myntra_is_insane_90_on_clinique/"
THREAD_11 = "https://old.reddit.com/r/IndianBeautyTalks/comments/1pduzv5/drop_your_best_myntraajio_sale_findsbefore_i_buy/"

RECORDS = [
    # --- Thread 7: cart-culling / budget ceiling / replenishment-gated wishlist ---
    {
        "source": "reddit_post",
        "source_url": THREAD_7,
        "date": "2022",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "site:reddit.com myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "unclear",
            "intent_signal": "buy-intent",
            "intent_evidence": "I have a ton of clothes",
            "decision_factors": ["total cart value", "budget ceiling"],
            "confidence": "high",
            "comparison_behavior": "plans to cut a ~12k cart down by roughly half before checking out, trimming across clothes, makeup and boots rather than removing one category",
            "current_blocker_freeform": "cart total has grown past what they want to spend, so the decision has shifted from what to buy to what to drop",
            "mentions_wishlist": False,
            "verbatim_quote": "It all is rounding up to like 12k. I want to cut it in half",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_7}#by-sriv_m",
        "date": "2022",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "site:reddit.com myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "buy-intent",
            "intent_evidence": "I bought things that were on my wishlist",
            "decision_factors": ["sale timing", "running out of an existing product"],
            "confidence": "high",
            "save_motivation": "keeps a standing wishlist / to-buy list of products they already know they want, and treats a sale as the moment to restock them",
            "workaround": "gates purchases on replenishment need rather than desire, only buying a replacement once the current one is finished",
            "deferral_trigger": "waits for a sale and for the existing product to run out before converting a saved item",
            "mentions_wishlist": True,
            "verbatim_quote": "I usually only buy a new product when my old one is over",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_7}#by-Introverted_gal",
        "date": "2022",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "site:reddit.com myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "contemplating to splurge or not",
            "decision_factors": ["price / splurge justification", "size availability"],
            "confidence": "high",
            "comparison_behavior": "still browsing accessories to decide whether to add a simple chain or earrings, while two tops sit undecided in the cart",
            "workaround": "when their own size was unavailable, ordered a size up or down wherever stock existed and accepted the fit risk",
            "current_blocker_freeform": "two tops are sitting in the cart while they weigh whether the spend is justified",
            "mentions_wishlist": False,
            "verbatim_quote": "contemplating to splurge or not",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_7}#by-Lonely-Flamingo-6550",
        "date": "2022",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": "site:reddit.com myntra wishlist",
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "unclear",
            "intent_signal": "not-determinable",
            "decision_factors": ["waiting for a bigger sale event"],
            "confidence": "low",
            "deferral_trigger": "advises another shopper to hold off until Myntra's End of Reason Sale at the end of December rather than buying now",
            "mentions_wishlist": False,
            "verbatim_quote": "You can wait for Myntra end of reason sale",
        },
    },
    # --- Thread 8: price volatility while wishlisted/carted, offsite price-history tools ---
    {
        "source": "reddit_post",
        "source_url": THREAD_8,
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "developersIndia",
        "matched_term": 'site:reddit.com myntra cart "waiting for sale" OR "price drop"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "unclear",
            "intent_signal": "save-for-later",
            "intent_evidence": "when I added it to my cart, it jumped",
            "decision_factors": ["price volatility", "trust in the displayed discount"],
            "confidence": "high",
            "comparison_behavior": "tracked the same item's price across roughly five days, noting it moved between about 300 and 575 and once showed as high as 2000",
            "current_blocker_freeform": "no longer trusts that any displayed price is the real one, suspecting the discount framing is engineered to push a purchase",
            "deferral_trigger": "watching to see whether the price returns to its lower point before committing",
            "mentions_wishlist": False,
            "verbatim_quote": "Feels like we're being gamified into buying at the “discount.”",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_8}#by-Brilliant-Change-111",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "developersIndia",
        "matched_term": 'site:reddit.com myntra cart "waiting for sale" OR "price drop"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Flipkart", "Amazon", "BuyHatke"],
        "extraction": {
            "product_category": "footwear",
            "intent_signal": "save-for-later",
            "intent_evidence": "I added sneakers to the wishlist",
            "decision_factors": ["price drop timing", "doubt about the stated MRP", "price history"],
            "confidence": "high",
            "save_motivation": "wishlisted a pair of sneakers at around 1300 specifically to hold it while waiting for the price to fall",
            "comparison_behavior": "re-checked the wishlisted item repeatedly over several days as it moved to 1800, then 2200, then back to its original price",
            "offsite_research": "used price-history tools including BuyHatke, and found Flipkart and Amazon moved their prices in step with Myntra",
            "workaround": "adopted a rule of checking a product's price history on an external site before buying anything",
            "current_blocker_freeform": "cannot tell which of the fluctuating prices is genuine, and believes people buying at the higher points are being overcharged without realising",
            "deferral_trigger": "waiting for the price to drop back down before purchasing",
            "mentions_wishlist": True,
            "verbatim_quote": "I was waiting for the price drop.",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_8}#by-Careful-Round-5560",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "developersIndia",
        "matched_term": 'site:reddit.com myntra cart "waiting for sale" OR "price drop"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "unclear",
            "intent_signal": "save-for-later",
            "intent_evidence": "determine and buy at lowest prices",
            "decision_factors": ["lowest achievable price", "distrust of platform pricing"],
            "confidence": "medium",
            "comparison_behavior": "monitors a product's price for about a month before deciding, comparing across multiple shopping sites rather than one",
            "offsite_research": "runs automated browsing across several e-commerce sites to track prices, and maintains multiple accounts",
            "workaround": "built an automated price-monitoring setup and has been running it for two to three months to time purchases at the low point",
            "deferral_trigger": "holds off until the monitoring shows the price has bottomed out",
            "mentions_wishlist": False,
            "verbatim_quote": "auto browse and monitor prices say a month",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_8}#by-_Pr0tAg0nisT_",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "developersIndia",
        "matched_term": 'site:reddit.com myntra cart "waiting for sale" OR "price drop"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "footwear",
            "intent_signal": "buy-intent",
            "intent_evidence": "i was trying to buy Chelsea boots",
            "decision_factors": ["price at time of purchase"],
            "confidence": "high",
            "current_blocker_freeform": "deferred the purchase by a single day and returned to find the boots had gone from about 1600 to 2200",
            "deferral_trigger": "intended to place the order the following day rather than at the moment of deciding",
            "mentions_wishlist": False,
            "verbatim_quote": "i thought I would order it next day",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_8}#by-metaexxploit",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "developersIndia",
        "matched_term": 'site:reddit.com myntra cart "waiting for sale" OR "price drop"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "unclear",
            "intent_signal": "not-determinable",
            "decision_factors": ["belief that browsing and cart-parking are tracked"],
            "confidence": "medium",
            "current_blocker_freeform": "believes that viewing a product repeatedly or leaving it sitting in the cart is itself what causes the price to rise",
            "mentions_wishlist": False,
            "verbatim_quote": "moved product into cart and kept it there price wil shot up",
        },
    },
    # --- Thread 9: read in full, rejected — no purchase-decision content, see docstring ---
    # --- Thread 10: discount depth vs. authenticity suspicion ---
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_10}#by-Adventurous-Cheek19",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": 'site:reddit.com india myntra "in my cart" "should i buy" OR "cant decide"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Fragrantica"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "intent_evidence": "I was thinking to order but didn't",
            "decision_factors": ["product reviews", "batch freshness", "whether the discount is actually the best price"],
            "confidence": "high",
            "comparison_behavior": "weighed the size of the discount against the absolute price and concluded it still was not the cheapest available",
            "offsite_research": "checked Fragrantica and read reviews there, coming away with the impression the stock was an older formulation",
            "current_blocker_freeform": "poor reviews and a suspicion of old stock outweighed an attractive-looking discount, so they chose not to order",
            "mentions_wishlist": False,
            "verbatim_quote": "decided against it as it seems like old smell on fragrantica",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_10}#by-madelyn_as_hatter",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": 'site:reddit.com india myntra "in my cart" "should i buy" OR "cant decide"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Zara"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "buy-intent",
            "intent_evidence": "I ordered this so fast",
            "decision_factors": ["longevity of the fragrance", "value at full price", "authenticity"],
            "confidence": "high",
            "save_motivation": "had wanted this specific perfume for a long time because they like citrus notes, but held off rather than buying it",
            "comparison_behavior": "benchmarked its wear time against a Zara fragrance and judged it lasted about the same, which made the original price unjustifiable",
            "current_blocker_freeform": "still uncertain whether the item will arrive genuine and in good condition even after ordering",
            "deferral_trigger": "held out until the price dropped far enough to change the value calculation",
            "mentions_wishlist": False,
            "verbatim_quote": "didn't find its longevity worth the original price",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_10}#by-demi_skincare",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": 'site:reddit.com india myntra "in my cart" "should i buy" OR "cant decide"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "intent_evidence": "I don't need them",
            "decision_factors": ["actual occasion to use the product", "genuine need"],
            "confidence": "medium",
            "workaround": "talks themselves out of the purchase by reasoning that they are mostly indoors and would not get any use out of it",
            "current_blocker_freeform": "cannot justify the buy because they have no real occasion to wear it, despite the discount being tempting",
            "mentions_wishlist": False,
            "verbatim_quote": "you are indoors mostly so you won't use them",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_10}#by-srkrb",
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": 'site:reddit.com india myntra "in my cart" "should i buy" OR "cant decide"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "not-determinable",
            "decision_factors": ["price window closing"],
            "confidence": "medium",
            "current_blocker_freeform": "returned to the deal only to find the price had climbed to around 2000, closing the window they had been watching",
            "mentions_wishlist": False,
            "verbatim_quote": "Price increased to 2000",
        },
    },
    {
        "source": "reddit_post",
        "source_url": THREAD_10,
        "date": "2023",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyDeals",
        "matched_term": 'site:reddit.com india myntra "in my cart" "should i buy" OR "cant decide"',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "buy-intent",
            "intent_evidence": "I just bought it maybe will gift",
            "decision_factors": ["depth of discount", "brand prestige", "product legitimacy"],
            "confidence": "medium",
            "offsite_research": "read reviews online before buying and judged them decent, without strong personal knowledge of the product",
            "save_motivation": "bought largely because a luxury brand at a very steep discount felt worth taking, with gifting as a fallback use",
            "current_blocker_freeform": "other shoppers in the thread repeatedly question whether the heavily discounted stock is genuine",
            "mentions_wishlist": False,
            "verbatim_quote": "read some reviews online seems decent",
        },
    },
    # --- Thread 11: crowdsourced validation, cross-platform price check, sale-backfire ---
    {
        "source": "reddit_post",
        "source_url": THREAD_11,
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyTalks",
        "matched_term": 'site:reddit.com myntra "sold out" wishlist delete OR remove',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Ajio"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "save-for-later",
            "intent_evidence": "Before I enter full delulu mode and buy",
            "decision_factors": ["whether a discount is genuine", "risk of buying something they won't use"],
            "confidence": "high",
            "comparison_behavior": "crowdsources the sale from other shoppers first, asking which deals are real steals before committing to anything themselves",
            "offsite_research": "solicits recommendations from a Reddit community as a filter ahead of browsing the sale",
            "workaround": "deliberately delays their own browsing and defers to community validation to avoid impulse purchases",
            "current_blocker_freeform": "distrusts sale pricing where the MRP looks inflated to manufacture a discount, and fears buying items they will forget about within days",
            "mentions_wishlist": False,
            "verbatim_quote": "buy things I'll forget about in 3 business days",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_11}#by-reelrndm",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyTalks",
        "matched_term": 'site:reddit.com myntra "sold out" wishlist delete OR remove',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Nykaa"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "buy-intent",
            "intent_evidence": "I just ordered mine for 405",
            "decision_factors": ["price difference between platforms"],
            "confidence": "high",
            "comparison_behavior": "compared the same product's price on two platforms and bought on the cheaper one after another shopper flagged the deal",
            "offsite_research": "checked the same item on Nykaa, where it was priced higher at 485",
            "mentions_wishlist": False,
            "verbatim_quote": "It was for 485 on nykaa.",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_11}#by-okbyebitch_",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyTalks",
        "matched_term": 'site:reddit.com myntra "sold out" wishlist delete OR remove',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        # Ajio, not Myntra — kept deliberately, see docstring boundary-call note.
        "platform_mentioned": ["Ajio"],
        "extraction": {
            "product_category": "apparel",
            "intent_signal": "save-for-later",
            "intent_evidence": "i had selected a dress a few days before the sale",
            "decision_factors": ["expected sale discount", "price at sale time"],
            "confidence": "high",
            "save_motivation": "shortlisted a dress in the days before an announced sale, expecting the sale to bring the price down",
            "current_blocker_freeform": "the shortlisted dress went up from roughly 1300 to 1800 once the sale actually started, inverting the reason they waited",
            "deferral_trigger": "was holding the item specifically until the sale went live",
            "mentions_wishlist": False,
            "verbatim_quote": "the sale price had turned to 1800",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_11}#by-Upstairs_Monk_677",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyTalks",
        "matched_term": 'site:reddit.com myntra "sold out" wishlist delete OR remove',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Ajio"],
        "extraction": {
            "product_category": "accessories",
            "intent_signal": "buy-intent",
            "intent_evidence": "Also got a Michael Kors watch",
            "decision_factors": ["size of the markdown against MRP"],
            "confidence": "medium",
            "save_motivation": "bought a watch marked down from around 18000 to 7000 purely because the discount was large, while acknowledging no actual need for it",
            "mentions_wishlist": False,
            "verbatim_quote": "I didn't need it but oh well.",
        },
    },
    {
        "source": "reddit_comment",
        "source_url": f"{THREAD_11}#by-deceptionaldpka",
        "date": "2025",
        "date_precision": "approximate_year_only_from_relative_timestamp",
        "subreddit": "IndianBeautyTalks",
        "matched_term": 'site:reddit.com myntra "sold out" wishlist delete OR remove',
        "lens": "prospective",
        "collection_method": "manual_browser_assisted",
        "platform_mentioned": ["Myntra", "Nykaa"],
        "extraction": {
            "product_category": "beauty",
            "intent_signal": "buy-intent",
            "intent_evidence": "never hurts to stock up",
            "decision_factors": ["discount depth", "already owning the product"],
            "confidence": "medium",
            "comparison_behavior": "had already bought the same product elsewhere but treats a Myntra discount as reason to buy another anyway",
            "offsite_research": "previously purchased the same item on Nykaa",
            "mentions_wishlist": False,
            "verbatim_quote": "never hurts to stock up",
        },
    },
]


def main() -> None:
    out_path = config.EXTRACTED_DIR / "extracted.jsonl"
    written = append_jsonl(out_path, RECORDS)
    print(f"Wrote {written} manually-extracted Reddit records to {out_path} ({len(RECORDS)} candidates, deduped by source_url).")


if __name__ == "__main__":
    main()
