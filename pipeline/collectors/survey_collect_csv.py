"""Google Sheets CSV-export survey collector — replaces the OAuth approach
in survey_collect.py. No credentials at all: just an unauthenticated GET
against the response Sheet's CSV export, which works once the Sheet is
shared "Anyone with the link can view." See problem_statement.md §15 for
the tradeoff (response data becomes link-accessible, not fully private)
and why this was chosen over OAuth (repeated Google Cloud Console friction
— wrong client type, then unverified-app blocking — made OAuth more
overhead than the survey's non-sensitive demographic data warranted).

The plain `?format=csv` export (no `gid` param) reliably grabs the first/
only sheet; adding `&gid=0` explicitly returned a 400 in testing — omit it.

Usage:
    python -m collectors.survey_collect_csv
"""

import csv
import io
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from common.io import append_jsonl

# Column header (exact text, whitespace-stripped) -> short key. "freeform":
# True fields are open text, captured but not run through segment
# distributions (extraction.survey_segments) or the theme pipeline yet —
# see the note in problem_statement.md §15 about this being a follow-up.
#
# "multi" fields (checkbox "select all that apply") are stored RAW, not
# split into a list. Google's CSV export comma-joins selected options, but
# at least one option's own label contains an internal comma ("Price — too
# expensive, or waiting for a drop → Economics"), so a naive split(",")
# breaks that option into two fake ones — confirmed on real response data
# 2026-08-19. Splitting correctly needs the form's actual canonical option
# list (each option apparently ends "-> CategoryName", which could anchor a
# regex split, but guessing that pattern from 2 responses risks silently
# getting it wrong on options not yet seen). Storing raw and revisiting
# once the canonical list is confirmed is the honest choice over presenting
# an unreliable split as clean structured counts.
COLUMN_MAP = {
    "Age": ("age", False),
    "Where do you live?": ("city_tier", False),
    "How often do you buy fashion online?": ("purchase_frequency", False),
    "What do you usually spend on a single fashion item, whether purchased online or offline?": ("spend_per_item", False),
    "Roughly what's the price of the most expensive item sitting in your wishlist right now?": ("wishlist_item_price", False),
    "How often do you save items to a wishlist on fashion apps? (Myntra, AJIO, Nykaa)": ("wishlist_save_frequency", False),
    "Roughly how many items are in your wishlist right now?": ("wishlist_size", False),
    "In the last month, how often did you go back and open something you'd saved?": ("return_visit_frequency", False),
    "Think of the last thing you saved. Why did you save it instead of buying then?": ("save_motivation", True),
    "Think of one item you saved but never bought. In one line, what stopped you? (1–2 lines)": ("current_blocker_freeform", True),
    "What usually happens to things you save?": ("outcome_pattern", False),
    "Which of these have stopped you buying something you'd saved? (select all that apply)": ("blocker_categories_raw", False),
    "Of those, which is the single biggest reason and why? (pick one)": ("primary_blocker_reason", False),
    "When you do buy something you'd saved, what usually brings you back to it?": ("resolution_trigger", False),
    "When you open your wishlist meaning to buy, how easy is it to decide?": ("decision_ease", False),
    "Before buying a saved item, do you check anything outside the app?": ("offsite_check_raw", False),
    "Before buying clothes online, do you ask someone's opinion?": ("social_validation_check", False),
    "You get one minute to complain directly to (Myntra, AJIO, Nykaa) product team. What would you say?": ("complaint_freeform", True),
}


def collect() -> None:
    if not config.SURVEY_SHEET_ID:
        print(
            "SURVEY_SHEET_ID is not set. Share the response Sheet as "
            "'Anyone with the link -> Viewer', then put its id in pipeline/.env "
            "as SURVEY_SHEET_ID=<id> (from docs.google.com/spreadsheets/d/<ID>/edit).\n"
            "It lives in .env rather than config.py because that Sheet is "
            "link-readable, which makes the id itself an access credential — "
            "committing it to a public repo would expose respondents' answers."
        )
        return

    url = f"https://docs.google.com/spreadsheets/d/{config.SURVEY_SHEET_ID}/export?format=csv"
    try:
        resp = requests.get(url, timeout=20)
    except requests.RequestException as exc:
        print(f"Request failed: {exc}")
        return

    if not resp.ok or "text/csv" not in resp.headers.get("content-type", ""):
        print(
            f"Fetch failed (status {resp.status_code}, content-type "
            f"{resp.headers.get('content-type')}) — check the Sheet is shared "
            "'Anyone with the link -> Viewer', not 'Restricted'."
        )
        return

    # Google's CSV export is UTF-8, but requests' charset auto-detection
    # from headers alone got it wrong here (produced mojibake — ₹ came back
    # as "â‚¹"). Decode explicitly from the raw bytes instead of trusting
    # resp.encoding / resp.text.
    csv_text = resp.content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(csv_text))
    records = []
    for i, row in enumerate(reader):
        answers = {}
        for header, value in row.items():
            if header == "Timestamp" or not value or not value.strip():
                continue
            mapped = COLUMN_MAP.get(header.strip())
            if not mapped:
                continue
            key, _is_freeform = mapped
            answers[key] = value.strip()

        records.append({
            "source_url": f"survey-response:row-{i}",
            "submitted_at": row.get("Timestamp"),
            "answers": answers,
        })

    if not records:
        print("Sheet has 0 response rows so far — nothing to write.")
        return

    out_path = config.RAW_DIR / "survey_responses.jsonl"
    written = append_jsonl(out_path, records)
    print(f"Done. {written} new survey responses written to {out_path} ({len(records)} total in the sheet)")


if __name__ == "__main__":
    collect()
