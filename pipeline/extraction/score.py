"""Step 7 — match phrases back to themes, compute cross-tabs and the
Opportunity Score, and produce the final findings.json consumed by the
dashboard. Plain code, no LLM — per problem_statement.md §7d: quantification
must be auditable, not another black-box model call.

Output shape mirrors web/src/lib/types.ts exactly (OpportunityRow,
QuestionCoverageRow, CrossTabRow) so the web app can consume it directly.

Opportunity Score implementation note: problem_statement.md §7 specifies
"Frequency x Severity x Intent Quality x Resolution Leverage x Addressability"
as five 1-5 dimensions "shown as raw inputs." A literal product of five 1-5
values ranges 1 to 3125, which isn't a usable display score, so the
displayed score here is the GEOMETRIC MEAN of the five dimensions (same
ranking as the raw product, rescaled back to a 1-5 range). The five raw
per-dimension inputs are still stored alongside it, unrounded, so the score
stays auditable rather than hiding the judgment call. Frequency/Severity/
Intent-quality/Resolution-leverage are computed by min-max scaling this
run's themes against each other (data); Addressability is a labelled
judgment call (price-factor themes capped low, per the "no monetary
incentives" constraint) — never dressed up as measured.

Usage:
    python -m extraction.score
"""

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import read_jsonl
from common.phrase_ids import parse_phrase_ids

RETROSPECTIVE_SOURCES = {"playstore_review", "appstore_review"}
PROSPECTIVE_SOURCES = {"reddit_post", "reddit_comment"}

# Per-record extraction confidence -> a 0-100 theme-level score. Weights are
# deliberately blunt and stated here rather than tuned: this is "how sure was
# the extractor about the records behind this theme," not a statistical
# confidence interval, and calling it one would be the same false-precision
# dressing-up that problem_statement.md §7c warns about for Addressability.
CONFIDENCE_WEIGHTS = {"high": 100, "medium": 60, "low": 30}

# decision_factors bucketing, added 2026-08-23 (problem_statement.md §20).
# Grounded in the real phrase content (sampled directly from extracted.jsonl
# before writing these lists, not guessed) — decision_factors captures
# whatever a reviewer raised themselves, which is dominated by general
# purchase-decision language (quality, delivery, price), not narrowly
# wishlist-hesitation-specific. Checked in this fixed priority order, first
# match wins, so a phrase touching two buckets (e.g. "refused exchange
# delivery") resolves deterministically rather than double-counting.
#
# First pass (6 categories: Price/Quality/Fit/Service/Delivery/Comparison)
# left 40.6% of real mentions in "Other" — inspecting that bucket's actual
# content surfaced two real, recurring categories missing entirely (app
# usability, product selection/variety) and several markers too narrow
# (e.g. "cancellation" missed "orders cancelled", "variety" missed
# "varieties"). Revised twice against the real leftover phrases, landing at
# 18.7% Other — the remainder is genuinely idiosyncratic one-off aesthetic
# adjectives ("classy", "spacious", "shade", "luxury"), left unbucketed
# deliberately rather than chased into an ever-growing lexicon that would
# stop being auditable — same "ambiguous phrases left out rather than
# guessed at" principle the deleted keywords.py used.
PRICE_VALUE_MARKERS = ["price", "value for money", "worth", "prize", "discount", "costly", "cheap", "expensive", "afford", "cost-per-wear", "cost per wear", "deal", "offer", "budget", "myncash"]
QUALITY_AUTHENTICITY_MARKERS = ["quality", "fabric", "material", "authentic", "genuine", "fake", "durable", "original", "orginal", "craftsmanship", "leak-proof", "leak proof", "trust", "secure", "colour", "color", "shiny", "elegant", "soft", "packing", "fade", "feel", "branded", "damaged", "different product", "exactly like", "as shown", "good product", "awesome product", "tag"]
FIT_COMFORT_MARKERS = ["comfort", "fit", "fitting", "size", "styling", "versatil", "occasion", "wardrobe", "repeatab", "wear anywhere"]
SERVICE_SUPPORT_MARKERS = ["service", "support", "customer care", "exchange", "refund", "complain", "compensation", "call", "dm asking", "cancel", "response", "ticket", "grievance", "pick up", "pickup", "return", "cash payment", "prepaid", "payment"]
DELIVERY_LOGISTICS_MARKERS = ["deliv", "shipping", "wait", "stock", "sold out", "packed", "dispatch", "blockade", "highway", "track order", "supply issue"]
SELECTION_VARIETY_MARKERS = ["variet", "collection", "range", "brand availability", "few brands", "brands supply", "assortment", "good options", "availability", "brand"]
APP_SHOPPING_MARKERS = ["convenien", "customer friendly", "easy to use", "smooth interface", "3rd class", "easy shopping", "app is", "navigat", "user-friendly", "organis", "organiz", "ordering experience", "shopping experience", "way to order", "product information", "info about product", "rating"]
COMPARISON_WISHLIST_MARKERS = ["wishlist", "compar", "platform", "side-by-side", "side by side", "similar option", "alternative", "capacity limit", "overconsumption", "review"]

