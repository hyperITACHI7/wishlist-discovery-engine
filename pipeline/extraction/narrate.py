"""Step 8 (optional) — a short LLM-written narrative summarizing the
already-computed findings.json, for the dashboard's "AI Synthesis" card.

Runs AFTER score.py, not as part of synthesize.py's step 6 — it needs the
real ranked opportunity rows (rates, n, quadrant, resolution reasons) to
have something concrete to narrate, not just the raw theme names.

This call names conclusions the engine already reached numerically; it
does not compute anything new; if it fails (quota, network), the pipeline
is otherwise complete and the dashboard's AI Synthesis card simply doesn't
render — same honest-fallback pattern as every other panel here.

Real bug caught 2026-08-19: the first version of this prompt didn't
mention the "no monetary incentives" constraint from problem_statement.md
§3.5/§7c, and the model's output recommended "focusing on price
incentives" as the top action — precisely the one lever this project
cannot ship, since Price and value perception's Addressability dimension
is deliberately capped for that exact reason. The prompt now states the
constraint explicitly and tells the model which themes are/aren't
price-capped, so it steers toward a real, usable lever instead.

Usage:
    python -m extraction.narrate
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from extraction.groq_client import GroqNotConfigured, extract_one


def build_prompt(findings: dict) -> str:
    rows = findings["opportunityRows"][:8]
    lines = []
    for r in rows:
        q = r.get("quadrant", {}).get("label", "")
        addressability = r.get("addressabilityNote") or "not price-capped — a real, usable lever"
        lines.append(
            f'- {r["area"]} (score {r["opportunityScore"]}, {q}): '
            f'{r["appPlayRatePct"]}% of App/Play (n={r["appPlayN"]}), '
            f'{r["redditRatePct"]}% of Reddit (n={r["redditN"]}), '
            f'resolution: "{r["resolutionReason"]}", '
            f'workaround seen: {r["hasWorkaround"]}, '
            f'addressability: {addressability}'
        )
    rows_block = "\n".join(lines)

    return f"""You are summarizing findings from a discovery engine analyzing why Myntra (Indian fashion e-commerce app) users wishlist items but don't buy them. It analyzed {findings['totalRecords']} real records ({findings['totalAppPlay']} App/Play Store reviews, {findings['totalReddit']} Reddit posts/comments) and ranked opportunity areas by a 5-dimension Opportunity Score.

HARD CONSTRAINT you must respect: the eventual solution may NOT use any monetary incentive — no discounts, cashback, coupons, or price levers of any kind. This is why "Price and value perception" has its Addressability dimension deliberately capped low even when its other dimensions score well, and why its resolution reason ("Great Discount") is NOT an available lever for this project. Never recommend prioritizing a price/discount theme, and never present a discount-based resolution reason as an actionable path — name it as evidence of the blocker, not as the fix.

Ranked opportunity areas (highest score first):
{rows_block}

Write a short narrative synthesis, 3-4 sentences, plain language, for a product manager reading this dashboard. Point to the clearest opportunity that is actually addressable without a price lever (favor themes whose Addressability isn't capped), note anything genuinely surprising (an emergent theme not in the classic fit/price/reviews list, or a wide gap between App/Play and Reddit rates), and be honest that a "not enough data yet" resolution reason means that lever is still unproven, not that the theme doesn't matter. Do not invent numbers not shown above. No bullet points, no headers — flowing prose only.

Return ONLY a JSON object of this exact shape, no other prose:
{{"narrative": "..."}}"""


def run_narrative() -> dict | None:
    findings_path = config.EXTRACTED_DIR / "findings.json"
    if not findings_path.exists():
        print(f"{findings_path} not found — run extraction.score first.")
        return None

    findings = json.loads(findings_path.read_text(encoding="utf-8"))
    if not findings.get("opportunityRows"):
        print("findings.json has no opportunity rows — nothing to narrate.")
        return None

    print(f"Generating narrative synthesis using {config.GROQ_MODEL_SYNTHESIS}...")
    prompt = build_prompt(findings)
    try:
        result = extract_one(prompt, config.GROQ_MODEL_SYNTHESIS)
    except GroqNotConfigured as exc:
        print(str(exc))
        return None

    if result is None or "narrative" not in result:
        print("Narrative call failed or returned unexpected shape — AI Synthesis card will not render.")
        return None

    out_path = config.EXTRACTED_DIR / "narrative.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Narrative written to {out_path}")
    return result


if __name__ == "__main__":
    run_narrative()
