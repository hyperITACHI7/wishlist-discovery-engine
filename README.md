# Wishlist Discovery Engine

AI discovery engine for the Myntra wishlist → purchase conversion grad-project brief. Start with [`problem_statement.md`](problem_statement.md) — it's the single source of truth for what this is, why, and every locked design decision.

## Layout

```
problem_statement.md   What/why/requirements/decisions — read this first
interview_guide.md      Gap analysis of the engine's own question-coverage output + the 5-6 primary-research interview questions it implies
web/                    Next.js dashboard (Myntra-styled) — Panel A/B/C/D live tool (A/D/Interviews as tabs, B/C as on-demand modals)
pipeline/               Python collection + extraction scripts (Reddit / App / Play Store, Groq)
```

## Day 1 status (see `../vault/09-Assignment/04-Execution-Timeline.md`)

- [x] Tech stack decided, hosting skeleton built and verified locally (`web/`)
- [x] Source collection + classification pipeline stood up (`pipeline/`)
- [x] Play Store collector validated live against the real app (`com.myntra.android`) — 200 real reviews already sitting in `pipeline/data/raw/playstore.jsonl`
- [x] App Store collector validated live against the real app (`myntra-fashion-shopping-app`, id `907394059`) — rewritten to hit Apple's RSS review feed directly after the `app-store-scraper` package failed on every request; real reviews sitting in `pipeline/data/raw/appstore.jsonl`. Apple caps this feed at 500 reviews (10 pages × 50), confirmed live.
- [x] **Deployed (2026-08-20)** — public repo at <https://github.com/hyperITACHI7/wishlist-discovery-engine>, deploying to Vercel with the findings page **statically prerendered** so there's no cold start (only the assistant and extractor are functions). Required restructuring how findings load: they're now bundled at build time via `web/scripts/sync-findings.mjs` instead of read off disk per request — which was both forcing dynamic rendering *and* would have silently served mock data in production, since hosts deploy only `web/` and `pipeline/data/` is gitignored. See "Deploying" below and `problem_statement.md` §17.
- [x] Reddit collector no longer needs credentials — switched to Reddit's unauthenticated `.json` endpoints after Reddit stopped issuing free OAuth script-app access (see `problem_statement.md` §9)
- [x] That fallback is also blocked from this network (confirmed live, `403`) — worked around via a human-driven Chrome browsing session instead. **10 real structured extraction records** from 3 relevant Reddit threads are already in `pipeline/data/extracted/extracted.jsonl` (see `pipeline/collectors/_manual_reddit_batch_20260818.py` for provenance and reasoning)
- [x] `GROQ_API_KEY` set and verified working end to end (pipeline script, `/api/extract` route, and live Panel B UI all confirmed) — models are `openai/gpt-oss-20b` (fast) / `openai/gpt-oss-120b` (large); Groq's catalog has turned over before, re-check `GET /openai/v1/models` if extraction starts failing
- [x] **YouTube dropped as a source (2026-08-19)** — no videos could be found with both meaningful comment volume and decision-relevant discussion about Myntra/online fashion shopping. It was always scoped as minor/supplementary, never a pillar, so the two-lens design still holds on Reddit + Play/App Store — see `problem_statement.md` §9
- [x] **Full pipeline run end to end on real data (2026-08-19)** — dedupe, synthesis, and cross-tab/Opportunity-Score computation (steps 5-7, previously unbuilt) are now built, tested, and producing real output, wired into and verified live on the dashboard (`pipeline/data/extracted/findings.json` → `web/src/lib/loadFindings.ts`). Batch extraction against the full corpus (720 items: 200 Play Store + 500 App Store + 10 manual Reddit) is ongoing in the background as of this writing — check `(Get-Content pipeline\data\extracted\extracted.jsonl | Measure-Object -Line).Lines` for the current real count, then re-run `dedupe` → `synthesize` → `score` to refresh `findings.json` with the latest. The real constraint turned out to be Groq's **200,000-tokens-per-day (TPD)** quota per API key/org — not a per-minute limit as first suspected — so completing the full corpus spans multiple daily resets or multiple keys from separate accounts. Two real bugs found and fixed along the way: an uncaught network timeout that could crash an entire batch run, and a synthesis-prompt size limit (empirically capped at 60 phrases). Full detail: `problem_statement.md` §10.
- [x] **Survey source removed entirely (2026-08-20)** — the Google Forms survey, its collector, its segment computation, its dashboard tab, its types and its config are all gone. Q9 (segment differences) routes to the interviews alone again, matching the original `problem_statement.md` §4 routing table. `SURVEY_FORM_ID` / `SURVEY_SHEET_ID` are no longer read, so those `.env` lines can be deleted. The two collected responses still sit in the corpus backup repo — nothing deleted them, they're just not wired into anything. Rationale: `problem_statement.md` §18. **This supersedes the survey entry below**, which is kept as a record of what was built.
- [x] ~~**Google Forms survey integrated as structured segment data, real responses (2026-08-19)**~~ *(superseded — removed 2026-08-20, see above)* — pulls the demographic survey via unauthenticated CSV export of the linked response Sheet (`pipeline/collectors/survey_collect_csv.py`) and computes segment-composition cross-tabs (`pipeline/extraction/survey_segments.py`), rendered live on dashboard **Panel D** with **2 real responses** as of this writing. An OAuth-based approach was tried first and abandoned after real setup friction (wrong Google Cloud client type, then an unverified-app block) — see `problem_statement.md` §15 for the full story, including two real bugs fixed (a UTF-8 mis-decode that mangled ₹/→/– characters, and a checkbox multi-select field that can't be safely comma-split). The form grew from 6 multiple-choice questions to 19 (including real open-text ones) after this integration started — those open-text answers are captured but not yet wired into the theme/extraction pipeline, a deliberate follow-up decision, not an oversight. Structured segment data is still never cross-tabbed against review/Reddit themes (different, unlinked, anonymous populations).
- [x] **Dashboard redesigned around visual widgets, tabs restructured (2026-08-19)** — replaced table-heavy views with chart primitives built per the `dataviz` skill's method (ranked bar chart with click-to-select evidence drawer, diverging bar chart, status pills + confidence ring, stacked cross-tab bars, stat tiles, a persistent source-composition ribbon). Tab bar now holds only the three browsable views (Findings, Survey segments, Interviews); the live extractor and Limitations moved to on-demand modals since neither is a "view of the data." Added a cross-panel jump (question-coverage row 9 → Survey tab, scroll + highlight) that surfaces related context without cross-tabbing the underlying datasets. Full rationale and new color-token decisions: `problem_statement.md` §16. Verified live in-browser: every tab, chart interaction, and modal open/close (click, Escape, backdrop) with zero console errors.
- [x] **Psychology research wired into the dashboard and the assistant (2026-08-20)** — the 14-question desk research from `vault/09-Assignment/10-Psychology-Research.md` now has its own **Research findings** tab (next to Interviews) with each question's findings, named mechanisms, headline statistics, implications and sources (academic vs industry, all linked), and it's part of the chatbot's grounding context so it can answer research questions and cite them. Structured once in `web/src/lib/psychologyResearch.ts` so the tab and the chatbot can't drift apart. The hard boundary — desk research is *external literature*, never this engine's own corpus findings, and the two are never pooled — is enforced in the tab banner, in a per-question "how this engine's own corpus compares" block, and in the assistant's system prompt. Several of those comparison blocks are genuinely informative: the literature says webrooming is near-universal at 81% while the engine caught it in 3/578 records, which is strong evidence that's a text-availability problem rather than a behaviour-rarity one. Full rationale: `problem_statement.md` §16c.
- [x] **Drill-down overhaul — every summary number is now a door (2026-08-20)** — the four headline stat cards are clickable into full views (all opportunities with size/criticality/volume/confidence; the top opportunity broken down by outcome and intent with its observed resolution paths; all 10 brief questions with the actual phrases found for each; every stated workaround). Clicking a ranked theme opens every review and Reddit post behind it — filterable by lens, each linked to its source — with the engine's interpretation *below* the evidence, not above it. Added a pipeline funnel showing volume at all 6 gates with each drop's reason. Replaced the two per-theme cross-tab bar charts with a single joint `product_category × intent_signal` heatmap: they had been the two marginals of one table, which is why they looked like two charts of the same thing and why neither could show the interaction. Added a grounded assistant (`/api/chat`) that answers only from computed findings and refuses to invent numbers. Moved "How it works" to its own tab. Backing data (per-theme evidence records, confidence profiles, workarounds, outcome/intent mixes, per-question insights, funnel) is all new output from `pipeline/extraction/score.py`. Full rationale: `problem_statement.md` §16b.
- [x] **Four more widgets, adapted from a public reference dashboard (2026-08-20)** — a priority quadrant badge (Frequency x Intent Quality, not Severity x Volume — severity is flat at this corpus size), a keyword-marker Frustrations/Praise cloud (`pipeline/extraction/keywords.py`, a visible lexicon heuristic, not a trained sentiment model), a "Viewing: X ✕" selection chip on the evidence drawer, and a baked-once AI Synthesis narrative card (`pipeline/extraction/narrate.py`, one Groq call at pipeline time). Caught and fixed a real bug before shipping: the first narrative prompt didn't know about the "no monetary incentives" constraint and recommended a price/discount lever — the prompt now states that constraint explicitly. Full rationale, including which of the reference repo's patterns didn't transfer and why: `problem_statement.md` §16a.

## Running the dashboard locally

```bash
cd web
npm install   # already done if you're continuing this session
npm run dev
```

Opens at http://localhost:3000. Panel B (live extractor) and the findings assistant (`/api/chat`) are both live and verified working — `web/.env.local` already has a working `GROQ_API_KEY`. Both call Groq at request time, so both go quiet when the daily token quota is exhausted (they say so plainly rather than failing silently); everything else on the dashboard is precomputed and unaffected. If you see stub-mode output instead of a real extraction, check that key is still present and that its models are still enabled at console.groq.com/settings/project/limits.

## Running the pipeline

See [`pipeline/README.md`](pipeline/README.md) for full setup. Short version:

```bash
cd pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # pipeline/.env already has a working Groq key; Reddit and YouTube both need none (YouTube dropped, see problem_statement.md §9)
python run_pipeline.py collect-all
python run_pipeline.py pilot --n 50
python run_pipeline.py batch-extract
python -m extraction.dedupe
python -m extraction.synthesize
python -m extraction.score      # writes findings.json, which the dashboard reads
python -m extraction.keywords   # optional: Keyword Buzz widget
python -m extraction.narrate    # optional: AI Synthesis card (one Groq call)
```

## Deploying (Vercel)

Repo: <https://github.com/hyperITACHI7/wishlist-discovery-engine>

**The findings page is statically prerendered**, so it serves as HTML from the CDN with no serverless invocation and therefore no cold start. Only `/api/chat` and `/api/extract` are functions, and they're only hit when someone actually uses the assistant or the extractor.

That works because the pipeline's JSON output is bundled into the build rather than read off disk at runtime. `web/scripts/sync-findings.mjs` copies `pipeline/data/extracted/*.json` into `web/src/data/`, and runs automatically before every `npm run build` and `npm run dev`. On a host, where `pipeline/data/` doesn't exist (it's gitignored), the script falls back to the committed copies in `web/src/data/` — that's the intended path, not a failure.

### First-time import

1. <https://vercel.com/new> → **Import** `hyperITACHI7/wishlist-discovery-engine`
2. **Root Directory: `web`** ← the one setting that matters; the Next.js app is not at the repo root
3. Framework preset should auto-detect as **Next.js**; leave build/output settings alone
4. **Environment Variables** → add `GROQ_API_KEY` (get one at <https://console.groq.com/keys>). Without it the dashboard still works fully — every finding is precomputed — but the assistant and the live extractor report themselves as offline rather than failing silently.
5. Deploy

### Updating the deployed data after a new corpus run

```bash
cd pipeline && python -m extraction.score && python -m extraction.keywords && python -m extraction.narrate
cd ../web && npm run sync-data
git add web/src/data && git commit -m "Refresh findings" && git push
```

Vercel redeploys on push. `npm run sync-data` is the step that moves fresh pipeline output into the bundle — skipping it means the site keeps serving the previous run's numbers.