DECISION_FACTOR_TAXONOMY = [
    ("Price & Value", PRICE_VALUE_MARKERS),
    ("Quality & Authenticity", QUALITY_AUTHENTICITY_MARKERS),
    ("Fit & Comfort", FIT_COMFORT_MARKERS),
    ("Service & Support", SERVICE_SUPPORT_MARKERS),
    ("Delivery & Logistics", DELIVERY_LOGISTICS_MARKERS),
    ("Selection & Variety", SELECTION_VARIETY_MARKERS),
    ("App & Shopping Experience", APP_SHOPPING_MARKERS),
    ("Comparison & Wishlist Behavior", COMPARISON_WISHLIST_MARKERS),
]


def classify_decision_factor(phrase: str) -> str:
    text = phrase.lower()
    for category, markers in DECISION_FACTOR_TAXONOMY:
        if any(m in text for m in markers):
            return category
    return "Other"


def load_all():
    records = list(read_jsonl(config.EXTRACTED_DIR / "extracted.jsonl"))
    records_by_url = {r["source_url"]: r for r in records if r.get("source_url")}

    phrases_data = json.loads((config.EXTRACTED_DIR / "phrases.json").read_text(encoding="utf-8"))
    phrases_by_id = {p["id"]: p for p in phrases_data["phrases"]}

    themes_data = json.loads((config.EXTRACTED_DIR / "themes.json").read_text(encoding="utf-8"))

    return records, records_by_url, phrases_by_id, themes_data["themes"]


def theme_tagged_urls(theme: dict, phrases_by_id: dict) -> set[str]:
    urls = set()
    for pid in parse_phrase_ids(theme.get("phrase_ids")):
        phrase = phrases_by_id.get(pid)
        if phrase:
            urls.update(phrase["record_urls"])
    return urls


def minmax_scale(value: float, lo: float, hi: float) -> float:
    """Scale value in [lo, hi] to [1, 5]. Flat input (lo==hi) maps to 3 (neutral)."""
    if hi <= lo:
        return 3.0
    frac = max(0.0, min(1.0, (value - lo) / (hi - lo)))
    return 1.0 + frac * 4.0


def confidence_profile(tagged: list[dict]) -> dict:
    """Theme-level extraction-confidence rollup: the raw high/medium/low mix
    plus a weighted 0-100 score and a Strong/Medium/Weak label. The mix is
    kept alongside the score on purpose — the score alone hides that a
    "60" can mean "all medium" or "half high, half low"."""
    mix = Counter(r.get("extraction", {}).get("confidence", "low") for r in tagged)
    n = len(tagged)
    if n == 0:
        return {"score": 0, "label": "Weak", "mix": {"high": 0, "medium": 0, "low": 0}}
    score = sum(CONFIDENCE_WEIGHTS.get(level, 30) * count for level, count in mix.items()) / n
    label = "Strong" if score >= 75 else "Medium" if score >= 50 else "Weak"
    return {
        "score": round(score),
        "label": label,
        "mix": {"high": mix.get("high", 0), "medium": mix.get("medium", 0), "low": mix.get("low", 0)},
    }


