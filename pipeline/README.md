# Collection + extraction pipeline

Implements `problem_statement.md` §9-10. Standalone Python, runnable without n8n (see `run_pipeline.py` docstring for why).

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env        # then fill in credentials
```

Credentials needed:
- **Groq** — free key at https://console.groq.com/keys

Play Store, App Store, and **Reddit** collectors need no credentials. Reddit no longer reliably issues free OAuth "script" app credentials for a student/non-commercial account, so `reddit_collect.py` uses Reddit's public unauthenticated `.json` endpoints instead of PRAW — see `problem_statement.md` §9 and the module docstring in `collectors/reddit_collect.py` for the reasoning, rate-limiting behaviour, and fallback options if Reddit blocks it from your network.

**YouTube was dropped as a source (2026-08-19)** — no videos could be found with both meaningful comment volume and decision-relevant discussion about Myntra/online fashion shopping. It was already scoped as minor/supplementary, never a pillar, so this doesn't gut the design; see `problem_statement.md` §9.

## Before you run anything

Nothing — both `config.PLAYSTORE_APP_ID` (`com.myntra.android`) and `config.APPSTORE_APP_ID` (`907394059`, confirmed 2026-08-19) are live-verified and set. `appstore_collect.py` hits Apple's public RSS review feed directly (not the unmaintained `app-store-scraper` package, which returned JSON-decode errors on every request against the real app id) — capped at Apple's own 500-review feed limit (10 pages × 50), confirmed live.

## Run order

```bash
python run_pipeline.py collect-all       # or collect-reddit / collect-playstore / collect-appstore individually
python run_pipeline.py pilot --n 50      # measure per-field null rates BEFORE paying for the full batch
# review the null-rate report; rewrite/drop any field >95% empty in extraction/prompts.py
python run_pipeline.py batch-extract     # full corpus, resumable (skips already-extracted source_urls)
python -m extraction.dedupe              # step 5: flatten + count extracted phrases (plain code, no LLM)
python -m extraction.synthesize          # step 6: one Groq call, names themes + maps to the 7 factors
python -m extraction.score               # step 7: cross-tabs + Opportunity Score -> data/extracted/findings.json
python -m extraction.keywords            # step 7b (optional): keyword-marker lexicon -> data/extracted/keywords.json, Keyword Buzz widget
python -m extraction.narrate             # step 8 (optional): one short Groq call -> data/extracted/narrative.json, AI Synthesis card
```

`findings.json` is what `../web/` reads (via `web/src/lib/loadFindings.ts`) to render Panel A with real data instead of mock data — regenerate it any time by re-running the commands above (dedupe/synthesize/score/keywords are cheap and plain code except synthesize; only batch-extract and narrate call Groq at real cost, and narrate is a single small call, not a batch). `keywords.json` and `narrative.json` are both optional — if either is missing, the dashboard just doesn't render that widget rather than erroring (same honest-fallback pattern as everything else here). `narrate.py` must run AFTER `score.py`, not before — it summarizes the already-ranked findings, not raw themes, and its prompt explicitly tells the model about the no-monetary-incentives constraint so it never recommends the one thing this project can't ship (a first draft did, before that line was added — see the module docstring).

**Groq rate limits, read before running batch-extract on more than ~50-100 items:** the real binding constraint is **200,000 tokens PER DAY (TPD)** for the extraction model, not a per-minute limit — confirmed from an actual 429 error body (`"tokens per day (TPD): Limit 200000, Used 198731..."`), not the response headers (which only expose a separate, usually-healthy per-minute bucket and don't mention TPD at all). `config.GROQ_REQUEST_DELAY_SECONDS` (currently 8.0) is about being a good citizen, not about avoiding TPD — spacing calls out doesn't reduce total tokens spent per day. At real usage rates, one API key's daily budget covers roughly 200-350 successful extractions before hitting the wall; completing hundreds of items will span multiple daily resets (or multiple API keys from separate Groq accounts/orgs — same-org keys share the same TPD pool). If you hit it: `batch-extract` is resumable (already-extracted `source_url`s are skipped), so just wait for reset or swap `GROQ_API_KEY` in `.env` and re-run. `extraction.synthesize` also has a tested hard cap (`MAX_PHRASES_IN_PROMPT = 60`) — the call reliably fails above ~60-80 phrases in one prompt (`json_validate_failed`, empirically bisected 2026-08-19); above that, it automatically keeps only the highest-count phrases.

## Survey (Google Forms) — separate from the review/Reddit pipeline

Structured multiple-choice questions get their own segment cross-tabs, not the LLM extraction pipeline. The form has since grown to include a few real open-text questions too — those are captured in the raw data but not yet wired into anything (a deliberate, not-yet-made design decision — see `problem_statement.md` §15). Full history and rationale there.

**Setup: share the response Sheet, no credentials needed.**
1. Open the form → **Responses** tab → click the green Sheets icon to create/open the linked spreadsheet
2. In that Sheet: **Share** → change access to **"Anyone with the link" → Viewer**
3. Put that Sheet's id (from `docs.google.com/spreadsheets/d/<ID>/edit`) in `pipeline/.env` as `SURVEY_SHEET_ID=<id>`, not in `config.py`. Because the Sheet is shared link-readable, **the id is effectively the access credential** — anyone who has it can read every response. It stays out of source so a public repo can't leak respondents' answers.

(An OAuth-based approach was tried first and abandoned after real Google Cloud Console friction — wrong client type, then an unverified-app block. See `problem_statement.md` §15 if you want the OAuth path back for a survey with sensitive data, where the Sheet-sharing tradeoff wouldn't be acceptable.)

```bash
python run_pipeline.py collect-survey    # plain HTTP GET, no auth, no browser
python run_pipeline.py survey-segments   # -> data/extracted/survey_findings.json, renders as dashboard Panel D
```

`collect-survey` is deliberately excluded from `collect-all` — it's a separate source with its own setup step (the Sheet must be shared), not something that should silently no-op inside an unattended batch run.

## Data layout

```
data/
  raw/            # one JSONL per source, deduped by source_url on append
    reddit.jsonl
    playstore.jsonl
    appstore.jsonl
    survey_responses.jsonl   # from collect-survey — structured, not text
  pilot/
    pilot_output.jsonl
  extracted/
    extracted.jsonl    # every structured extraction (manual Reddit + batch Play/App Store)
    phrases.json        # step 5 output: deduped, frequency-counted freeform phrases
    themes.json          # step 6 output: named opportunity themes + factor mapping
    findings.json        # step 7 output: the dashboard views, real numbers. Also carries
                         #   per-theme evidence records (every source review/post behind a
                         #   theme), confidence profiles, distinct workarounds, outcome/intent
                         #   mixes, per-question insight phrases, the joint cross-tab matrices,
                         #   and the pipeline funnel — all added 2026-08-20 for the dashboard's
                         #   drill-down views (problem_statement.md §16b)
    keywords.json         # step 7b output (optional): Keyword Buzz widget, plain code
    narrative.json        # step 8 output (optional): AI Synthesis card, one Groq call
    survey_findings.json  # from survey-segments — Panel D, kept separate from findings.json on purpose
```

`data/` is gitignored — it's corpus output, not source.
