// Server-only. Builds the grounding context the dashboard assistant answers
// from — the real findings, compacted into a prompt-sized brief.
//
// The hard rule this file exists to enforce: the assistant answers ONLY from
// numbers that were actually computed by the pipeline. A research tool that
// invents a plausible-sounding rate is worse than one that says "not in the
// data" — it launders a guess into something a reader will cite. So the
// context is assembled from findings.json rather than described from memory,
// and the system prompt below tells the model to refuse rather than fill gaps.

import { loadFindings } from "./loadFindings";
import { RESEARCH_IMPLICATIONS, RESEARCH_QUESTIONS } from "./psychologyResearch";

const WIDGET_GLOSSARY = `
WIDGET GLOSSARY (what each part of the dashboard shows):
- Source ribbon (top bar): corpus composition — App/Play Store reviews and Reddit records. Always visible so every number below has its base rate in view.
- The 4 stat cards: Opportunity areas / Top opportunity / Brief questions covered / Themes with a workaround. Each is clickable and opens a full detail view.
- Pipeline funnel ("How much data survived each gate"): sequential stages from collection to ranked themes. It is a funnel, not a pie, because each stage's input is the previous stage's output — the stages are not parts of one whole.
- Ranked by Opportunity Score: the headline ranking. Opportunity Score is the geometric mean of 5 dimensions (Frequency, Severity, Intent quality, Resolution leverage, Non-monetary addressability). Clicking a theme opens every source record behind it plus the engine's read of them.
- Quadrant badge (CRITICAL / HIGH INTENT / HIGH VOLUME / MONITOR): Frequency x Intent Quality. Deliberately NOT Frequency x Severity — at this corpus size post_purchase_outcome almost never resolves to regret/returned, so severity scales flat across every theme and would label them all the same.
- Coverage of the brief's 10 questions: per-question fill rate, the actual top phrases found, confidence, and whether the engine or the interviews answer it.
- Decision Factors: corpus-wide breakdown of decision_factors (141 of 578 records, 310 phrase mentions), bucketed into 8 categories by a keyword-marker classifier. General purchase-decision language (quality, price, delivery) — NOT exclusively about wishlist hesitation, that narrower signal is too sparse in public text to chart.
- What Happens After Purchase: corpus-wide post_purchase_outcome rollup (satisfied/regret/returned/unclear), App/Play reviews only, 174 of 560 stated an outcome.
- AI Synthesis: a narrative summary generated once at pipeline time from the ranked findings. Not a new analysis.
- Interviews tab: reserved for 5-6 primary-research interviews, not yet run.
- Research findings tab: 14 desk-research questions on the psychology of wishlisting, each with the finding, the named mechanism behind it, what it implies for this project, how the engine's own corpus compares, and its sources. This is EXTERNAL published literature, not this engine's findings — see the research section below.
- Limitations (the ⓘ button): stated biases, null rates, and what this engine can't answer.
- Try it yourself: paste any text and watch the live extraction run.
`.trim();

const HARD_RULES = `
THINGS THAT ARE TRUE AND MUST NOT BE CONTRADICTED:
- Hard project constraint: NO monetary incentives may be used in any eventual solution — no discounts, cashback, coupons, or price levers. "Price and value perception" has its Addressability dimension deliberately capped for this reason. Never recommend a discount/price lever as a fix. If a theme's resolution reason is a discount, describe it as evidence of the blocker, not an available fix.
- There is no survey. A Google Forms survey was part of this project earlier and has been removed entirely; if asked, say so plainly rather than describing findings from it. Q9 (segment differences) is answered by interviews alone.
- Interview participants and public reviewers are different, unlinked populations. NEVER cross-tabulate or compare them as if they were the same people.
- This engine's scope ends at identify / quantify / compare. Proposing specific product features is out of scope — you may describe resolution paths and workarounds OBSERVED in the corpus, clearly labelled as observations.
- "Not enough data yet" on a resolution reason means that lever is unproven, NOT that the theme is unimportant.
- The corpus is self-selected public text. It is directional, not statistically representative.
- Addressability is a labelled judgment call, not measured data.
- THE RESEARCH BOUNDARY: the DESK RESEARCH section is published external literature (mostly Western-market academic work applied to an Indian fashion context). It is NOT this engine's findings and NOT about Myntra users specifically. Never merge the two into one body of evidence, never present a research statistic as something this corpus found, and never present an engine number as literature. When both bear on a question, say which is which — e.g. "the literature finds X; this corpus separately shows Y." Attribute research claims to their source when you cite a number from them.
`.trim();

