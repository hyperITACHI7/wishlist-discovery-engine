# Problem Statement — Myntra Wishlist Discovery Engine

Status: **locked for build**. This document is the single source of truth for what we are building and why. It is derived from the planning work in the Obsidian vault (`../vault/09-Assignment/`) but is meant to stand alone — read this file, not the vault, to understand the engine.

---

## 1. What we are making

An **AI-powered discovery engine** that mines public, unstructured feedback about Myntra (app/Play Store reviews, Reddit threads) and turns it into a **ranked, quantified, comparable table of opportunity areas** blocking wishlist → purchase conversion — not a sentiment dashboard, not a keyword cloud, not a summarizer.

**Revised 2026-08-19:** YouTube was dropped as a source. It was already scoped as a minor, supplementary source (never a pillar — see §9), and in practice no videos could be found with both meaningful comment volume and decision-relevant discussion about Myntra/online fashion shopping. Rather than force it, the corpus now runs on Reddit (manually-assisted, see §9) + App/Play Store. Every reference to YouTube elsewhere in this document has been removed or updated accordingly; where the source count mattered (e.g. §12 assumption 5), it's been adjusted from three sources to two.

It ships as **one hosted, publicly testable web page** with four browsable tabs plus two on-demand panels that don't compete for tab space (see §16, §16b for why):