def blocker_text(record: dict) -> str | None:
    """The 'what actually stalled this person' line, whichever lens it came
    from — retrospective reviews store it as hesitation_signal, prospective
    Reddit as current_blocker_freeform."""
    ex = record.get("extraction", {})
    return ex.get("current_blocker_freeform") or ex.get("hesitation_signal")


def build_evidence(tagged: list[dict]) -> list[dict]:
    """Every record behind a theme, trimmed to the fields the drill-down
    actually renders. Sorted high-confidence-first so the strongest evidence
    is what a reader sees before scrolling. Not capped — the tagged counts
    per theme are double digits, so the whole set is small enough to ship."""
    ordered = sorted(
        tagged,
        key=lambda r: {"high": 2, "medium": 1, "low": 0}.get(r.get("extraction", {}).get("confidence"), 0),
        reverse=True,
    )
    evidence = []
    for r in ordered:
        ex = r.get("extraction", {})
        evidence.append({
            "source": r.get("source", "unknown"),
            "sourceUrl": r.get("source_url", ""),
            "date": r.get("date"),
            "subreddit": r.get("subreddit"),
            "lens": "prospective" if r.get("source") in PROSPECTIVE_SOURCES else "retrospective",
            "quote": ex.get("verbatim_quote"),
            "confidence": ex.get("confidence", "low"),
            "intentSignal": ex.get("intent_signal", "not-determinable"),
            "productCategory": ex.get("product_category", "unclear"),
            "blocker": blocker_text(r),
            "workaround": ex.get("workaround"),
            "resolutionReason": ex.get("resolution_reason"),
        })
    return evidence


