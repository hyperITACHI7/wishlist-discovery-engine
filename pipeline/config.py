"""Shared config for the collection + extraction pipeline.

See ../problem_statement.md §9-10 for the design rationale behind every
choice here (source selection, budget allocation, model tiering).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PILOT_DIR = DATA_DIR / "pilot"
EXTRACTED_DIR = DATA_DIR / "extracted"

for d in (RAW_DIR, PILOT_DIR, EXTRACTED_DIR):
    d.mkdir(parents=True, exist_ok=True)

# --- Credentials ---
# No Reddit client id/secret here on purpose — Reddit no longer reliably
# issues free OAuth "script" app credentials for a student/non-commercial
# account, so reddit_collect.py uses Reddit's public, unauthenticated .json
# endpoints instead of PRAW. See problem_statement.md §9 for the full note.
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "discovery-engine-myntra-research/0.1 (student grad project)")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# --- Model tiering (problem_statement.md §10) ---
# Groq's catalog turns over — the original llama-3.1-8b-instant /
# llama-3.3-70b-versatile picks were both fully retired (404, not just
# deprecated) as of 2026-08-18. Re-check `GET /openai/v1/models` with your
# key before assuming these are still current, and note your Groq project
# must have each model explicitly enabled at
# https://console.groq.com/settings/project/limits — a 403
# "blocked at the project level" means the key is fine, the project isn't.
#
# Fast/smaller model for high-volume per-item extraction.
GROQ_MODEL_EXTRACTION = "openai/gpt-oss-20b"
# Larger model reserved for the one-time synthesis call (and the live demo box).
GROQ_MODEL_SYNTHESIS = "openai/gpt-oss-120b"
# Confirmed 2026-08-19: this Groq free-tier project rate-limits hard —
# a 50-item pilot with no proactive delay lost 34% of items even after
# retries with backoff. Initially misdiagnosed as an 8000-tokens/minute
# (TPM) constraint based on the response headers — the real binding limit,
# confirmed from an actual 429 error body, is 200,000 TOKENS PER DAY (TPD)
# for openai/gpt-oss-20b specifically (a separate quota Groq doesn't
# expose in headers, only in the 429 body message). The escalating waits
# we saw (378s -> 496s -> 454s -> 2037s) were the countdown to that day's
# fixed daily reset getting closer each time, not a worsening penalty.
# Per-minute (TPM) headroom is fine throughout — this delay mainly matters
# for being a good citizen, not for dodging TPD (spacing calls out doesn't
# change total tokens spent per day). At today's real usage rate, ~165
# extractions consumed most of a 200k daily budget, so completing the full
# remaining corpus (545 items) will likely span multiple daily resets, not
# one sitting — set expectations accordingly rather than assuming one
# unattended run finishes everything.
GROQ_REQUEST_DELAY_SECONDS = 8.0

# --- Reddit collection scope ---
# Subreddits where Indian fashion-ecommerce discussion plausibly surfaces.
REDDIT_SUBREDDITS = [
    "IndianFashionAddicts",
    "india",
    "IndianStreetwear",
    "IndianSkincareAddicts",
    "developersIndia",  # occasional consumer-app gripe threads; low yield, kept cheap to check
]
REDDIT_SEARCH_TERMS = [
    "myntra wishlist",
    "myntra return",
    "myntra size",
    "myntra fit",
    "myntra vs ajio",
    "myntra review",
]
REDDIT_MAX_ITEMS_PER_TERM = 100
# Comment threads are fetched per-post on top of the search call itself, so
# this caps request volume against the unauthenticated endpoint — pull
# comments for only the top N posts per term, not all of them.
REDDIT_MAX_POSTS_FOR_COMMENTS_PER_TERM = 15
REDDIT_REQUEST_DELAY_SECONDS = 2.0

# --- App / Play Store collection scope ---
# Verify these before running — package/app IDs occasionally change and a
# wrong ID silently pulls the wrong app's reviews.
PLAYSTORE_APP_ID = "com.myntra.android"  # verify at play.google.com listing URL
PLAYSTORE_MAX_REVIEWS = 2000
PLAYSTORE_COUNTRY = "in"
PLAYSTORE_LANG = "en"

# Confirmed 2026-08-19 from https://apps.apple.com/in/app/myntra-fashion-shopping-app/id907394059
APPSTORE_APP_ID: int | None = 907394059
APPSTORE_APP_NAME = "myntra-fashion-shopping-app"
APPSTORE_COUNTRY = "in"
APPSTORE_MAX_REVIEWS = 2000

# --- Survey (Google Forms) ---
# "About you and how you shop." Originally 6 multiple-choice-only questions
# with zero open text (confirmed 2026-08-19) — since expanded by the form
# owner to 19 questions including 3 real open-text ones (save_motivation,
# current_blocker_freeform, a "one minute complaint" field). See
# problem_statement.md §15 for the full history and design decisions.
#
# Active collection path: collectors/survey_collect_csv.py — plain
# unauthenticated GET against the linked response Sheet's CSV export.
# Chosen over the Google Forms OAuth API (collectors/survey_collect.py,
# kept for reference but NOT the active path) after repeated Google Cloud
# Console friction (wrong OAuth client type, then unverified-app blocking)
# made OAuth setup cost more than this survey's non-sensitive demographic
# data warranted. Tradeoff: the response Sheet must be shared "Anyone with
# the link -> Viewer," so response data is link-accessible, not private.
#
# Structured fields still get their own segment-composition cross-tabs
# (extraction/survey_segments.py) — never joined to review/Reddit theme
# data, since respondents and reviewers are different, unlinked, anonymous
# populations and a joint cross-tab would be a false link, not a finding.
# The new open-text fields are a separate, later decision — see §15.
# OAuth path (Google Forms API) was tried first and abandoned — real
# Google Cloud Console friction (wrong client type, then unverified-app
# blocking) cost more setup effort than this survey's non-sensitive
# demographic data warranted. No config left for it; the CSV path below
# needs nothing but a shared Sheet.
#
# Moved out of source and into .env 2026-08-20, when this repo was made
# public. The response Sheet is shared "Anyone with the link -> Viewer", so
# the id IS the access credential — committing it publicly would hand every
# reader of this repo the raw survey responses, including the free-text
# answers. Respondents agreed to share those with the researcher, not with
# the internet. Put the real ids in pipeline/.env (gitignored); collectors
# fail loudly with setup instructions if they're missing.
SURVEY_FORM_ID = os.getenv("SURVEY_FORM_ID", "")
# From the response Sheet's URL: docs.google.com/spreadsheets/d/<ID>/edit
SURVEY_SHEET_ID = os.getenv("SURVEY_SHEET_ID", "")
