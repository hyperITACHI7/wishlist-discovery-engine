"""Source-conditional extraction prompt — the Python/batch mirror of
web/src/lib/groq.ts. Keep both in sync; the schema and lens split are
locked decisions, see ../../problem_statement.md §6.
"""

CORE_FIELDS = """
- product_category: one of "apparel" | "footwear" | "beauty" | "accessories" | "unclear"
- intent_signal: one of "buy-intent" | "save-for-later" | "not-determinable". This MUST be a literal, observable call, not a guess.
- intent_evidence: the exact quote fragment that justifies intent_signal. Required whenever intent_signal is not "not-determinable"; omit the key otherwise.
- segment_signal: a short freeform phrase capturing any stated user attribute (age, location, shopper type) — omit the key if nothing is stated.
- decision_factors: array of factors this specific person raised themselves (do not supply your own list, only what is textually present).
- confidence: "low" | "medium" | "high" — your confidence in this extraction overall.
- save_motivation: why they saved/shortlisted the item, if stated — omit if absent.
- comparison_behavior: how they narrowed between options, if stated — omit if absent.
- offsite_research: what they checked outside Myntra and where, if stated — omit if absent.
- workaround: what they did instead of the "ideal" resolution, if stated — omit if absent.
"""

RETROSPECTIVE_ONLY = """
- hesitation_signal: any trace of delay, doubt, comparison, or size-bracketing before this purchase — omit if absent.
- delay_signal: any explicit time gap ("finally", "after weeks") — omit if absent.
- resolution_reason: what actually tipped them into buying — omit if absent.
- post_purchase_outcome: "satisfied" | "regret" | "returned" | "unclear" — omit if not inferable.
"""

PROSPECTIVE_ONLY = """
- current_blocker_freeform: the still-unresolved blocker, in their own words — omit if absent.
- deferral_trigger: what they say they are waiting for before deciding — omit if absent.
- mentions_wishlist: boolean, true only if a wishlist/save/shortlist action is explicitly mentioned.
"""

RETROSPECTIVE_SOURCES = {"playstore_review", "appstore_review"}
PROSPECTIVE_SOURCES = {"reddit_post", "reddit_comment"}


def lens_for_source(source: str) -> str:
    if source in RETROSPECTIVE_SOURCES:
        return "retrospective"
    if source in PROSPECTIVE_SOURCES:
        return "prospective"
    raise ValueError(f"Unknown source type: {source!r}")


def build_prompt(text: str, lens: str) -> str:
    lens_fields = RETROSPECTIVE_ONLY if lens == "retrospective" else PROSPECTIVE_ONLY
    lens_label = (
        "This text is from someone who ALREADY BOUGHT the item (e.g. an app/Play Store "
        "review). You are looking backward at what friction they overcame."
        if lens == "retrospective"
        else "This text is from someone who is STILL DECIDING (e.g. a Reddit/forum "
        "comment). You are looking at an unresolved blocker in real time."
    )

    return f"""You are a careful qualitative-data extractor for a product-research pipeline about online fashion shopping (wishlist-to-purchase behaviour). You are NOT told any taxonomy of blockers in advance — extract only what this specific text actually says, in the person's own terms. Do not invent, generalise, or infer beyond the text.

{lens_label}

Extract a single JSON object with these fields. Every field is OPTIONAL except intent_signal and confidence — if a field has no evidence in the text, omit the key entirely rather than emitting null or an empty string.

Fields:{CORE_FIELDS}{lens_fields}
Also include:
- verbatim_quote: the single most relevant short quote from the text (<= 30 words).

Return ONLY the JSON object, no prose, no markdown fences.

Text to extract from:
\"\"\"
{text}
\"\"\""""