def build_opportunity_rows(themes: list[dict], phrases_by_id: dict, records_by_url: dict, total_app_play: int, total_reddit: int) -> list[dict]:
    raw_rows = []

    for theme in themes:
        urls = theme_tagged_urls(theme, phrases_by_id)
        tagged = [records_by_url[u] for u in urls if u in records_by_url]
        app_play_tagged = [r for r in tagged if r.get("source") in RETROSPECTIVE_SOURCES]
        reddit_tagged = [r for r in tagged if r.get("source") in PROSPECTIVE_SOURCES]

        app_play_n = len(app_play_tagged)
        reddit_n = len(reddit_tagged)
        app_play_rate = (app_play_n / total_app_play * 100) if total_app_play else 0.0
        reddit_rate = (reddit_n / total_reddit * 100) if total_reddit else 0.0

        # Resolution reason: most common resolution_reason phrase among this
        # theme's app/play-tagged records.
        resolution_counter = Counter(
            r["extraction"].get("resolution_reason")
            for r in app_play_tagged
            if r.get("extraction", {}).get("resolution_reason")
        )
        resolution_reason = resolution_counter.most_common(1)[0][0] if resolution_counter else "not enough data yet"
        resolution_repeat_count = resolution_counter.most_common(1)[0][1] if resolution_counter else 0

        has_workaround = any(r.get("extraction", {}).get("workaround") for r in tagged)

        quoted = [r for r in tagged if r.get("extraction", {}).get("verbatim_quote")]
        quoted.sort(key=lambda r: {"high": 2, "medium": 1, "low": 0}.get(r["extraction"].get("confidence"), 0), reverse=True)
        sample_quote = f"“{quoted[0]['extraction']['verbatim_quote']}”" if quoted else "no quote captured yet"

        regret_count = sum(
            1 for r in app_play_tagged if r.get("extraction", {}).get("post_purchase_outcome") in ("regret", "returned")
        )
        severity_share = (regret_count / app_play_n) if app_play_n else 0.0

        buy_intent_count = sum(1 for r in tagged if r.get("extraction", {}).get("intent_signal") == "buy-intent")
        intent_share = (buy_intent_count / len(tagged)) if tagged else 0.0

        combined_rate = ((app_play_n + reddit_n) / (total_app_play + total_reddit)) if (total_app_play + total_reddit) else 0.0

        # Every distinct workaround people described for this theme. A stated
        # workaround is the strongest unmet-need evidence in the whole schema
        # (problem_statement.md §6) — someone paid a real cost to route around
        # a gap — so the actual text is surfaced, not just a boolean.
        workarounds = sorted({
            r["extraction"]["workaround"].strip()
            for r in tagged
            if r.get("extraction", {}).get("workaround")
        })

        # Observed outcome mix. NOT a sentiment model — post_purchase_outcome
        # is an extracted field with a fixed vocabulary, and it only exists on
        # the retrospective lens, so its own coverage is reported alongside it
        # rather than presenting a partial count as if it covered the theme.
        outcome_counter = Counter(
            r["extraction"]["post_purchase_outcome"]
            for r in app_play_tagged
            if r.get("extraction", {}).get("post_purchase_outcome")
        )
        intent_counter = Counter(r.get("extraction", {}).get("intent_signal", "not-determinable") for r in tagged)

        raw_rows.append({
            "area": theme["name"],
            "factor": theme.get("factor", "emergent"),
            "appPlayRatePct": round(app_play_rate, 1),
            "appPlayN": app_play_n,
            "resolutionReason": resolution_reason,
            "redditRatePct": round(reddit_rate, 1),
            "redditN": reddit_n,
            "hasWorkaround": has_workaround,
            "sampleQuote": sample_quote,
            "totalVolume": len(tagged),
            "confidence": confidence_profile(tagged),
            "workarounds": workarounds,
            "outcomeMix": {
                "counts": dict(outcome_counter),
                "coveredN": sum(outcome_counter.values()),
                "ofN": app_play_n,
            },
            "intentMix": dict(intent_counter),
            "evidence": build_evidence(tagged),
            "_combined_rate": combined_rate,
            "_severity_share": severity_share,
            "_intent_share": intent_share,
            "_resolution_repeat_count": resolution_repeat_count,
            "_tagged_n": len(tagged),
        })

    # Min-max scale Frequency/Severity/Intent/Resolution across this run's themes.
    freq_vals = [r["_combined_rate"] for r in raw_rows]
    sev_vals = [r["_severity_share"] for r in raw_rows]
    intent_vals = [r["_intent_share"] for r in raw_rows]
    res_vals = [r["_resolution_repeat_count"] for r in raw_rows]

    rows = []
    for r in raw_rows:
        frequency = minmax_scale(r["_combined_rate"], min(freq_vals), max(freq_vals))
        severity = minmax_scale(r["_severity_share"], min(sev_vals), max(sev_vals))
        intent_quality = minmax_scale(r["_intent_share"], min(intent_vals), max(intent_vals))
        resolution_leverage = minmax_scale(r["_resolution_repeat_count"], min(res_vals), max(res_vals))
        # Addressability: judgment, not data. Price-factor themes are capped
        # low per the "no monetary incentives" constraint (problem_statement.md §3.5).
        addressability = 2.0 if r["factor"] == "price" else 4.0

        geometric_mean = (frequency * severity * intent_quality * resolution_leverage * addressability) ** (1 / 5)

        # Quadrant badge: severity is excluded here on purpose — at this
        # corpus size, post_purchase_outcome almost never resolves to
        # regret/returned, so every theme's severity_share min-max-scales to
        # the same flat 3.0 neutral value (see minmax_scale's hi<=lo branch)
        # and would make every quadrant look identical. Frequency x Intent
        # Quality both carry real spread this run and are jointly more
        # decision-relevant anyway: how often a blocker comes up, crossed
        # with how much of that volume is genuine buy-intent rather than
        # bookmarking. Threshold is the scale's own midpoint (3.0 of 1-5).
        if frequency > 3.0 and intent_quality > 3.0:
            quadrant = {"label": "CRITICAL", "tier": "serious"}
        elif intent_quality > 3.0:
            quadrant = {"label": "HIGH INTENT", "tier": "warning"}
        elif frequency > 3.0:
            quadrant = {"label": "HIGH VOLUME", "tier": "warning"}
        else:
            quadrant = {"label": "MONITOR", "tier": "neutral"}

        row = {
            "area": r["area"],
            "appPlayRatePct": r["appPlayRatePct"],
            "appPlayN": r["appPlayN"],
            "resolutionReason": r["resolutionReason"],
            "redditRatePct": r["redditRatePct"],
            "redditN": r["redditN"],
            "hasWorkaround": r["hasWorkaround"],
            "sampleQuote": r["sampleQuote"],
            "opportunityScore": round(geometric_mean, 2),
            "quadrant": quadrant,
            "totalVolume": r["totalVolume"],
            "confidence": r["confidence"],
            "workarounds": r["workarounds"],
            "outcomeMix": r["outcomeMix"],
            "intentMix": r["intentMix"],
            "evidence": r["evidence"],
            "_scoreDimensions": {
                "frequency": round(frequency, 2),
                "severity": round(severity, 2),
                "intentQuality": round(intent_quality, 2),
                "resolutionLeverage": round(resolution_leverage, 2),
                "addressability": addressability,
            },
        }
        if r["factor"] == "price":
            row["addressabilityNote"] = "Addressability capped — no monetary levers allowed for this project"
        rows.append(row)

    rows.sort(key=lambda r: -r["opportunityScore"])
    return rows


