"""Single entry point for the collection + extraction pipeline.

This is the standalone (non-n8n) way to run the pipeline described in
problem_statement.md §10 — useful for local development and for a student
project scope where standing up an n8n instance isn't warranted for Day 1.
If n8n orchestration is set up later, these same functions are what its
nodes should call (Python function nodes) or wrap (HTTP request nodes
hitting a small wrapper API) — the logic doesn't change, only who calls it.

YouTube was dropped as a source (2026-08-19) — no videos could be found
with both meaningful comment volume and decision-relevant discussion. See
problem_statement.md §9. Reddit's automated collect-reddit also runs into
Reddit's own blocks; see collectors/reddit_collect.py and
collectors/_manual_reddit_batch_20260818.py for the manual fallback.

The survey (collect-survey / survey-segments) is deliberately NOT part of
collect-all: it's a separate structured-data source with its own setup
requirement (the response Sheet must be shared "Anyone with the link ->
Viewer", see config.py's "Survey (Google Forms)" block). Run it explicitly.

Usage:
    python run_pipeline.py collect-all
    python run_pipeline.py collect-reddit
    python run_pipeline.py collect-playstore
    python run_pipeline.py collect-appstore
    python run_pipeline.py collect-survey
    python run_pipeline.py pilot --n 50
    python run_pipeline.py batch-extract
    python run_pipeline.py survey-segments
"""

import argparse

from collectors import appstore_collect, playstore_collect, reddit_collect, survey_collect_csv
from extraction import batch_extract, pilot, survey_segments


def collect_all() -> None:
    reddit_collect.collect()
    playstore_collect.collect()
    appstore_collect.collect()


COMMANDS = {
    "collect-all": collect_all,
    "collect-reddit": reddit_collect.collect,
    "collect-playstore": playstore_collect.collect,
    "collect-appstore": appstore_collect.collect,
    "collect-survey": survey_collect_csv.collect,
    "batch-extract": batch_extract.run_batch,
    "survey-segments": survey_segments.run_survey_segments,
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=list(COMMANDS.keys()) + ["pilot"])
    parser.add_argument("--n", type=int, default=50, help="pilot only: sample size")
    args = parser.parse_args()

    if args.command == "pilot":
        pilot.run_pilot(args.n)
    else:
        COMMANDS[args.command]()


if __name__ == "__main__":
    main()
