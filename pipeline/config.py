"""Shared config for the collection + extraction pipeline.

See ../problem_statement.md Â§9-10 for the design rationale behind every
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
# No Reddit client id/secret here on purpose â€” Reddit no longer reliably
# issues free OAuth "script" app credentials for a student/non-commercial
# account, so reddit_collect.py uses Reddit's public, unauthenticated .json
# endpoints instead of PRAW. See problem_statement.md Â§9 for the full note.
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "discovery-engine-myntra-research/0.1 (student grad project)")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def _load_groq_keys() -> list[str]:
    """All available Groq keys, in rotation order (problem_statement.md §23).

    The binding constraint on this project is Groq's 200,000-tokens-per-DAY
    quota, not a per-minute limit — a full corpus run exhausts one key's
    daily budget after roughly 200-350 extractions and then sits in an
    escalating penalty state (retry-after values climbing past 2000s) making
    effectively zero progress. Rotating to a fresh key at that point is the
    difference between finishing a run today and waiting for a daily reset.

    IMPORTANT: keys from the SAME Groq account/org share one TPD pool, so a
    second key generated inside the same account buys nothing. Additional
    keys must come from separate accounts to actually add budget.

    Accepts either a comma-separated GROQ_API_KEYS, or numbered
    GROQ_API_KEY_2 / _3 / ... alongside the original GROQ_API_KEY. Duplicates
    and blanks are dropped, order preserved.
    """
    keys: list[str] = []
    if GROQ_API_KEY:
        keys.append(GROQ_API_KEY.strip())
    for raw in (os.getenv("GROQ_API_KEYS") or "").split(","):
        if raw.strip():
            keys.append(raw.strip())
    for n in range(2, 11):
        val = os.getenv(f"GROQ_API_KEY_{n}")
        if val and val.strip():
            keys.append(val.strip())
    seen: set[str] = set()
    return [k for k in keys if not (k in seen or seen.add(k))]


GROQ_API_KEYS = _load_groq_keys()

# A 429 whose retry-after exceeds this is treated as "this key's daily
# budget is gone", not "slow down" — the trigger to rotate keys. Per-minute
# throttling returns single/double-digit seconds; TPD exhaustion returned
# 1439s, 2054s and 2073s in the 2026-08-23 run.
GROQ_TPD_RETRY_AFTER_THRESHOLD_SECONDS = 120.0

# --- Model tiering (problem_statement.md Â§10) ---
# Groq's catalog turns over â€” the original llama-3.1-8b-instant /
# llama-3.3-70b-versatile picks were both fully retired (404, not just
# deprecated) as of 2026-08-18. Re-check `GET /openai/v1/models` with your
# key before assuming these are still current, and note your Groq project
# must have each model explicitly enabled at
# https://console.groq.com/settings/project/limits â€” a 403
# "blocked at the project level" means the key is fine, the project isn't.
#
# Fast/smaller model for high-volume per-item extraction.
GROQ_MODEL_EXTRACTION = "openai/gpt-oss-20b"
# Larger model reserved for the one-time synthesis call (and the live demo box).
GROQ_MODEL_SYNTHESIS = "openai/gpt-oss-120b"
# Confirmed 2026-08-19: this Groq free-tier project rate-limits hard â€”
# a 50-item pilot with no proactive delay lost 34% of items even after
# retries with backoff. Initially misdiagnosed as an 8000-tokens/minute
# (TPM) constraint based on the response headers â€” the real binding limit,
# confirmed from an actual 429 error body, is 200,000 TOKENS PER DAY (TPD)
# for openai/gpt-oss-20b specifically (a separate quota Groq doesn't
# expose in headers, only in the 429 body message). The escalating waits
# we saw (378s -> 496s -> 454s -> 2037s) were the countdown to that day's
# fixed daily reset getting closer each time, not a worsening penalty.
# Per-minute (TPM) headroom is fine throughout â€” this delay mainly matters
# for being a good citizen, not for dodging TPD (spacing calls out doesn't
# change total tokens spent per day). At today's real usage rate, ~165
# extractions consumed most of a 200k daily budget, so completing the full
# remaining corpus (545 items) will likely span multiple daily resets, not
# one sitting â€” set expectations accordingly rather than assuming one
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
# this caps request volume against the unauthenticated endpoint â€” pull
# comments for only the top N posts per term, not all of them.
REDDIT_MAX_POSTS_FOR_COMMENTS_PER_TERM = 15
REDDIT_REQUEST_DELAY_SECONDS = 2.0

# --- App / Play Store collection scope ---
# Verify these before running â€” package/app IDs occasionally change and a
# wrong ID silently pulls the wrong app's reviews.
PLAYSTORE_APP_ID = "com.myntra.android"  # verify at play.google.com listing URL
PLAYSTORE_MAX_REVIEWS = 2000
PLAYSTORE_COUNTRY = "in"
PLAYSTORE_LANG = "en"

# Critical-review top-up (collectors.playstore_collect.collect_critical,
# problem_statement.md §22). 3-star is included deliberately: spot-checking
# the live feed showed 3-star reviews carry some of the most specific
# friction narratives ("for two consecutive orders they delivered wrong
# size"), because a mixed experience gets explained where a 1-star rant
# often just vents. Per-score cap keeps one rating band from dominating.
PLAYSTORE_CRITICAL_SCORES = (1, 2, 3)
PLAYSTORE_CRITICAL_PER_SCORE = 200

# Confirmed 2026-08-19 from https://apps.apple.com/in/app/myntra-fashion-shopping-app/id907394059
APPSTORE_APP_ID: int | None = 907394059
APPSTORE_APP_NAME = "myntra-fashion-shopping-app"
APPSTORE_COUNTRY = "in"
APPSTORE_MAX_REVIEWS = 2000