def top_phrases_for_fields(phrases_by_id: dict, fields: list[str], limit: int = 5) -> list[dict]:
    """The highest-count real phrases behind a question, so the coverage view
    can show WHAT was found, not only how many records it was found in.
    Straight from the deduped phrase list — no LLM, no paraphrasing."""
    matching = [p for p in phrases_by_id.values() if p.get("field") in fields]
    matching.sort(key=lambda p: -p.get("count", 0))
    return [{"phrase": p["phrase"], "count": p["count"], "field": p["field"]} for p in matching[:limit]]


# Which extraction field(s) actually answer each of the brief's 10 questions
# (problem_statement.md §3.1 -> §6 schema). Kept as an explicit map rather
# than inferred, so the question-to-evidence link is auditable.
QUESTION_FIELDS = {
    1: ["save_motivation"],
    2: ["current_blocker_freeform", "hesitation_signal"],
    3: ["current_blocker_freeform", "hesitation_signal"],
    4: ["delay_signal", "deferral_trigger"],
    5: ["comparison_behavior"],
    6: ["offsite_research"],
    7: ["decision_factors"],
    8: ["intent_evidence"],
    9: ["segment_signal"],
    10: ["workaround"],
}

# Weak questions split into two genuinely different reasons, added 2026-08-23
# (problem_statement.md §21). Checked per-lens (App/Play vs Reddit) fill
# rates before writing this, not guessed: REDDIT_VOLUME_LIMITED questions'
# fields fire at 17-72% per-record on the 18-record Reddit lens but only
# 0-1.5% on the 560-record App/Play lens — the signal is real, just capped by
# Reddit's tiny n, not missing text. RARE_EVERYWHERE questions are thin on
# BOTH lenses regardless of volume — no amount of more Reddit fixes those;
# they were handed to interviews by design from the original brief mapping
# (vault/09-Assignment/03-AI-Discovery-Engine-Design.md's coverage audit).
REDDIT_VOLUME_LIMITED_QUESTIONS = {1, 2, 3, 6, 9, 10}
RARE_EVERYWHERE_QUESTIONS = {4, 5}


def lens_fill(records: list[dict], fields: list[str]) -> dict:
    retro = [r for r in records if r.get("source") in RETROSPECTIVE_SOURCES]
    prosp = [r for r in records if r.get("source") in PROSPECTIVE_SOURCES]

    def present_count(pool: list[dict]) -> int:
        return sum(1 for r in pool if any(r.get("extraction", {}).get(f) for f in fields))

    return {
        "retroPresent": present_count(retro), "retroN": len(retro),
        "prospPresent": present_count(prosp), "prospN": len(prosp),
    }


