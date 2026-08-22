# Interview Guide — Filling the Discovery Engine's Blind Spots

Companion to [`problem_statement.md`](problem_statement.md), scoped to Part 3 (primary research, 5–6 interviews, execution-timeline Days 4–7). This document exists because the engine's own question-coverage output (`pipeline/data/extracted/findings.json`, live on the dashboard's Findings tab) tells us precisely where public text goes silent — every question below is aimed at one of those specific, named holes, not a generic wishlist-UX script. Numbers referenced throughout are the real corpus as of 2026-08-19 (575 extracted records: 557 App/Play Store + 18 Reddit; 2 survey responses).

## 1. What's already Strong — don't spend interview time re-establishing this

| Q | Finding | Confidence |
|---|---|---|
| 7. Role of fit/size/styling/price/reviews/occasion/social validation | 8 themes identified, 51 phrases mapped to the 7 named factors + emergent bucket | **Strong** |
| 8. Genuine intent vs. bookmarking | `intent_signal` resolved in 124/575 extractions | **Strong** |

Interviews can *deepen* these (e.g. asking the "why" behind a factor) but shouldn't re-ask "does price matter" — the engine already answered that at n=575. Spend the limited slots on what follows.

## 2. The gap map — four different root causes, four different fixes

Lumping all 8 "Weak" questions together and writing one generic question per question would waste interview time, because they're weak for different reasons. Some *cannot* be fixed by more corpus volume; treating them the same as the ones that can wastes the corpus's own signal.

### A — Structurally invisible in public text (more scraping will never fix this)
People don't narrate these things unprompted in a store review or a Reddit comment — the behavior happens silently, in their own head or across apps, so no amount of additional corpus volume closes the gap.

| Q | Real finding | n |
|---|---|---|
| 1. Why do users add to wishlist | `save_motivation` captured | 1/575 |
| 5. How users compare shortlisted items | `comparison_behavior` captured | 5/575 |
| 9. Segment/demographic differences | `segment_signal` captured | 10/575 (survey adds 2 more responses, still thin) |

→ These need **live, behavioral** interview questions — ideally watching someone use their actual wishlist rather than asking them to summarize it from memory.

### B — Thin because the retrospective lens structurally can't see it (real signal exists, corpus lens just misses most of it)
App/Play Store reviews are written *after* a purchase decision is already resolved, so the live hesitation/blocker moment is mostly gone from the text by the time it's written. Reddit catches more of it but Reddit's n is tiny (18 records total).

| Q | Real finding | n |
|---|---|---|
| 2/3. What blocks purchase / residual uncertainty | blocker/hesitation signal present | 19/575 |
| 4. Postponement cause | delay/deferral signal present | 9/575 |
| 6. Off-platform research | `offsite_research` captured | 3/575 |
| 10. Recurring unmet needs (workaround) | `workaround` captured | 8/575 |

Notably, the 2-response survey's open-text answers (not yet in the LLM pipeline, but readable directly in `pipeline/data/raw/survey_responses.jsonl`) already surface offsite research richly the moment someone is asked directly — "ask friends or family," "price on other shopping sites," "the brand's own site or a physical store." That's proof this is a **text-availability problem, not a behavior-rarity problem**: the behavior is common, public text just rarely mentions it in passing.

### C — A gap *inside* the ranked table itself, not just the question-coverage view
This is the most consequential gap and it's easy to miss because the dashboard shows a clean ranked list: **6 of the 8 opportunity themes have `resolutionReason: "not enough data yet"`.**

| Theme | Opportunity Score | Resolution reason on file |
|---|---|---|
| Price and value perception | 3.21 | "Great Discount" *(and this is a monetary lever — off-limits under the project's no-discount constraint anyway, so even the one theme with a stated reason isn't actually usable)* |
| Product quality concerns | 2.73 | not enough data yet |
| Fit and comfort | 2.58 | not enough data yet |
| Service reliability | 2.56 | not enough data yet |
| Styling versatility | 2.43 | not enough data yet |
| Review trustworthiness | 2.27 | not enough data yet |
| Occasion relevance | 2.21 | not enough data yet |
| Wishlist capacity limit | 1.71 | not enough data yet |

Per `problem_statement.md` §7c, **Resolution Leverage is described as the single most decision-useful dimension the two-lens design produces** ("a high-frequency blocker nobody ever resolves is a worse MVP target than a rarer one with a proven, repeatable path out — because that resolution path *is* the feature spec"). Right now that dimension is functionally unfilled for 75% of the ranking. This is the single highest-value thing the interviews can fix — not "what's wrong," which the engine already ranks, but **"what actually got you unstuck, last time it happened for real."**

### D — Blocker types visible in 2 survey responses that don't appear in any of the 8 engine-derived themes
With n=2 these are leads, not findings — but they're exactly the kind of signal 5–6 interviews exist to stress-test, and neither maps onto any of the 8 named themes above:

- **"Leakage"** — found the same/similar item cheaper or better elsewhere after wishlisting on Myntra (both survey respondents cited a version of this — "compared with other options," "price on other shopping sites," "a physical store"). Adjacent to Q5/Q6 but the engine's `offsite_research` field only fires on 3/575 records, so this is essentially unmeasured at corpus scale.
- **"Availability"** — item went out of stock or the respondent's size sold out while it sat in the wishlist. Not represented in any of Price / Quality / Fit / Service / Styling / Reviews / Occasion / Wishlist-capacity — a genuinely distinct blocker type the theme list may be missing entirely.
- **"Salience"** — literally forgot the item was saved. Distinct from "Wishlist capacity limit" (which is about too many items forcing cleanup, an emergent theme with 6 phrases) — salience is about *no reminder ever brought it back*, not capacity pressure.

## 3. The interview questions

Designed for ~30–40 minutes across 5–6 interviews — every question is tagged with the gap(s) it targets so time isn't spent on redundant ground. Behavioral-interviewing convention throughout: ask for a **specific recent instance**, not a hypothetical or a summary opinion — "walk me through the last time," not "do you usually."

**0. Screener / warm-up**
"How often do you shop for clothes or fashion online, roughly?" — confirms they're in-population before spending the slot.

**1. Live wishlist walkthrough (screen-share if possible)**
"Can you open your Myntra wishlist and just talk me through what's on it right now?"
→ Targets **Q1 (save motivation)** and **Q9 (segment signal)** organically — letting real items surface real reasons beats asking "why do you save things" as an abstract question, which is exactly why `save_motivation` only fires 1/575 in review text: nobody narrates it unprompted, but everyone can explain a specific item on sight.

**2. Per-item follow-up, pick 2–3 items**
"Why did you save this one specifically? What did you think would happen next?"
→ **Q1**, and separates real buy-intent from pure bookmarking at the individual-item level — a finer-grained check on **Q8**, which is Strong at aggregate but hasn't been validated per-person.

**3. The near-miss recall**
"Tell me about the last time you almost bought something from your wishlist but didn't. Walk me through exactly what happened, step by step."
→ **Q2/Q3 (blockers/uncertainty)** and **Q4 (postponement cause)** — direct behavioral recall is the fix for Root Cause B; this is the single highest-leverage question in the guide for those two.

**4. The resolution follow-up (ask immediately after #3, same item if possible)**
"Did that item ever get bought later — by you or not at all? If it did, what changed between then and now?"
→ Directly targets **Root Cause C (Resolution Leverage)** — this is the question that fills the "not enough data yet" gap in 6 of 8 opportunity themes. Push for a concrete trigger, not "I just felt like it."

**5. Offsite research probe**
"Before you decided, did you look at anything outside Myntra — other apps, a friend, a store, anything?"
→ **Q6**. Given the survey's 2 free-text answers already surfaced this readily when asked directly, expect a real hit rate here even though the corpus shows only 3/575.

**6. Leakage probe**
"Has it ever happened that you found the same or a similar item cheaper, or nicer, somewhere else — after you'd already saved it on Myntra?"
→ **Root Cause D — "Leakage."** If this comes up unprompted across several interviews, it's a real 9th theme candidate the corpus is currently blind to.

**7. Availability probe**
"Has an item you'd saved ever gone out of stock, or your size sold out, before you got around to buying it? What did you do?"
→ **Root Cause D — "Availability."** Tests whether this is a distinct blocker type worth adding to the opportunity table, or a rare edge case.

**8. Salience probe**
"Do you ever just forget things are sitting in your wishlist? How do you end up rediscovering them, if you do?"
→ **Root Cause D — "Salience,"** and disambiguates it from the existing "Wishlist capacity limit" theme (capacity is about too much clutter forcing action; salience is about zero re-engagement ever happening).

**9. Comparison behavior deep dive**
"Think of a time you had two or three similar items saved at once — how did you actually pick between them?"
→ **Q5** directly — the weakest-covered question in the whole set (5/575) and explicitly flagged in `problem_statement.md` §4 as "rarely narrated publicly, interviews lead."

**10. Segment/context, woven in rather than checklisted**
Rather than a demographic form, let city tier, spend level, and shopping frequency come up naturally across questions 1–9, then confirm directly at the end: "Just to make sure I've got it — roughly what do you spend on a single item, and how often are you adding to your wishlist?"
→ **Q9**, cross-checked against the 2 existing survey responses rather than replacing them — the goal is triangulation, not a third redundant demographic form.

**11. Closing, open-ended**
"If Myntra could fix exactly one thing about how your wishlist works, what would it be?"
→ Catches anything outside the 8 named themes and Root Cause D's three candidates — a deliberate net for whatever the engine's own framing missed.

## 4. After the interviews

- Attribute every quote to a segment tag (city tier, spend band, save frequency) even though it's small-n — this is what makes Q9 improve, not just get another single data point.
- Treat any of the three Root Cause D candidates (Leakage, Availability, Salience) that shows up in 2+ interviews as a real 9th/10th opportunity theme candidate — worth a manual pass through the existing 575-record corpus for that specific pattern before assuming it's absent, since it may simply not have been named as its own theme during synthesis.
- Feed resolution-trigger answers (question 4) back into the opportunity table's `resolutionReason` field by hand for the matching themes — this single edit does more for the table's credibility than any additional corpus volume would.
- Per `problem_statement.md` §13, this guide's output is meant to *confirm or challenge* the engine's findings, not stand alone — write up contradictions as prominently as confirmations.