/** The desk research, compacted for the model. Each entry keeps the question,
 * the answer, the named mechanisms, the numbered findings, the implication,
 * how the engine's own corpus compares, and the source URLs — enough for the
 * assistant to answer a research question and cite where it came from. */
function buildResearchContext(): string {
  const entries = RESEARCH_QUESTIONS.map((q) => {
    const findings = q.findings
      .map((f) => `    * ${f.claim}${f.stat ? ` [${f.stat}]` : ""} — ${f.detail}`)
      .join("\n");
    // Titles only, no URLs. The model cites by name and the Research tab
    // carries the clickable links — shipping ~60 URLs into every request
    // would cost real tokens against a 200k/day cap for no answer-quality gain.
    const sources = q.sources.map((s) => s.title).join(" | ");
    return [
      `R${q.id}. ${q.question}`,
      `  ANSWER: ${q.shortAnswer}`,
      `  MECHANISMS: ${q.mechanisms.join(", ")}`,
      `  FINDINGS:\n${findings}`,
      `  IMPLICATION FOR THIS PROJECT: ${q.implication}`,
      q.enginesLink ? `  HOW THIS ENGINE'S OWN CORPUS COMPARES: ${q.enginesLink}` : "",
      `  SOURCES: ${sources}`,
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n\n");

  return `
DESK RESEARCH — 14 psychology questions (EXTERNAL PUBLISHED LITERATURE, NOT THIS ENGINE'S FINDINGS).
Shown on the "Research findings" tab. Directional; mostly Western-market academic literature applied to an Indian fashion context. It contextualises what the engine found; it is never evidence FROM the engine. Cite the source when you use one of its numbers.

${entries}

WHAT THIS RESEARCH CHANGES IN THE PLAN:
${RESEARCH_IMPLICATIONS.map((i) => `- ${i}`).join("\n")}
`.trim();
}

export function buildGroundingContext(): string {
  const f = loadFindings();

  if (!f.pipelineHasRun) {
    return `${WIDGET_GLOSSARY}\n\n${HARD_RULES}\n\n${buildResearchContext()}\n\nDATA STATUS: The pipeline has not been run — the dashboard is showing illustrative placeholder data, not real findings. Say so if asked about any specific engine number. The desk research above is still valid, since it doesn't depend on the pipeline.`;
  }

  const themes = f.opportunityRows
    .slice()
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((r, i) => {
      const parts = [
        `${i + 1}. "${r.area}" — Opportunity Score ${r.opportunityScore.toFixed(2)}`,
        `quadrant ${r.quadrant?.label ?? "n/a"}`,
        `${r.totalVolume ?? 0} records (${r.appPlayN} app/play = ${r.appPlayRatePct}% of that source; ${r.redditN} reddit = ${r.redditRatePct}%)`,
        `resolution reason: "${r.resolutionReason}"`,
        `workaround stated: ${r.hasWorkaround ? `yes (${r.workarounds?.length ?? 0}: ${(r.workarounds ?? []).join(" | ")})` : "no"}`,
        r.confidence ? `extraction confidence ${r.confidence.score}/100 (${r.confidence.label})` : "",
        r.addressabilityNote ? `NOTE: ${r.addressabilityNote}` : "",
      ].filter(Boolean);
      return parts.join("; ");
    })
    .join("\n");

  const coverage = f.questionCoverageRows
    .map((q) => {
      const insights = (q.insights ?? []).map((i) => `"${i.phrase}" (${i.count}x)`).join(", ");
      return `- ${q.question} => ${q.finding}; confidence ${q.confidence}; answered by ${q.answeredBy}${
        insights ? `; top phrases found: ${insights}` : "; no phrases extracted"
      }`;
    })
    .join("\n");

  const funnel = f.pipelineFunnel.map((s) => `- ${s.stage}: ${s.n} (${s.note})`).join("\n");

  const decisionFactors = f.decisionFactorBreakdown
    .map((b) => `- ${b.category}: ${b.count} mentions (${b.pctOfMentions}%) — e.g. ${b.examplePhrases.join(", ")}`)
    .join("\n");

  const outcome = f.postPurchaseOutcomeSummary.coveredN > 0
    ? `Stated in ${f.postPurchaseOutcomeSummary.coveredN} of ${f.postPurchaseOutcomeSummary.ofN} App/Play reviews: ${Object.entries(f.postPurchaseOutcomeSummary.counts).map(([k, v]) => `${k}=${v}`).join(", ")}`
    : "Not computed.";

  return `
CORPUS: ${f.totalRecords} extracted records — ${f.totalAppPlay} App/Play Store reviews (retrospective lens: people who already bought) and ${f.totalReddit} Reddit records (prospective lens: people still deciding, hand-extracted because both automated Reddit paths are blocked). These two sources are the entire corpus.

RANKED OPPORTUNITY AREAS:
${themes}

COVERAGE OF THE BRIEF'S 10 QUESTIONS:
${coverage}

PIPELINE FUNNEL (volume at each gate):
${funnel}

DECISION FACTORS (what shoppers say they weigh — general purchase-decision language, NOT exclusively wishlist-specific):
${decisionFactors}

POST-PURCHASE OUTCOME (corpus-wide, App/Play only):
${outcome}

${f.narrative ? `EXISTING AI SYNTHESIS NARRATIVE:\n${f.narrative}\n` : ""}
${buildResearchContext()}

${WIDGET_GLOSSARY}

${HARD_RULES}
`.trim();
}

export const CHAT_SYSTEM_PROMPT = `You are the assistant built into the Wishlist Discovery Engine dashboard — a student PM research tool that mines public feedback about Myntra to find out why wishlisted items don't get purchased.

Your job is to help a reader understand this dashboard: what each widget shows, what the findings say, what the supporting psychology research says, and what the engine can and can't answer.

ABSOLUTE RULE — GROUNDING: Answer only from the CONTEXT block provided. Every number you state must appear in that context. If someone asks about something not in the context, say plainly that it isn't in the data rather than estimating, extrapolating, or reasoning from general knowledge about e-commerce. Inventing a plausible figure would be far worse than admitting a gap, because a reader may cite it.

TWO KINDS OF EVIDENCE — KEEP THEM APART: the context holds (a) this engine's own findings from its Myntra corpus, and (b) DESK RESEARCH, which is published external literature about shopping psychology in general. Always make clear which one you're drawing on. Say "the research literature finds…" versus "this engine's corpus shows…". Never state a research statistic as something this corpus found, and never merge them into a single claim. When both bear on a question, giving both — and noting where they agree or diverge — is the best answer you can give.

CITING RESEARCH: when you use a number or claim from the desk research, name its source (the short title is enough — "per Baymard", "per the 'Heart it or cart it' study"). Readers need to be able to check it.

STYLE: Concise and direct. 2-5 sentences for most questions. Use plain language, not jargon. Cite the actual n whenever you give an engine rate. No markdown headers; light use of bullet points is fine for lists. Don't open with pleasantries.

HONESTY: Foreground the limitations when they're relevant — small n, self-selected sample, "not enough data yet" resolution reasons, and questions handed to the interview stage. That candour is a feature of this project, not a caveat to bury.`;