def build_blocker(num: int, fields: list[str], records: list[dict]) -> str | None:
    """One-line honest explanation of why a Weak question is weak, and
    whether more Reddit collection would actually fix it. None for
    questions that are already Strong via a different mechanism (Q7's
    factor mapping, Q8's required intent_signal field)."""
    if num not in REDDIT_VOLUME_LIMITED_QUESTIONS and num not in RARE_EVERYWHERE_QUESTIONS:
        return None

    lf = lens_fill(records, fields)
    prosp_rate = (lf["prospPresent"] / lf["prospN"] * 100) if lf["prospN"] else 0.0
    retro_rate = (lf["retroPresent"] / lf["retroN"] * 100) if lf["retroN"] else 0.0

    if num in REDDIT_VOLUME_LIMITED_QUESTIONS:
        return (
            f"Fires on {lf['prospPresent']}/{lf['prospN']} Reddit records ({prosp_rate:.0f}%) vs "
            f"{lf['retroPresent']}/{lf['retroN']} App/Play ({retro_rate:.0f}%) — the signal is real, it's "
            f"just capped by Reddit corpus size ({lf['prospN']} records total), not missing text."
        )
    return (
        f"Only {lf['retroPresent']}/{lf['retroN']} App/Play ({retro_rate:.0f}%) and "
        f"{lf['prospPresent']}/{lf['prospN']} Reddit ({prosp_rate:.0f}%) mention it — rare in public text at "
        f"any volume, by design handed to interviews rather than the engine."
    )


def build_question_coverage(records: list[dict], themes: list[dict], phrases_by_id: dict) -> list[dict]:
    total = len(records)

    def fill_rate(field: str, subset: list[dict] | None = None) -> tuple[int, int]:
        pool = subset if subset is not None else records
        present = sum(1 for r in pool if r.get("extraction", {}).get(field))
        return present, len(pool)

    def confidence_for(present: int, n: int) -> str:
        if n == 0:
            return "Weak"
        rate = present / n
        if rate >= 0.15 and present >= 15:
            return "Strong"
        if rate >= 0.05 and present >= 5:
            return "Medium"
        return "Weak"

    retro = [r for r in records if r.get("source") in RETROSPECTIVE_SOURCES]
    prospective = [r for r in records if r.get("source") in PROSPECTIVE_SOURCES]

    q1_present, q1_n = fill_rate("save_motivation")
    q2_present = sum(1 for r in records if r.get("extraction", {}).get("current_blocker_freeform") or r.get("extraction", {}).get("hesitation_signal"))
    q3_present, q3_n = q2_present, total
    q4_present = sum(1 for r in records if r.get("extraction", {}).get("delay_signal") or r.get("extraction", {}).get("deferral_trigger"))
    q5_present, q5_n = fill_rate("comparison_behavior")
    q6_present, q6_n = fill_rate("offsite_research")
    q7_themed = sum(len(parse_phrase_ids(t.get("phrase_ids"))) for t in themes)
    q8_present = sum(1 for r in records if r.get("extraction", {}).get("intent_signal") in ("buy-intent", "save-for-later"))
    q9_present, q9_n = fill_rate("segment_signal")
    q10_present, q10_n = fill_rate("workaround")

    specs = [
        (1, "1. Why do users add products to their wishlist?", f"save_motivation captured in {q1_present}/{q1_n} extractions", q1_present, q1_n, confidence_for(q1_present, q1_n), "Engine + Interviews"),
        (2, "2. What prevents wishlisted products from being purchased?", f"blocker/hesitation signal present in {q2_present}/{total} extractions", q2_present, total, confidence_for(q2_present, total), "Engine"),
        (3, "3. What uncertainties remain after finding a product they like?", f"blocker/hesitation signal present in {q3_present}/{q3_n} extractions", q3_present, q3_n, confidence_for(q3_present, q3_n), "Engine"),
        (4, "4. What causes users to postpone a purchase?", f"delay/deferral signal present in {q4_present}/{total} extractions", q4_present, total, confidence_for(q4_present, total), "Engine + Interviews"),
        (5, "5. How do users compare multiple shortlisted products?", f"comparison_behavior captured in only {q5_present}/{q5_n} extractions — rarely narrated in public text as expected", q5_present, q5_n, confidence_for(q5_present, q5_n), "Interviews"),
        (6, "6. What information do users seek outside Myntra?", f"offsite_research captured in {q6_present}/{q6_n} extractions", q6_present, q6_n, confidence_for(q6_present, q6_n), "Engine"),
        (7, "7. Role of fit, size, styling, price, reviews, occasion, social validation", f"{len(themes)} themes identified, {q7_themed} phrases mapped to the 7 factors + emergent bucket", q7_themed, q7_themed, "Strong" if themes else "Weak", "Engine"),
        (8, "8. Genuine purchase intent vs. bookmarking?", f"intent_signal resolved (buy-intent or save-for-later, not not-determinable) in {q8_present}/{total} extractions", q8_present, total, confidence_for(q8_present, total), "Engine + Interviews"),
        (9, "9. How do behaviours differ across segments?", f"segment_signal captured in only {q9_present}/{q9_n} extractions — attributes rarely stated in public text as expected", q9_present, q9_n, confidence_for(q9_present, q9_n), "Interviews"),
        (10, "10. What unmet needs emerge consistently?", f"workaround captured in {q10_present}/{q10_n} extractions", q10_present, q10_n, confidence_for(q10_present, q10_n), "Engine"),
    ]

    return [
        {
            "question": question,
            "finding": finding,
            "n": str(n),
            "present": present,
            "coveragePct": round(present / n * 100, 1) if n else 0.0,
            "confidence": conf,
            "answeredBy": answered_by,
            "fields": QUESTION_FIELDS[num],
            "insights": top_phrases_for_fields(phrases_by_id, QUESTION_FIELDS[num]),
            "blocker": build_blocker(num, QUESTION_FIELDS[num], records),
        }
        for num, question, finding, present, n, conf, answered_by in specs
    ]