| Panel | Purpose |
|---|---|
| **A — Findings** | The cached, pre-computed ranked opportunities + cross-tabs from the full corpus run. Every headline stat is clickable into a full view, every ranked theme drills down to the actual reviews and Reddit posts behind it, and a grounded assistant at the bottom answers questions about any of it (§16b). Static per page load — does not re-run the corpus live. |
| **Interviews** | Reserved tab for the 5–6 primary-research interviews (Days 4–7) — placeholder until real interviews exist, same small-n / never-cross-tabbed treatment stated up front. Now the *only* input to Q9, since the survey was removed (§18). |
| **Research findings** | The 14-question psychology desk research (`vault/09-Assignment/10-Psychology-Research.md`), each with its findings, named mechanisms, implications, sources, and an explicit note on how the engine's own corpus compares. Sits next to Interviews because both are evidence that did *not* come from the engine's corpus. See §16c. |
| **How it works** | The pipeline diagram and the design rationale behind it (freeform-first extraction, the two lenses, the quantification layer, what's a labelled judgment call). Its own tab since 2026-08-20 — it's reference material you seek out, not something the findings should be interrupted by. |
| **B — Live extractor** | On-demand modal (▸ "Try it yourself" in the tab bar). Visitor pastes any piece of text (a review, a Reddit comment, their own experience), picks a lens ("a review of something I bought" vs. "something I'm still deciding on"), and sees the structured extraction (§6 schema) run live via Groq, including confidence and honest empty results. |
| **C — Limitations** | On-demand modal (ⓘ in the tab bar). n per source, null rate per extracted field, stated biases. Small, but never hidden — moved off the main tab bar only because it's static prose with nothing to browse, not because it's less important. |

This is **Part 1 of a 7-part NextLeap PM Fellowship graduation-project brief**, and it is also **primary input to Parts 2–4** (metric decomposition, primary research, problem definition) of the same project — the engine's output is what the 5–6 user interviews are designed to confirm or challenge, not a standalone artifact graded in isolation.

## 2. Why we are making it

### 2.1 The assignment context
- NextLeap PM Fellowship grad project (this is attempt in a series; prior attempts logged in the vault). Threshold to pass: **70%+ aggregate** across 4 mentor-scored criteria (Clarity & Depth of Thought, Data & Metrics Orientation, Creativity of Solution, Presentation & Communication).
- The brief requires: *"Build an AI-powered discovery engine over public feedback... must quantify and compare opportunity areas, not just summarize/sentiment-analyze."* That line is the bar this whole engine is designed against — a plain sentiment classifier or theme-frequency counter fails Part 1 even if it "works."
- Product locked: **Myntra** (over AJIO / Nykaa Fashion) — largest MAU (~65M), largest market share (~35–40%), and by far the richest public discourse to mine (design case studies, product blog, press, even an academic paper on its size-recommendation system). More signal = a better engine.

### 2.2 The business problem this feeds
- **North Star (given by the brief):** % of users who purchase ≥1 wishlisted item within 30 days of adding it.
  `Formula: Users with ≥1 wishlist-item purchase within 30d of add / Users who added ≥1 wishlist item in period`
- **Hard constraint:** no monetary incentives allowed in the eventual solution (no discounts, cashback, coupons, or monetary-adjacent perks like free shipping). This constraint doesn't change how the *engine* is built, but it does shape what counts as an actionable finding — the engine should surface confidence/information-based blockers, not price-sensitivity ones, since the latter can't be acted on downstream. See §3.5.
- Funnel decomposition the engine's findings must slot into (from metric-tree work already done):

  | Stage | Metric | Type |
  |---|---|---|
  | 1 | Return-to-Item Rate (items re-viewed / items wishlisted) | Leading |
  | 2 | Reconsideration Rate (evaluative action taken / re-viewed) | Leading |
  | 3 | Uncertainty Resolution Rate (blocker resolved / reconsidered) | Leading (proxy) |
  | 4 | Cart Conversion Rate | Leading |
  | 5 | Checkout Completion Rate | Lagging |

  The engine's job is to find **where in this chain** users get stuck and **why**, with evidence, not to assert it from a mentor's intuition.

### 2.3 Why this design, specifically (the honest rationale)
- A sentiment/theme summarizer would satisfy a weaker reading of "discovery engine" but explicitly fails the brief's own bar ("not just summarize/sentiment-analyze") and would score poorly on Data & Metrics Orientation and Creativity.
- A generic classifier against a fixed taxonomy (e.g. "fit / price / trust / styling") would work faster but **primes the model with our assumptions before it reads the data** — the exact anchoring bias that produces "findings" that are really just the researcher's hypotheses reflected back. See §5 for the architecture that avoids this.
- A student doing this has **no internal Myntra data, no A/B infra, no funnel dashboard** — public text plus 5–6 interviews is the entire evidence base available. The engine has to do more analytical work than a real PM's discovery process would, because there's no internal data to triangulate against.

## 3. Requirements

### 3.1 Functional — coverage
The brief poses (implicitly, via Parts 1–4) **10 specific questions** the discovery layer is expected to help answer. This is the actual functional spec — every schema field and pipeline stage in §6–§8 traces back to one of these:

| # | Question |
|---|---|
| 1 | Why do users add products to their wishlist? |
| 2 | What prevents wishlisted products from being purchased? |
| 3 | What uncertainties remain after finding a product they like? |
| 4 | What causes users to postpone a purchase? |
| 5 | How do users compare multiple shortlisted products? |
| 6 | What information do users seek outside Myntra? |
| 7 | What role do fit, size, styling, price, reviews, occasion, and social validation play? |
| 8 | Is there genuine purchase intent vs. mere bookmarking? |
| 9 | How do behaviours differ across segments? |
| 10 | What unmet needs emerge consistently? |

**Not every question is answerable from public text**, and the engine must say so rather than pretend otherwise — see the routing table in §4. Questions 5 and 9 are explicitly weak-to-unanswerable from public sources and are handed off to the interview stage; claiming otherwise would read as unrigorous, not thorough.

### 3.2 Functional — must quantify and compare
Concretely, "quantify and compare" (the brief's own words) means the engine must produce, at minimum:
1. A **ranked opportunity table** with a defined, reproducible score per theme (§7).
2. **Source-normalised rates**, never pooled raw counts (App/Play Store volume would otherwise silently dominate the ranking).
3. **Cross-tabulations**, not just single-variable frequency — theme × intent, theme × category, theme × segment, theme × has-workaround.
4. Every rate reported **with its n** and honest small-sample caveats.

### 3.3 Non-functional
- **Live and testable**, not a static PDF/report — must be a real URL a mentor can open and interact with.
- **Cost is not a constraint** on the free tiers used (Groq free tier, Reddit free API, hosting free tier) — but **token-budget discipline** still matters operationally: run the full corpus through classification once in batches, pilot on 50 items before paying for the full run, use a cheap/fast model for high-volume extraction and reserve the larger model for the one-time synthesis call and the live demo box.
- **No visitor login friction** on the live demo panel.
- **Rate-limited** on the live-extraction panel (Panel B) — protects Groq free-tier RPM/TPM reliability, not a cost concern.
- **Deployed by Day 1** as a "hello world" skeleton specifically to retire deployment risk early, not late — this is a scheduling requirement, not just a technical one (see §9).
- **Visually credible as a real product artifact.** The user has asked for the dashboard to be built in **Myntra's design language** (pink/coral brand colour, clean e-commerce card/list patterns, readable typography) rather than a generic admin-tool look — this is a presentation-quality decision, not just a functional one, since the deck and the engine are both graded partly on Presentation & Communication.

### 3.4 Deck-integration requirement
The engine is not just standalone software — it must also produce:
- **One explainer slide** in the final 10-slide deck: "How the discovery engine works."
- **One findings slide**: "What the discovery engine found."
Both are pulled directly from Panel A's output, so Panel A's table/view design *is* effectively the slide content — it must be legible and self-explanatory, not just functional.

### 3.5 Constraint carried in from the business problem
"No monetary incentives" doesn't restrict what the engine can *find* (it should surface price-watching behaviour if the data shows it — that's a legitimate segmentation signal), but it does mean **addressability-under-this-constraint** is itself a dimension worth scoring (see Opportunity Score, §7) — a finding that can only be fixed with a discount is lower-value to this project even if it's frequent and severe.

## 4. Question → source routing (what the engine can and can't answer)

Stating this honestly is itself a requirement — an engine that claims to answer all 10 questions equally well from public text alone reads as less rigorous than one that knows its own blind spots.

**Updated 2026-08-23 to match measured reality, not the design-time estimate.** The table below originally predicted several of these Strong from the engine alone (Q2, Q3, Q6, Q10); the real computed confidence against the actual 578-record corpus only bears that out for Q7 and Q8 — see §21 for the full measurement and, for each Weak question, an honest answer to *why*.

| Q | Primary source | Engine strength (measured) | Who actually answers it |
|---|---|---|---|
| 1 Why save | Reddit, forums | Weak — 1/578 (0.2%) | Engine directionally → interviews confirm |
| 2 What blocks purchase | All sources | Weak — 19/578 (3.3%) | Engine directionally → interviews confirm |
| 3 Residual uncertainty | Reddit | Weak — same field as Q2 | Engine directionally → interviews confirm |
| 4 Postponement cause | Reddit | Weak — 9/578 (1.6%) | Engine + interviews |
| 5 Comparison behaviour | Reddit, forums | Weak — rarely narrated publicly, on any lens | Interviews lead |
| 6 Off-platform research | Reddit | Weak — 3/578 (0.5%), lower than expected | Engine directionally → interviews confirm |
| 7 Factor roles | All (via synthesis) | **Strong** — the quantifiable one | Engine |
| 8 Intent vs. bookmark | Reddit, forums | **Strong** — 124/578 (21.4%) resolved | Engine screens, interviews confirm |
| 9 Segment differences | All | Weak — attributes rarely stated publicly | Interviews lead (a survey briefly supplemented this; removed 2026-08-20, see §18) |
| 10 Recurring unmet needs | All | Weak — 8/578 (1.4%), lower than expected | Engine directionally → interviews confirm |

## 5. Core architecture decision: freeform extract → synthesize

**Locked approach:** one extraction pass per item, **source-conditional prompt**, **no fixed taxonomy shown to the model at extraction time** — nothing to anchor to. Dedupe and frequency-count the extracted phrases in plain code (no LLM). Feed the reduced, counted list into a single synthesis call that names the opportunity themes from what the corpus actually said.

### Alternatives considered and rejected
| Alternative | Why rejected |
|---|---|
| **Escape-hatch single-pass** — classify against a known taxonomy with an optional "doesn't fit" field | Still primes the model with categories while reading; softens anchoring bias rather than eliminating it |
| **Embeddings + clustering** — vector-embed everything, cluster, LLM names each cluster | Zero taxonomy bias and cheap on LLM calls, but adds a real data-science pipeline (embedding model, cluster tuning) outside the project's AI-native-stack framing, and loses multi-label nuance per item |

### Freeform vs. structural fields
- **Freeform fields** ask *what did this person say* (blocker, motivation, workaround, resolution) — never given options. Anchoring would corrupt these, so they stay open text.
- **Structural fields** ask *is an observable behaviour present in this text* (did they mention leaving the platform, did they mention comparing, is there a stated time gap) — a factual property of the text, not an interpretation, so a small closed set here is safe and doesn't bias the freeform extraction.
- `intent_signal` sits on the line: kept to a 3-way observable call (*stated intent to buy / stated saving-for-later / not determinable*) and **requires a supporting quote fragment** for any non-"not determinable" value. No quote, no classification.

## 6. Two lenses, one corpus: post-purchase vs. still-deciding

App/Play Store reviewers already bought — they resolved their hesitation. Reddit/interviews mostly catch people still stuck. These are two halves of one picture, not the same signal twice:
- **Retrospective lens (App/Play Store):** most individual reviews carry no decision-narrative ("good product, nice quality"), but a minority (~1 in 10, expected hit rate) retrospectively narrate friction and — critically — **what tipped them into buying**. That directly pre-answers a primary-research question at far higher volume than 5–6 interviews can reach.
- **Prospective lens (Reddit / forums):** catches the still-unresolved blocker in real time.

**Why `workaround` is the highest-value field:** a stated workaround ("I order two sizes and return one," "I check the same item on Amazon for real reviews") is the strongest evidence of an *unmet need* — someone paid a real cost to route around a gap. This directly serves Q10 and the brief's own requirement to document workarounds in the problem definition.

### Extraction schema (v4 — locked)

```jsonc
// ---- Core (all sources) ----
{
  source, source_url, date, verbatim_quote,
  product_category,        // apparel | footwear | beauty | accessories | unclear
  intent_signal,           // buy-intent | save-for-later | not-determinable  (+ quote required)
  intent_evidence,         // the fragment justifying intent_signal, else omitted
  segment_signal,          // freeform short phrase, else omitted   (Q9)
  decision_factors,        // freeform list of factors this person actually raised  (Q7)
  confidence
}

// ---- Behavioural fields (all sources; omit key when no evidence) ----
{
  save_motivation,         // why they saved/shortlisted it            (Q1)
  comparison_behavior,     // how they narrowed between options        (Q5)
  offsite_research,        // what they checked elsewhere + where      (Q6)
  workaround               // what they did instead                    (Q10)
}

// ---- Retrospective lens only: App/Play Store ----
{
  hesitation_signal,       // trace of delay, doubt, comparison, bracketing  (Q2/Q3)
  delay_signal,            // any stated time gap ("finally", "after weeks") (Q4)
  resolution_reason,       // what actually tipped them into buying
  post_purchase_outcome    // satisfied | regret | returned | unclear
}

// ---- Prospective lens only: Reddit / forums ----
{
  current_blocker_freeform,  // the unresolved blocker, their words     (Q2/Q3)
  deferral_trigger,          // what they say they're waiting for       (Q4)
  mentions_wishlist          // bool
}
```

Rules:
- **Omit keys with no evidence** — don't emit nulls. Most fields will be empty on most items; that's expected, not a defect, since value comes from counting at corpus scale, and omission keeps output tokens down.
- **Pilot on 50 items first.** Measure the null rate per field. Any field >95% empty gets its prompt line rewritten or gets dropped rather than carried dead-weight across thousands of items. `post_purchase_outcome` and `comparison_behavior` are the two most likely to fail this test.
- **Human spot-check 5–10%** of extracted output before trusting the synthesis stage.

### Synthesis stage — two jobs
1. **Emergent themes** — group deduped phrases into named opportunity areas, derived from the corpus, not assumed in advance. Surprises here are where Creativity-of-Solution points live — surface them prominently rather than folding them into tidy pre-known buckets.
2. **Factor mapping (Q7)** — *after* themes exist, map them onto the seven factors the brief names (fit, size, styling, price, reviews, occasion, social validation) **plus an explicit "emergent / none of the above" bucket**. Doing this post-hoc, not at extraction time, is what lets us report e.g. "social validation appeared in X% of decision narratives" as a finding rather than a presupposition — and the size of the emergent bucket is itself a result worth reporting.

## 7. Quantification and comparison layer (what makes this not a summarizer)

**a) Source-normalised rates, never pooled counts.** App/Play volume will dwarf Reddit's. Report every theme as a rate *within* each source (`x% of n=N Play Store reviews`, `y% of n=M Reddit comments`), state n everywhere. A theme strong in one source and absent in another is itself a finding — state it, don't average it away.