def build_pipeline_funnel(records: list[dict], phrases_by_id: dict, themes: list[dict]) -> list[dict]:
    """Volume at each gate the corpus passed through, collection -> ranking.

    Every drop here is a real, documented constraint rather than incidental
    loss, so each stage carries its own reason — a funnel that shows
    attrition without saying why invites the reader to assume a bug.
    """
    raw_counts = {}
    for name in ("playstore", "appstore", "reddit"):
        path = config.RAW_DIR / f"{name}.jsonl"
        raw_counts[name] = sum(1 for _ in read_jsonl(path)) if path.exists() else 0

    # Reddit records were written straight to extracted.jsonl by the manual
    # browser-assisted path (problem_statement.md §9) — they never passed
    # through a raw/*.jsonl file, so count them from the extracted side or
    # the collection stage would understate the real intake.
    reddit_extracted = sum(1 for r in records if r.get("source") in PROSPECTIVE_SOURCES)
    collected = raw_counts["playstore"] + raw_counts["appstore"] + max(raw_counts["reddit"], reddit_extracted)

    extracted = len(records)
    unique_phrases = len(phrases_by_id)
    phrases_into_synthesis = min(unique_phrases, 60)  # synthesize.MAX_PHRASES_IN_PROMPT
    phrases_mapped = sum(len(parse_phrase_ids(t.get("phrase_ids"))) for t in themes)

    return [
        {
            "stage": "Collected",
            "n": collected,
            "note": f"{raw_counts['playstore']} Play Store + {raw_counts['appstore']} App Store (Apple caps its feed at 500) + {reddit_extracted} Reddit, hand-extracted since both automated paths are blocked",
        },
        {
            "stage": "Extracted",
            "n": extracted,
            "note": "LLM freeform extraction, one call per item — the gap to Collected is Groq's 200k-tokens-per-day cap, not failed items; batch-extract is resumable",
        },
        {
            "stage": "Unique phrases",
            "n": unique_phrases,
            "note": "deduped and frequency-counted in plain code, no LLM — most fields are empty on most records by design (§6)",
        },
        {
            "stage": "Into synthesis",
            "n": phrases_into_synthesis,
            "note": "highest-count phrases only — the synthesis call reliably fails above ~60-80 phrases in one prompt (empirically bisected)",
        },
        {
            "stage": "Mapped to themes",
            "n": phrases_mapped,
            "note": "phrases the synthesis call assigned to a named theme; too-generic ones are deliberately left unassigned rather than force-fitted",
        },
        {
            "stage": "Ranked themes",
            "n": len(themes),
            "note": "named opportunity areas carried into the Opportunity Score ranking",
        },
    ]