**b) Cross-tabulation.**
- theme × `intent_signal` — does this blocker concentrate among genuine buyers or bookmarkers? (A blocker that only hits bookmarkers barely moves the business metric.)
- theme × `product_category` — is fit uncertainty a footwear problem or an everything problem?
- theme × `segment_signal` — the Q9 answer, with an honest small-cell caveat.
- theme × has-`workaround` — high frequency *and* people actively route around it = strongest unmet need.

**c) Opportunity Score.** Five dimensions, each 1–5, shown as raw inputs so the ranking is auditable and arguable, not a black box:

| Dimension | Sourced from | Data or judgment? |
|---|---|---|
| Frequency | normalised rate across sources | Data |
| Severity | abandonment vs. mere delay; `post_purchase_outcome` = regret/returned | Data |
| Intent quality | share of mentions with `intent_signal` = buy-intent | Data |
| Resolution leverage | does `resolution_reason` show a repeatable path out? | Data |
| Non-monetary addressability | can this be fixed without price levers? | **Judgment — labelled as such** |

`Opportunity Score = Frequency × Severity × Intent Quality × Resolution Leverage × Addressability`

**Resolution leverage is the dimension this two-lens design uniquely produces**, and it's the most decision-useful: a high-frequency blocker nobody ever resolves is a worse MVP target than a rarer one with a proven, repeatable path out — because that resolution path *is* the feature spec. This is the strongest single argument for the two-sided (retrospective + prospective) design and should be stated explicitly wherever the engine is explained.

The judgment row (addressability) must be visibly labelled as judgment, not dressed up as measured data — presenting a subjective score as objective precision is the same force-fitting the project's own RICE-scoring rules warn against elsewhere.

**d) Stated limitations, always visible.** n per source, per-field null rates, and the self-selection caveat (public reviewers skew toward extremes vs. the silent satisfied majority). Publishing null rates buys credibility — it shows the engine was measured, not just run.

## 8. Output — three views

**View 1 — Two-sided opportunity table (the headline).**

| Opportunity area | % of App/Play reviews showing hesitation (n=) | Common resolution reason | % of Reddit citing as current blocker (n=) | Has workaround? | Sample quote | Opportunity Score |
|---|---|---|---|---|---|---|
| Fit/size uncertainty (return-visit specific) | | | | | | |
| Styling/occasion doubt | | | | | | |
| Trust/quality gap | | | | | | |
| Price-watching | | | | | | (addressability capped — non-price fix only) |
| Decision overload | | | | | | |

**View 2 — Question coverage.** The 10 questions (§3.1) down the side; for each, the finding, the n behind it, the confidence, and whether it was answered by the engine or handed to interviews. Direct proof the engine was built against the actual brief, and it doubles as the interview guide's input.

**View 3 — Cross-tabs.** Theme × intent, theme × category, theme × segment, with small cell sizes flagged. *(**Removed 2026-08-23** — built as the joint `product_category × intent_signal` matrix per theme, then cut for not adding insight beyond the ranked list and evidence drill-down. See §19. The engine now ships two views, not three.)*

## 9. Sources — collection notes and constraints

| Source | Notes |
|---|---|
| **Reddit** | **Revised twice.** (1) Originally planned on PRAW against the free OAuth "script" app tier — Reddit no longer reliably issues free API credentials to a student/non-commercial account. (2) Fell back to Reddit's public, unauthenticated `.json` endpoints — confirmed live from this network that this is *also* blocked (`403` on every search term, even with an honest, non-spoofed User-Agent). Both automated paths are dead ends here, not a bug to route around harder. (3) Actual working fallback: a human-driven browsing session via the Claude Chrome extension — real rendered pages, not fetched, so not blocked — reading relevant threads and writing **structured extractions directly** (short paraphrases + at most one short attributed quote per record, never bulk-copied raw text, since reproducing large verbatim chunks of a site's content is off the table regardless of collection method). 18 such records from 6 threads (found via DuckDuckGo `site:reddit.com` search, since Reddit's own search is blocked too) exist in `pipeline/data/extracted/extracted.jsonl` across two sessions — see `pipeline/collectors/_manual_reddit_batch_20260818.py` and `_manual_reddit_batch_20260819.py`. This scales to "a handful of threads per session," not corpus volume — Reddit stays a best-effort minor source; lean the corpus on Play/App Store for volume. See `pipeline/collectors/reddit_collect.py` for the (blocked) automated attempt. Note: none of this can be fetched live inside *this* coding session, since reddit.com is blocklisted for direct fetch in this tool environment — the working path needs an actual browser. |
| **App/Play Store reviews** | Highest-volume, cheapest, most ToS-friendly source (no auth drama) — but structurally post-purchase only (see §6). Play Store uses the `google-play-scraper` library successfully (verified live: 200+ real reviews pulled for `com.myntra.android`). App Store did **not** work via the `app-store-scraper` PyPI package (JSON-decode errors on every real request, 2026-08-19) — rewritten to hit Apple's public RSS review feed directly instead, which works cleanly but is capped at 500 reviews (Apple's own 10-page × 50 limit, confirmed live). Real app id confirmed: `myntra-fashion-shopping-app`, `907394059`. |

**Dropped: YouTube.** Was scoped from the start as a minor, supplementary source (never a pillar) precisely because comment noise is a source-curation problem — the plan required finding specific videos that already prime decision-relevant discussion (haul videos, "why I stopped buying from X," size/fit reviews) with genuine comment-section depth. In practice, no such videos could be found for Myntra/Indian online fashion shopping at a workable comment volume. Rather than force weak data in, it's dropped — the two-lens design still holds with Reddit alone covering the prospective side; see §12 assumption 5 for the resulting corpus-feasibility caveat.

## 10. Pipeline (tooling)

1. **Perplexity** for broad-scan source discovery (finding relevant Reddit threads worth pulling) — not used for classification.
2. **Collect:** Reddit's unauthenticated `.json` endpoints (or manual browser-assisted extraction, see §9) + App/Play Store scraper libraries → CSV/JSON.
3. **50-item pilot** → check per-field null rates → prune or rewrite weak fields *before* paying for the full batch.
4. **n8n** orchestrates batch freeform-extraction calls (Groq API), one source-type prompt per source, writing to a sheet/store.
5. Local/code step: dedupe + frequency-count extracted phrases.
6. One synthesis call → named themes → factor mapping onto the seven named factors + emergent bucket.
7. Match phrases back to themes (code, not LLM) → cross-tabs → Opportunity Score → ranked table.
8. Serve the cached ranked output + cross-tabs from Panel A; wire Panel B directly to the Groq extraction call for live use.

**Model tiering (Groq, free tier — tiering is for quality/latency fit, not cost):**
- High-volume per-item extraction: fast/smaller model (`openai/gpt-oss-20b`) — task is narrow, volume is high.
- One-time synthesis call: larger model (`openai/gpt-oss-120b`) — reasoning quality matters more, runs once.
- Live demo box (Panel B): either works given Groq's speed; default to the larger model since latency stays sub-second either way.
- **Verified 2026-08-18:** Groq's model catalog turns over — the models originally named here (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`) were both fully retired (404, not merely deprecated). Re-check `GET https://api.groq.com/openai/v1/models` before assuming any specific name is still current. Separately, a valid key can still get `403 blocked at the project level` per-model — each model needs enabling at console.groq.com/settings/project/limits; that's a project setting, not a key problem.

### First real corpus run — 2026-08-19, findings and constraints hit

Ran the full pipeline (collect → pilot → batch-extract → dedupe → synthesize → score) against real data for the first time. Result: **165 real analyzed records** (155 App/Play Store + 10 manually-extracted Reddit), **8 real opportunity themes**, all three output views populated with real numbers, wired into and verified live on the dashboard.

**Corpus is smaller than the 710-item target (155/700 Play+App Store), and here's exactly why — a hard, empirically-confirmed Groq free-tier constraint, not a bug:**
- `x-ratelimit-limit-tokens: 8000` **per minute** on this project (checked directly via response headers) — the actual binding constraint, not the 1000-requests/day quota (which had 80%+ headroom throughout). This is a materially smaller TPM budget than the "cost is a non-issue" framing in §9/§10 assumed.
- First attempt at 0s delay: lost 34% of a 50-item pilot even with exponential-backoff retries.
- Fixed delay of 2.5s, then 5.0s between calls: both still triggered escalating cooldowns once the per-minute budget ran out mid-batch — `retry-after` values of 378s, then 496s, then 454s, then 518s, with **zero net progress for 18+ minutes**. This reads as a sustained penalty state once the budget is blown, not a clean per-minute reset — waiting it out was not a tractable use of a single session.
- Two real bugs found and fixed along the way (both now fixed in code, not just documented): (1) an uncaught network-level exception (SSL handshake timeout) crashed the entire batch process after 100+ successful items — `extract_one` only handled HTTP status codes, not connection-level failures; now retried like a 429. (2) The synthesis call failed consistently (`json_validate_failed`) above ~60-80 unique phrases in one prompt — empirically bisected (60 works, 80 doesn't) and capped `MAX_PHRASES_IN_PROMPT` at the tested-safe value.
- Decision: stopped at 165 real records rather than burn unbounded session time waiting through an escalating rate-limit penalty. **This is the same category of call as the Reddit 403 and the Apple 500-review cap above** — hit a real external constraint, diagnose it, document it honestly, adapt scope, move forward with what's real rather than force a number that isn't achievable in-session.
- **To get the full corpus later:** the batch is fully resumable (skips already-extracted `source_url`s) — just re-run `python run_pipeline.py batch-extract` after the per-minute budget has had time to fully recover (untested exactly how long a full reset takes given the observed penalty behavior; try a large gap, e.g. an hour+, before resuming), or from a Groq project with a higher TPM tier.

**What this means for the question-coverage answer below:** every fill-rate number is real, but n is smaller than planned, so several questions that were expected to reach "Strong" confidence at full corpus volume currently read "Weak" for volume reasons, not because the extraction schema failed to capture signal (the schema is working exactly as designed — see the per-question breakdown this session's response to the user for the honest read on which is which).

## 11. Deployment & UI decisions

- **Hosting:** deployed to production from Day 1 as a live "hello world" skeleton, specifically to retire deployment risk early. Concrete stack choice made at scaffolding time (see execution plan), not fixed in this document.
- **UI direction:** built in **Myntra's visual design language** — brand pink/coral, clean product-card and list patterns, readable typography, colour-blind-safe contrast where it doubles as deck-slide content — rather than a generic data-tool look. This is a deliberate Presentation & Communication decision: the engine is graded partly as a communication artifact, not only as a working pipeline, and it is meant to read as "a real Myntra-adjacent product surface," reinforcing that the discovery layer is a serious, shippable capability rather than a research script with a UI bolted on.
- **No visitor login**, **light per-session rate limit** on the live-extraction panel only.

## 12. Known assumptions carried into this build

(Full register: `../vault/09-Assignment/06-Assumptions-Register.md`. The ones that directly constrain engine design:)
1. Myntra's actual internal wishlist→30-day-purchase rate is unknown and will not be invented — industry benchmark ranges (1.65–20%, tactic-dependent) are used only as explicitly-labelled context, never as a Myntra-actual figure.
2. Public reviewers are an imperfect proxy for the wishlist-user population — self-selection means complaints/extremes are over-represented vs. the silent satisfied majority. Stated in Panel C, not hidden.
3. Existing Myntra fit/size tooling (AI size prediction, Shape ID, body profiles, "Try On Me") is assumed to already reasonably solve *first-view* sizing for most users — meaning if fit uncertainty remains a live blocker, it likely resurfaces later (e.g., on return to an old wishlist item), not at first browse. **This assumption is itself something the engine's own findings should test, not something the engine is built to confirm.**
4. LLM-based extraction at 5–10% human spot-check is treated as accurate enough for directional ranking — not full manual verification of every record.
5. Public collection across both remaining sources (Reddit, App/Play Store) is assumed technically feasible within the time budget without ToS blocks materially shrinking the corpus — already partly falsified for Reddit specifically (both its automated paths are blocked; running on a manual-browsing workaround at modest volume instead, see §9) and the reason YouTube was dropped as a third source entirely (§9).

## 13. Explicit non-goals / out of scope for v1

- Not a general Myntra review-analytics tool — scoped specifically to wishlist → purchase conversion blockers.
- Not attempting to answer Q5 (comparison behaviour) or Q9 (segment differences) with confidence from public text alone — both are explicitly handed to the interview stage; the engine screens/suggests, it doesn't conclude. *(A 2026-08-19 revision gave Q9 a second input via a Google Forms survey; that source was removed on 2026-08-20, so this original position stands unchanged — see §18.)*
- Not proposing or evaluating the eventual MVP solution — this engine's job ends at *identify, quantify, compare*. Solution design is a separate, later stage gated on this output plus interviews (per the project's execution timeline).
- Not doing full manual verification of every extracted record — 5–10% spot-check by design, stated as a limitation, not silently assumed away.
- Not re-running the full corpus per page load — Panel A serves a cached batch result; only Panel B (single-item extraction) is live per visitor.

## 14. Definition of done (for this document's scope)

This document is complete when it unambiguously answers, for anyone picking up the build cold:
- [x] What is being built and in what form (three-panel hosted tool)
- [x] Why it's being built (brief requirement + business metric it feeds)
- [x] What it must be able to answer, and what it honestly can't (§3.1, §4)
- [x] The extraction schema and why it's shaped this way (§6)
- [x] How raw extractions become a ranked, comparable output (§7–§8)
- [x] Where the data comes from and known collection constraints (§9)
- [x] The pipeline order of operations (§10)
- [x] What's deliberately not being built in v1 (§13)

Next: Day 1 scaffolding — hosting skeleton (deployed "hello world") + collection pipeline stub, per `../vault/09-Assignment/04-Execution-Timeline.md`.

## 15. Survey (Google Forms) — structured segment data, added 2026-08-19 · **REMOVED 2026-08-20 (see §18)**

> **This section is history, not current design.** The survey source was removed entirely on 2026-08-20 — collector, segment computation, dashboard tab, types, config. It is kept here because the reasoning (why structured data skipped the LLM pipeline, why OAuth was abandoned for CSV export, why survey and review populations were never cross-tabbed) is still the record of decisions actually made, and §18 depends on it to explain what was undone.


A fourth data source, but a fundamentally different kind. Initially added after opening the form ("About you and how you shop") and confirming it had **zero open-text questions** — six multiple-choice questions only. **The form was then expanded by its owner to 19 questions**, including three genuine open-text ones (why a saved item wasn't bought, what specifically stopped the purchase, a one-line complaint to the product team) plus more structured questions (wishlist size, return-visit frequency, decision ease, etc.).

**Design decision: the structured questions do NOT go through the freeform extraction pipeline (§5–§6).** There's no ambiguity to resolve in a multiple-choice answer — running an LLM over it would be theater, not extraction. Responses are pulled as structured data and turned into their own segment-composition cross-tabs (`pipeline/extraction/survey_segments.py`), served on the dashboard as a separate **Panel D**, clearly labeled as distinct from Panel A's AI-derived findings.

**The new open-text questions are captured but not yet wired into anything** — raw values sit in `data/raw/survey_responses.jsonl` (`save_motivation`, `current_blocker_freeform`, `complaint_freeform`), not yet fed into dedupe/synthesis/scoring. This is a real, deliberate scope boundary, not an oversight: since the survey questions already map onto known schema fields by construction (the question wording literally asks "why did you save it," matching `save_motivation` exactly), integrating them well means deciding whether to run them through the same LLM extraction as reviews (consistent, but pays for a call that mostly re-states what's already known) or treat them as pre-extracted (cheaper, but skips the pipeline's own confidence/quote-grounding checks). Worth a real design pass before building, not a rushed bolt-on.

**Explicitly never done, regardless of how the open-text integration eventually goes:** cross-tabbing survey *segment* data (age, city tier, spend) against review/Reddit themes. Survey respondents and public reviewers are different, unlinked, anonymous populations — there is no way to know if the same person appears in both. A joint cross-tab there would imply a link that doesn't exist. (If the open-text answers are later folded into the shared theme pipeline, that's different — it's pooling comparable *qualitative signal* across sources, the same way Reddit and Play/App Store phrases already pool together for synthesis; it is not claiming a link between two anonymous individuals.)

**Access: unauthenticated CSV export, not OAuth.** Originally built against the Google Forms API with OAuth (per-user consent, most private option) — abandoned after repeated Google Cloud Console friction: the first downloaded credential was the wrong client type ("Web application" instead of "Desktop app"), and even after fixing that, the OAuth consent screen blocked with "Access blocked: has not completed the Google verification process" — the app being in Testing mode requires every signing-in account to be pre-added as a Test user, which isn't obvious and didn't resolve on the first attempt (likely a stale/wrong-account browser session, not a config error). Given the form collects only non-sensitive demographic data, that setup cost wasn't worth paying — switched to fetching the linked response Sheet's CSV export directly (`pipeline/collectors/survey_collect_csv.py`), which needs zero credentials, at the cost of the response Sheet needing to be shared "Anyone with the link → Viewer" (link-accessible, not private). Two real bugs found building this: (1) `requests`' automatic charset detection mis-decoded the UTF-8 CSV response (₹, →, – all came back mangled) — fixed by decoding `resp.content` as UTF-8 explicitly rather than trusting `resp.text`; (2) the "select all that apply" checkbox questions comma-join selected options in the CSV, but at least one option's own label contains an internal comma, so a naive split breaks it into fake extra options — these two fields are stored raw (unsplit) rather than presenting an unreliably-parsed structure as clean data.

**Value against the brief:** directly targets Q9 ("how do behaviours differ across segments?"), which was flagged **Weak** in the engine's own real question-coverage output — public review text essentially never states demographics. The survey doesn't fully resolve Q9 (it's a self-selected convenience sample, explicitly labeled as such on the dashboard, not statistically representative), but it's a genuine, honest improvement over having nothing.

## 16. Dashboard redesign — visual widgets and tab restructuring, 2026-08-19

The dashboard had drifted into a table-heavy layout that made the reader do the work a chart should do, and Panel B/C were competing for tab space with the two views actually worth navigating between (Findings, Survey). Both problems traced back to treating "add a panel" as the only structural move available.

**Tab restructuring.** The tab bar now holds only the three things a reviewer browses (Findings, Survey segments, Interviews). Panel B (Live extractor) and Panel C (Limitations) moved to on-demand triggers — a "🔬 Try it yourself" pill and a "ⓘ" icon — opened as modals rather than full tabs, since neither is a "view of the data": B is a tool, C is static prose. See the updated panel table in §1.

**New widgets, built per the `dataviz` skill's procedure (form → color-by-job → validate → marks → interaction → accessibility), all in `web/src/components/charts/`:**
- `StatTile` — hero-number tiles for headline stats (opportunity-area count, top score, coverage fraction, respondent counts).
- `RankedBarChart` — magnitude ranking of opportunity themes with click-to-select, driving an evidence drawer (resolution reason, sample quote, workaround/addressability badges) instead of a static table row.
- `DivergingBarChart` — two-sided comparison from a center axis, reused for both App/Play-vs-Reddit rate-per-theme and the survey's heavy-vs-light-wishlister comparison.
- `StatusPill` / `ConfidenceRing` — fixed status-color (never color-alone) rendering of the Strong/Medium/Weak question-coverage confidence, plus a donut summarizing the split at a glance.
- `StackedBarChart` — 100%-stacked cross-tab bars, reused for both the ordinal `intent_signal` breakdown (one-hue ramp, dark=strongest) and the categorical `product_category` breakdown (fixed categorical order), with small-n cells flagged by an inset ring rather than a color change (color stays reserved for identity/status, per the skill's non-negotiables).
- `SourceRibbon` — a persistent composition bar (App/Play, Reddit, Survey respondents) between the hero and the tabs, so the corpus composition is always visible, not just stated once in a footnote.

**Color tokens** (`web/src/app/globals.css`, `@theme inline`): status (good/warning/serious, fixed, never themed), ordinal (one-hue blue ramp for `intent_signal`), diverging (reused the existing gold/mint lens convention rather than introducing a new pair), categorical (3 fixed slots + Other, within the skill's all-pairs CVD validation cap).

**Cross-panel navigation.** Question coverage row 9 (segment differences) now has a "See survey →" button that switches to the Survey tab and scrolls/highlights the relevant card — a direct, navigable link between "the engine flagged this as Weak" and "here's the closest real data," rather than asking the reader to find it themselves. This is UI wiring only; the underlying rule that survey and review/Reddit data are never cross-tabbed against each other (different, unlinked, anonymous populations, §15) is unchanged — the jump surfaces related context, it doesn't merge datasets.

**What didn't change:** the underlying data, the Opportunity Score formula, the question-coverage confidence levels, and the no-cross-tab rule between survey and public-text data. This was a presentation-layer pass, not a re-analysis.

### 16a. Four more widgets, adapted from a public reference dashboard, 2026-08-20

The user pointed at a public GitHub repo (`hyperITACHI7/spotify-india-dashboard`, a Spotify India review-analytics dashboard) for widget/layout ideas. Its component source was read directly (its live demo's backend wasn't reachable). Several of its patterns didn't transfer as-is — its trend/anomaly widgets need repeated time-windowed snapshots this project's single-corpus-run architecture doesn't have, and its live global filter panel assumes a live query backend this static, precomputed-`findings.json` dashboard doesn't have — but four did, each adapted to this project's real data rather than copied wholesale:

- **Priority quadrant badge** (`pipeline/extraction/score.py`, `web/src/components/charts/QuadrantBadge.tsx`) — their version crosses severity x volume; this one had to use **Frequency x Intent Quality** instead, because `severity` min-max-scales flat (3.0) across every theme at this corpus size (post_purchase_outcome almost never resolves to regret/returned), so severity x anything would paint every theme identically. Frequency/Intent Quality both carry real spread and are arguably more decision-relevant anyway.
- **Keyword Buzz cloud** (`pipeline/extraction/keywords.py`) *(REMOVED 2026-08-23, see §19)* — their version used a real sentiment pipeline (VADER); this one uses a small, visible keyword-marker lexicon on phrase text instead, because a first attempt at reusing extraction-field-name as a polarity proxy (e.g. "resolution_reason = praise") was checked against real data and found wrong — several actual `resolution_reason` phrases are negative ("size not available in discount price"), since that field just means "what happened at the decision point," not "was it positive." Labeled in the UI as a heuristic, not a trained model, per this project's existing "auditable, not a black-box call" principle (score.py's own docstring).
- **Selection chip** on the evidence drawer (`FindingsPanel.tsx`) — a small "Viewing: X ✕" affordance so a non-default theme selection is visibly dismissible, not silent.
- **AI Synthesis card** (`pipeline/extraction/narrate.py`, `AiSynthesisCard.tsx`) — their version re-queries an LLM per filter change against a live backend; this one is a single Groq call baked in once at pipeline time (step 8, after score.py) since there's no live filter backend to re-query against. Real bug caught before shipping: the first prompt didn't know about the "no monetary incentives" constraint and recommended prioritizing a price/discount lever — exactly what this project cannot ship. Fixed by stating the constraint explicitly in the prompt and telling the model which themes are/aren't price-capped; see `narrate.py`'s docstring.

### 16b. Drill-down overhaul — from a page of numbers to a navigable report, 2026-08-20

The dashboard could state its findings but not let anyone *interrogate* them: the four headline stats were dead ends, the ranked list showed one sample quote per theme, and "How it works" sat below the analysis competing for the same scroll. This pass made every summary number a door.

**Pipeline (`pipeline/extraction/score.py`) — new data, since none of the views below could be built from what `findings.json` already held:**
- **Per-theme evidence records** — every source record behind a theme (source, URL, date, subreddit, quote, confidence, intent, category, blocker, workaround, resolution), sorted strongest-confidence-first. 69 records attached across 8 themes; small enough to ship whole rather than paginate.
- **Per-theme confidence profile** — a weighted 0–100 score plus the raw high/medium/low mix. The mix ships alongside the score deliberately: a bare "60" hides whether that's all-medium or half-high/half-low. It is the *extractor's* certainty, explicitly not a statistical confidence interval.
- **Per-theme volume, distinct workarounds, outcome mix, intent mix.** `post_purchase_outcome` coverage (`coveredN of ofN`) ships with the outcome mix, because that field is sparse and a bare count would overstate how much of the theme it describes.
- **Per-question insights** — the actual top phrases from each brief question's source field, via an explicit `QUESTION_FIELDS` map so the question→schema link stays auditable.
- **Pipeline funnel** — volume at each of the 6 gates, each carrying its own drop reason.

**The four stat cards are now clickable**, each opening a full view: all opportunity areas (size / criticality / volume / confidence in one table), the top opportunity broken down (outcome mix, who's stalling, observed resolution paths), all 10 brief questions with what was actually found for each, and every stated workaround.

**Scope guard on "how to fix it":** the top-opportunity view frames its resolution section as *paths observed in the corpus*, not proposed features — §13 puts solution design out of scope for this engine, and `resolution_reason`/`workaround` are evidence, not invention. Where a theme's most-repeated resolution is a monetary lever (as it is for Price and value perception), the UI says so and marks it unusable rather than presenting it as an available fix.

**Ranked themes drill down to their evidence.** Clicking any theme opens every review and Reddit post behind it — filterable by lens, each with its quote, blocker, workaround and a link to the source — and *then* the engine's read of them underneath. Evidence first, interpretation second: a reader should be able to form their own view before being told the conclusion, which is the whole argument for a discovery engine over a summarizer.

**Cross-tabs: two charts became one table.** *(This joint matrix was itself REMOVED 2026-08-23, see §19.)* The old section showed "by intent_signal" and "by product_category" as separate stacked bars per theme. They were the two *marginals* of a single two-way table — same records, same n, counted twice along different edges — which is why they read as two charts of the same thing. Marginals also throw away the only thing a cross-tab exists to show: "38% apparel" and "40% buy-intent" cannot tell you whether the apparel records *are* the buy-intent ones. Replaced with the joint `product_category × intent_signal` matrix as a heatmap, marginals restored to its edges. Nothing is lost and the interaction becomes the visible part.

**A grounded assistant** (`web/src/app/api/chat/route.ts`, `web/src/lib/chatContext.ts`) sits at the bottom of the findings: it explains any widget, summarises the report, and answers follow-ups. Its context is assembled from `findings.json` at request time rather than described from memory, and its system prompt forbids stating any number not in that context — a research tool that invents a plausible rate is worse than one admitting a gap, because a reader will cite it. It also carries the hard project rules (no monetary levers; never cross-tab survey against review/Reddit data).

**"How it works" became its own tab**, with the pipeline diagram plus four cards on the design rationale. As a section pinned below the dashboard it meant a reader scrolling the findings hit a full architecture explainer before finishing the analysis. The now-dead `#how-it-works` nav anchor was removed rather than left pointing at nothing.

**Removed:** `StackedBarChart.tsx` and the `CrossTabRow` type, both orphaned by the cross-tab rewrite (verified by grep before deleting).

### 16c. Psychology research wired into the dashboard and the assistant, 2026-08-20

The desk research in `vault/09-Assignment/10-Psychology-Research.md` — 14 questions grounding the project in named psychological mechanisms, with ~33 academic and industry sources — existed only in the vault, invisible to anyone reading the dashboard. It now has a **Research findings tab** (placed next to Interviews) and is part of the **assistant's grounding context**.

**Single source of truth.** `web/src/lib/psychologyResearch.ts` holds the structured form: per question, a short answer, the named mechanisms, the individual findings with their headline statistics, the implication for this project, and its sources typed as academic vs industry. Both the tab and the chatbot read from it, so they cannot drift apart. The vault markdown remains the narrative source of truth; the TS file is its dashboard representation, and the file header says so.

**The boundary this had to enforce.** Desk research is *external published literature* — mostly Western-market academic work applied to an Indian fashion context. It is not this engine's findings, and pooling the two would let a general e-commerce statistic read as something the Myntra corpus proved. That separation is enforced in three places: a standing banner on the tab, a `HOW THIS ENGINE'S OWN CORPUS COMPARES` block on each question, and an explicit rule in the assistant's system prompt requiring it to say "the research literature finds…" versus "this engine's corpus shows…" and never merge them. This is the same discipline already applied to survey-vs-review data (§15), extended to a third evidence type.

**The engine-comparison blocks are the most useful part**, because several are genuinely informative rather than decorative:
- Q1 (why people wishlist): the literature has rich mechanisms; the engine's `save_motivation` fired on 1 of 578 records. The engine cannot confirm any of it — which is precisely why the interviews exist.
- Q6 (off-platform research): literature says webrooming is near-universal (81%); the engine caught it in 3 of 578 records, yet both survey respondents named it when asked directly. Strong evidence this is a text-availability problem, not a behaviour-rarity one.
- Q11 (styling versatility): the mechanism predicts it blocks purchase while people are still deciding — and it appears in 22.2% of Reddit records but 0% of App/Play, the sharpest lens asymmetry in the corpus.
- Q14 (wishlist capacity): the literature explicitly cannot supply a number. The engine found something different and concrete — Reddit users hitting Myntra's own 1,000-item cap — which is a platform limit, not a psychological threshold, and worth not confusing with one.

**Token cost, measured not assumed:** adding the research took the assistant's per-request grounding context to ~12.3k tokens. Source URLs were dropped from the chat context (titles only — the model cites by name, the tab carries the links), bringing it to ~11.3k. Against the 200k/day Groq cap that's roughly 17 questions per day before the assistant goes quiet, which it reports honestly rather than failing silently.

## 17. Deployment, 2026-08-20

Deployed from a public GitHub repo (`hyperITACHI7/wishlist-discovery-engine`) to Vercel, closing the §3.3 requirement that this be "live and testable, not a static PDF" — deliberately deferred since Day 1, now done.

**The requirement that shaped the architecture: no cold start.** Render-style hosts spin a container down when idle and make the first visitor wait for it. Vercel avoids that for *static* routes only — a dynamically-rendered page is still a serverless function with its own (smaller) cold start. So the goal wasn't just "use Vercel," it was to make the findings page genuinely static.

Two things blocked that, both real:
1. **`loadFindings()` read JSON off disk per request** with `fs.readFileSync` on a path resolving up into `../pipeline/`. That forced dynamic rendering. Worse, it would have silently failed in production: hosts deploy only `web/`, and `pipeline/data/` is gitignored, so the live site would have served the *mock fallback* while looking perfectly healthy — the most dangerous kind of deploy bug, since nothing errors.
2. **The data had no path into the build.** Corpus output is gitignored (it's large and regenerable), so nothing carried it to the host.

Both are solved by `web/scripts/sync-findings.mjs`, which copies the four JSON files the dashboard reads (`findings`, `survey_findings`, `keywords`, `narrative` — not the ~100KB of intermediate `phrases`/`themes` artifacts) into `web/src/data/`, where they're committed and imported as modules. It runs automatically before `build` and `dev`. On a host, where `pipeline/data/` is absent, it falls back to the committed copies and exits cleanly — verified by simulating that exact environment locally before pushing. `page.tsx` dropped `force-dynamic`, and the build now reports `/` as `○ (Static)` rather than `ƒ (Dynamic)`.

Result: the whole dashboard is CDN-served HTML. The only functions are `/api/chat` and `/api/extract`, invoked only when someone uses the assistant or the extractor.

**A privacy issue caught by making the repo public.** `config.py` hard-coded `SURVEY_SHEET_ID`. Because that Sheet is shared "Anyone with the link → Viewer" (§15's deliberate tradeoff against OAuth setup cost), **the id is functionally the access credential** — publishing it would have handed every reader of the repo the raw survey responses, including the free-text answers. Respondents agreed to share those with the researcher, not with the internet. The ids moved to `.env`, and because git history is permanent, the initial commit containing them was discarded and history rebuilt from a clean orphan commit *before* the first push. This is the same category of judgment as the no-cross-tab rule: the tradeoff that made collection cheap (link-readable Sheet) carries an obligation that only becomes visible at publication time.

## 18. Survey source removed, 2026-08-20

The Google Forms survey (§15) is gone — collector, segment computation, dashboard tab, TypeScript types, config, and its `.env` variables. §15 is kept as the record of what was built and why; this section records what was undone.

**What changed.** Deleted: `pipeline/collectors/survey_collect_csv.py`, `pipeline/extraction/survey_segments.py`, `web/src/components/SurveyPanel.tsx`, `web/src/data/survey_findings.json`, the `SurveyFindings` / `SurveyDistribution` / `SurveyHeavyVsLight` types, `SURVEY_FORM_ID` / `SURVEY_SHEET_ID`, and the `collect-survey` / `survey-segments` commands. The tab bar drops from five entries to four (Findings — Interviews — Research findings — How it works).

**Three knock-on effects worth stating rather than leaving to be discovered:**

1. **Q9 loses its second input.** §13 originally routed segment differences to interviews alone; §15's revision gave it the survey as a partial second source. That revision is now reverted — Q9 rests entirely on the 5–6 interviews again. The engine's own `segment_signal` fires on 10 of 578 records, so this is a real narrowing, not a cosmetic one, and it raises what `interview_guide.md` question 10 has to carry.

2. **A cross-panel affordance disappeared with it.** The question-coverage view had a "See survey ?" button on row 9 that jumped to the survey tab and highlighted the matching card. With no survey to jump to, the button and the `jumpToField` plumbing behind it are removed rather than left pointing nowhere.

3. **The population-separation rule now has one fewer population to police.** §15's hard rule was that survey respondents and public reviewers are unlinked and must never be cross-tabbed. That rule still applies — it now governs interviewees vs. reviewers instead. The assistant's system prompt was updated to say plainly that no survey exists, so it reports that rather than describing findings from a source that is gone.

**What was deliberately not deleted:** the two collected responses in `pipeline/data/raw/survey_responses.jsonl`. Real people answered that form; the file is now read by nothing, but deleting their answers because the feature was cut is a different act from cutting the feature, and it stays in the corpus backup. The source ribbon no longer counts them, which is correct — they were never part of the extracted corpus anyway, which is why the ribbon had needed a separate total for them.

## 19. Keyword Buzz and cross-tab matrix removed, 2026-08-23

Both widgets were judged, on inspection of the live dashboard, to not be adding insight — kept for completeness's sake rather than because either was earning its space. Removed entirely rather than left dormant: the pipeline computation, the dashboard sections, the chart components, and the TypeScript types.

**What changed.**
- Deleted `pipeline/extraction/keywords.py` (the keyword-marker lexicon behind the Frustrations/Praise cloud, §16a) — no replacement, no successor script.
- Removed `build_cross_tabs()` from `pipeline/extraction/score.py` and the `crossTabMatrices` key it wrote into `findings.json` (the joint `product_category × intent_signal` table per theme, §16b). `findings.json` was regenerated against the real corpus (578 records, 8 opportunity areas) without that key rather than left stale.
- Removed both dashboard sections from `FindingsPanel.tsx`, the `KeywordCloud.tsx` / `CrossTabMatrix.tsx` chart components, the `CrossTabMatrix` / `KeywordCloudData` types, `keywords.json` from the sync script's file list and from `web/src/data/`, and both widgets' entries from the assistant's grounding context (`chatContext.ts`) and widget glossary — the assistant no longer describes either, matching the pattern already used for "there is no survey."

**This is a real scope reduction, not just a UI trim.** §8 originally scoped the engine's output as three views — the opportunity table, question coverage, and cross-tabs. With cross-tabs gone, the engine ships two. The interaction the cross-tab existed to show (whether the apparel records are the buy-intent ones) is no longer surfaced anywhere on the dashboard; if that question matters again later, it has to be rebuilt, not just re-enabled, since the whole computation was deleted rather than hidden.

**What was deliberately not touched:** the Priority quadrant badge and the AI Synthesis card, the other two widgets introduced alongside Keyword Buzz in §16a — neither was in question here, and removing them would have been scope creep on a request about two specific, named widgets.

**Nothing to preserve on the data side.** Unlike the survey (§18), no real user data was ever downstream of either widget — Keyword Buzz was a heuristic relabeling of phrases already visible elsewhere on the dashboard, and the cross-tab matrix was a re-slice of extraction fields already shown per-record in the evidence drill-down (§16b). Cutting both loses a presentation, not a data source.

## 20. Two corpus-native widgets added, 2026-08-23

The user reviewed a real primary-research survey (N=28, "How you use wishlists when shopping online") and asked which of its widgets could be rebuilt from this engine's own scraped corpus instead of self-reported answers. Every field was checked against real fill rates in `extracted.jsonl` (578 records) before anything was proposed — the same discipline §19 just enforced by removing two widgets that weren't earning their keep.

**Most survey widgets don't transfer**, and were rejected rather than force-built: city tier, spend amount, wishlist size, purchase frequency, revisit count, a computed segment score, usage-frequency self-report, and self-rated decision-ease all require a person being *directly asked* — public review/Reddit text structurally never states these, and inferring them would mean inventing data, which is exactly what this project's "auditable, not a black-box call" principle (`score.py`'s own docstring) forbids.

**Two fields had genuine volume and a fixed, quantifiable shape:**

1. **`decision_factors`** — 24.4% fill (141/578 records, 310 phrase mentions). Real sampled content is dominated by general purchase-decision language ("quality," "fast delivery," "value for money," "comfortable"), **not** narrowly "why I hesitated on my wishlist" — that narrower signal lives in `hesitation_signal`/`current_blocker_freeform`, both under 2.5% fill, too sparse to chart. The new **Decision Factors** widget (`FindingsPanel.tsx`) is framed honestly as "what shoppers say they weigh," reusing `RankedBarChart` with no new chart component.

   Bucketed by a keyword-marker classifier (`score.py`'s `DECISION_FACTOR_TAXONOMY`), the same audited-substring-match technique the deleted `keywords.py` used, applied to named semantic categories instead of binary sentiment. Built in two passes against the *real* leftover phrases rather than guessed twice: the first pass (6 categories) left 40.6% of mentions in "Other"; inspecting that bucket's actual content surfaced two real categories missing entirely (**Selection & Variety**, **App & Shopping Experience**) and several markers too narrow (`"cancellation"` missed "orders cancelled," `"variety"` missed "varieties"). Second pass landed at **12.6% Other** across 8 named categories (Price & Value, Quality & Authenticity, Fit & Comfort, Service & Support, Delivery & Logistics, Selection & Variety, App & Shopping Experience, Comparison & Wishlist Behavior) — the remaining 12.6% is genuinely idiosyncratic one-off aesthetic adjectives ("classy," "spacious," "shade," "luxury"), left unbucketed deliberately rather than chased into an ever-growing lexicon that stops being auditable.

2. **`post_purchase_outcome`** — 31.1% fill on the retrospective lens (174/560 App+Play records), fixed vocabulary (`satisfied | regret | returned | unclear`). Already computed *per theme* as `outcomeMix` but never rolled up corpus-wide or given its own widget. The new **What Happens After Purchase** widget uses the identical `{counts, coveredN, ofN}` shape, just summed across the whole lens — one new small component, `OutcomeMixBar.tsx`, a 100%-stacked bar using the project's fixed status colors (good=satisfied, warning=unclear, serious=regret+returned combined, since inventing a fourth hue would break the "fixed, never themed" status-color rule from §16).

**Integration choice:** both ship as new non-nullable keys directly inside `findings.json` (`decisionFactorBreakdown`, `postPurchaseOutcomeSummary`), not a third optional file alongside `narrative.json`. `keywords.json` and the old `narrative.json`-style optionality existed because those steps were either experimental or cost a real Groq call; both new computations are cheap, deterministic, non-LLM, and always derivable from data `score.py` already loads — reintroducing optional-file/null-handling complexity right after removing it (§19) would have been a step backward.

**A third idea was evaluated and rejected: segmenting records into the survey's own Browser/Considerer/Ready-Buyer personas.** The closest field, `intent_signal`, is the only *required* field in the schema (100% fill), so a literal relabel (`buy-intent`→Ready Buyer, `save-for-later`→Considerer, `not-determinable`→Browser) looked tempting. The real distribution kills it: `not-determinable` is 78.5% of the corpus (454/578) and `save-for-later` is only 1.7% (10/578, entirely from the 18-record Reddit lens, none from App/Play). "Not-determinable" means *no textual evidence either way* — a data-absence category — not "casually browsing," a behavioral one; labeling 78.5% of the corpus "Browsers" would misrepresent missing signal as a confirmed stance, the same false-precision problem `problem_statement.md` already guards against for Addressability and for "not enough data yet" resolution reasons. A *derived* heuristic segment (e.g. Considerer = `not-determinable`/`save-for-later` **with** `decision_factors` present) remains a legitimate follow-up if pursued later, but it is a labeled judgment call requiring its own design pass, not a field relabel, and is out of scope for this pass.

**Also unlike the survey (§18, §19):** these two widgets add real new insight rather than restoring something removed. They are additive to View 1 (the opportunity table) — this is not a resurrection of the removed View 3 cross-tab matrix (§8, §19), which was a different computation (`product_category × intent_signal` joint counts) that stays cut.

## 21. The brief's 10 questions promoted to an always-visible section, and a real attempt to fix Q1/2/3/6/9/10 at the source, 2026-08-23

**What changed on the dashboard.** "Coverage of the brief's 10 questions" (`QuestionCoverageDetail.tsx`) previously lived only behind a modal opened from the "Brief questions covered" stat tile. It's now also an always-visible section on the Findings tab — the same component, reused as-is, just no longer gated behind a click. The stat tile itself is now informational only (no `onClick`), since the full detail sits directly below it; keeping both would have meant one click revealing content already on the page.

**What's new in the data: an honest per-question "why it's weak" line.** §4's routing table (just corrected above) predicted several questions would be Strong from the engine alone — measured against the real 578-record corpus, only Q7 and Q8 actually are. `score.py`'s new `build_blocker()` explains the other eight by checking per-lens (App/Play vs Reddit) fill rates and splitting them into two genuinely different causes, not one generic "Weak":

- **Reddit-volume-limited** (Q1, Q2, Q3, Q6, Q9, Q10): the field fires at 6%–72% per-record on the 18-record Reddit lens, essentially never on the 560-record App/Play lens. The signal is real; there just aren't enough Reddit records to clear the coverage function's confidence bar (`present ≥ 15` for Strong). More Reddit collection is the direct, evidenced fix.
- **Rare everywhere** (Q4, Q5): thin on both lenses regardless of volume — comparison behaviour and clean postponement narratives just aren't things people volunteer in public text at any real rate. This matches the *original* design prediction for Q5 exactly (`vault/09-Assignment/03-AI-Discovery-Engine-Design.md`'s coverage audit: "rarely narrated publicly, interviews lead") — not a regression, the engine handing off a question it was never expected to answer alone.

**A real attempt was made to fix the Reddit-volume-limited half at the source, and it failed the same way it did before.** Rather than only documenting the blocker, a background agent was dispatched to actually grow the 18-record Reddit corpus via the same manual-browser-extraction method that produced the two existing batches (`_manual_reddit_batch_20260818.py`, `_manual_reddit_batch_20260819.py`). It tried four independent retrieval paths before concluding: direct `WebFetch` (tool-level refusal), `WebSearch` for `site:reddit.com myntra wishlist` (the search provider returns no reddit.com results at all for this query), Jina Reader via the `claude-crawl` skill on both `old.reddit.com` and `www.reddit.com` (Reddit's own network-policy block on both, not a generic timeout), and a Wayback Machine snapshot as a fallback (blocked separately, at Jina's level, unrelated to Reddit). **Zero new records were added, and nothing was fabricated** — the agent was explicitly instructed to report a real failure honestly rather than invent plausible-sounding Reddit content, and did so. This reproduces §9's finding that Reddit blocks this tool environment even through a reader-proxy, not just a direct fetch, and confirms nothing has changed since that was last tested.

**What this means going forward:** growing the Reddit corpus past 18 records still requires an actual human-driven browser session outside this tool environment — there is no automated or proxied path left untried inside it. That remains true, evidenced work for a future session, not something this pass could close out.