def build_decision_factor_breakdown(records: list[dict]) -> list[dict]:
    """Corpus-wide rollup of decision_factors, bucketed into the taxonomy
    above. Global (not per-theme) and both lenses pooled — decision_factors
    is a CoreExtraction field present on every record type, and this widget's
    honest framing is "what shoppers say they weigh," not a wishlist-specific
    blocker count (see §20). Each bucket carries its top real example phrases
    so the classification stays auditable rather than a black-box label."""
    phrases_by_category = defaultdict(list)
    for r in records:
        for phrase in r.get("extraction", {}).get("decision_factors") or []:
            phrase = (phrase or "").strip()
            if not phrase:
                continue
            phrases_by_category[classify_decision_factor(phrase)].append(phrase)

    total_mentions = sum(len(v) for v in phrases_by_category.values())

    result = []
    for category, phrases in phrases_by_category.items():
        counts = Counter(p.lower() for p in phrases)
        first_seen = {}
        for p in phrases:
            first_seen.setdefault(p.lower(), p)
        example_phrases = [first_seen[key] for key, _ in counts.most_common(3)]
        result.append({
            "category": category,
            "count": len(phrases),
            "pctOfMentions": round(len(phrases) / total_mentions * 100, 1) if total_mentions else 0.0,
            "examplePhrases": example_phrases,
        })

    result.sort(key=lambda b: -b["count"])
    return result


def build_outcome_summary(records: list[dict]) -> dict:
    """Corpus-wide post_purchase_outcome rollup — the same {counts, coveredN,
    ofN} shape build_opportunity_rows already produces per theme, just summed
    across the whole retrospective lens rather than one theme's tagged
    subset. post_purchase_outcome only exists on App/Play records (§6)."""
    retro = [r for r in records if r.get("source") in RETROSPECTIVE_SOURCES]
    counter = Counter(
        r["extraction"]["post_purchase_outcome"]
        for r in retro
        if r.get("extraction", {}).get("post_purchase_outcome")
    )
    return {
        "counts": dict(counter),
        "coveredN": sum(counter.values()),
        "ofN": len(retro),
    }


def run_score() -> dict:
    records, records_by_url, phrases_by_id, themes = load_all()

    total_app_play = sum(1 for r in records if r.get("source") in RETROSPECTIVE_SOURCES)
    total_reddit = sum(1 for r in records if r.get("source") in PROSPECTIVE_SOURCES)

    opportunity_rows = build_opportunity_rows(themes, phrases_by_id, records_by_url, total_app_play, total_reddit)
    question_coverage_rows = build_question_coverage(records, themes, phrases_by_id)
    pipeline_funnel = build_pipeline_funnel(records, phrases_by_id, themes)
    decision_factor_breakdown = build_decision_factor_breakdown(records)
    outcome_summary = build_outcome_summary(records)

    findings = {
        "generatedAt": None,  # filled by caller
        "totalRecords": len(records),
        "totalAppPlay": total_app_play,
        "totalReddit": total_reddit,
        "opportunityRows": opportunity_rows,
        "questionCoverageRows": question_coverage_rows,
        "pipelineFunnel": pipeline_funnel,
        "decisionFactorBreakdown": decision_factor_breakdown,
        "postPurchaseOutcomeSummary": outcome_summary,
    }

    out_path = config.EXTRACTED_DIR / "findings.json"
    out_path.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Findings written to {out_path}")
    print(f"  {len(opportunity_rows)} opportunity areas, {total_app_play} app/play records, {total_reddit} reddit records")
    print(f"  {len(pipeline_funnel)} funnel stages")
    print(f"  evidence records attached: {sum(len(r['evidence']) for r in opportunity_rows)}")
    print(f"  {len(decision_factor_breakdown)} decision-factor categories ({sum(b['count'] for b in decision_factor_breakdown)} phrase mentions)")
    print(f"  post-purchase outcome stated in {outcome_summary['coveredN']}/{outcome_summary['ofN']} App/Play records")

    return findings


if __name__ == "__main__":
    run_score()
