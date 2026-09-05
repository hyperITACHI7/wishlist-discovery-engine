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
import { BRIEF_ANSWERS, CROSS_CUTTING_FINDINGS, LENS_FINDING } from "./briefAnswers";
import {
  EXECUTIVE_SUMMARY,
  INTERVIEWS,
  INTERVIEW_META,
  RECOMMENDATIONS,
  WHAT_INTERVIEWS_ADD,
  WISHLIST_SIZE_FINDING,
} from "./interviews";

const WIDGET_GLOSSARY = `
WIDGET GLOSSARY (what each part of the dashboard shows):
- Source ribbon (top bar): corpus composition — App/Play Store reviews and Reddit records. Always visible so every number below has its base rate in view.
- The 4 stat cards: Opportunity areas / Top opportunity / Brief questions covered / Themes with a workaround. Each is clickable and opens a full detail view.
- Pipeline funnel ("How much data survived each gate"): sequential stages from collection to ranked themes. It is a funnel, not a pie, because each stage's input is the previous stage's output — the stages are not parts of one whole.
- Ranked by Opportunity Score: the headline ranking. Opportunity Score is the geometric mean of 5 dimensions (Frequency, Severity, Intent quality, Resolution leverage, Non-monetary addressability). Clicking a theme opens every source record behind it plus the engine's read of them. IMPORTANT (changed 2026-08-23): the Frequency dimension counts only FRICTION-BEARING records — ones with a stated blocker, workaround, deferral trigger, or a regret/returned outcome — not every record that mentions the theme. Praise volume does not raise a theme's rank.
- Evidence labels — TWO SEPARATE AXES on every source record, do not conflate them: (a) TONE = praise / negative / neutral, from the star rating and stated outcome; (b) the "⚑ blocker" flag = does this record evidence an actual purchase blocker (a stated hesitation, workaround, deferral trigger, or regret/returned outcome). They cut across each other on purpose: a 1-star rant about late delivery is NEGATIVE but NOT a blocker, and a 5-star review describing a size-bracketing workaround IS a blocker. Only the blocker count drives the Opportunity Score. Both are derived mechanically from rating + which extraction fields are present, NOT a sentiment model.
- Quadrant badge (CRITICAL / HIGH INTENT / HIGH VOLUME / MONITOR): Frequency x Intent Quality. Deliberately NOT Frequency x Severity — at this corpus size post_purchase_outcome almost never resolves to regret/returned, so severity scales flat across every theme and would label them all the same.
- The Brief's 10 Questions section now leads with an actual ANSWER per question (analyst-written, see the answers block below) followed by the fill-rate metadata. If someone asks what the engine found on any of the 10, lead with the answer and its caveat — not the fill rate. Coverage details: per-question fill rate, the actual top phrases found, confidence, and whether the engine or the interviews answer it.
- Decision Factors: corpus-wide breakdown of decision_factors (141 of 578 records, 310 phrase mentions), bucketed into 8 categories by a keyword-marker classifier. General purchase-decision language (quality, price, delivery) — NOT exclusively about wishlist hesitation, that narrower signal is too sparse in public text to chart.
- What Happens After Purchase: corpus-wide post_purchase_outcome rollup (satisfied/regret/returned/unclear), App/Play reviews only, 174 of 560 stated an outcome.
- AI Synthesis: a narrative summary generated once at pipeline time from the ranked findings. Not a new analysis.
- Interviews tab: the completed primary-research round — 6 participants, analyst-synthesised persona profiles, plus an executive summary and 4 strategic product recommendations. See the interviews section below. This is the ONLY place the project has segment attributes and stated wishlist sizes.
- Research findings tab: 14 desk-research questions on the psychology of wishlisting, each with the finding, the named mechanism behind it, what it implies for this project, how the engine's own corpus compares, and its sources. This is EXTERNAL published literature, not this engine's findings — see the research section below.
- Limitations (the ⓘ button): stated biases, null rates, and what this engine can't answer.
- Try it yourself: paste any text and watch the live extraction run.
`.trim();

const HARD_RULES = `
THINGS THAT ARE TRUE AND MUST NOT BE CONTRADICTED:
- Hard project constraint: NO monetary incentives may be used in any eventual solution — no discounts, cashback, coupons, or price levers. "Price and value perception" has its Addressability dimension deliberately capped for this reason. Never recommend a discount/price lever as a fix. If a theme's resolution reason is a discount, describe it as evidence of the blocker, not an available fix.
- There is no survey. A Google Forms survey was part of this project earlier and has been removed entirely; if asked, say so plainly rather than describing findings from it. Q9 (segment differences) is answered by the interviews alone.
- Interview participants and public reviewers are different, unlinked populations. NEVER cross-tabulate or compare them as if they were the same people, and never add an interview count to a corpus count. Where both point the same way, say so as corroboration across two separate evidence bases — never as one combined figure.
- THE INTERVIEW BOUNDARY: the interviews are n=6 qualitative depth. Nothing from them is a rate or a percentage, and none of it feeds the Opportunity Scores. They are analyst-synthesised persona profiles, not raw transcripts — the only verbatim material is the short ownership-language fragments. Do not report an interview pattern as if it were measured across the corpus.
- This engine's scope ends at identify / quantify / compare. Proposing specific product features is out of scope — you may describe resolution paths and workarounds OBSERVED in the corpus, clearly labelled as observations.
- "Not enough data yet" on a resolution reason means that lever is unproven, NOT that the theme is unimportant.
- The corpus is self-selected public text. It is directional, not statistically representative.
- MOST APP/PLAY RECORDS ARE PRAISE, NOT COMPLAINTS, and most are about the PRODUCT (fabric, fit, delivery) rather than about the wishlist. Measured: only ~4% of App/Play records carry any friction signal, versus ~97% of Reddit records. Never describe a theme's full record count as if it were a complaint count, and never present a positive review as evidence of a blocker. When citing a theme's size, prefer its friction count and say which you are using. The App/Play lens is best understood as post-purchase satisfaction data; the wishlist-blocker signal lives overwhelmingly in Reddit.
- Addressability is a labelled judgment call, not measured data.
- THE RESEARCH BOUNDARY: the DESK RESEARCH section is published external literature (mostly Western-market academic work applied to an Indian fashion context). It is NOT this engine's findings and NOT about Myntra users specifically. Never merge the two into one body of evidence, never present a research statistic as something this corpus found, and never present an engine number as literature. When both bear on a question, say which is which — e.g. "the literature finds X; this corpus separately shows Y." Attribute research claims to their source when you cite a number from them.
`.trim();

/** The interview round, compacted for the model. Keeps each participant's
 * segment attributes, wishlist size, bottleneck, ownership language and
 * concept reactions — enough to answer a segment question, which is the one
 * thing the public-text corpus genuinely cannot do. */
function buildInterviewsContext(): string {
  const people = INTERVIEWS.map((p) => {
    const lines = [
      `U${p.id} — ${p.age}, ${p.location}, spends ${p.spendBand}, wishlist ${p.wishlistSize} (${p.wishlistRole}); cluster: ${p.cluster}`,
      `  USES IT FOR: ${p.wishlistDynamic}`,
      `  BOTTLENECK: ${p.behavioralBottleneck}`,
      `  PSYCHOLOGY: ${p.psychology} Language recorded: ${p.languageCues.map((c) => `"${c}"`).join(", ")}`,
      `  DECISION ASSISTANT: ${p.concept.decisionAssistant}`,
      p.concept.digitalWardrobe
        ? `  DIGITAL WARDROBE: ${p.concept.digitalWardrobe}`
        : `  DIGITAL WARDROBE: not covered in this interview — do not infer a reaction`,
      p.corroborates ? `  CORROBORATED SEPARATELY BY THE CORPUS: ${p.corroborates}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }).join("\n\n");

  const recs = RECOMMENDATIONS.map(
    (r) => `${r.id}. ${r.title}${r.personas ? ` (from U${r.personas.join(", U")})` : ""} — ${r.detail}`,
  ).join("\n");

  return `
PRIMARY-RESEARCH INTERVIEWS — "${INTERVIEW_META.title}", n=${INTERVIEW_META.n}.
${INTERVIEW_META.method}
BOUNDARY: ${INTERVIEW_META.boundary}

EXECUTIVE SUMMARY: ${EXECUTIVE_SUMMARY.headline} ${EXECUTIVE_SUMMARY.body}
Friction centres on: ${EXECUTIVE_SUMMARY.frictionCenters.map((f) => `${f.label} (${f.note})`).join("; ")}.

KEY SEGMENT FINDING — ${WISHLIST_SIZE_FINDING.headline}
${WISHLIST_SIZE_FINDING.detail}
CAUTION: ${WISHLIST_SIZE_FINDING.caution}

PARTICIPANTS:
${people}

STRATEGIC PRODUCT RECOMMENDATIONS (from the interview round, NOT from the engine — the engine's own scope stops before solution design):
${recs}

WHAT THE INTERVIEWS ADD THAT PUBLIC TEXT CANNOT:
${WHAT_INTERVIEWS_ADD.map((w) => `- ${w}`).join("\n")}
`.trim();
}

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
    return `${WIDGET_GLOSSARY}\n\n${HARD_RULES}\n\n${buildInterviewsContext()}\n\n${buildResearchContext()}\n\nDATA STATUS: The pipeline has not been run — the dashboard is showing illustrative placeholder data, not real findings. Say so if asked about any specific engine number. The interviews and the desk research above are still valid, since neither depends on the pipeline.`;
  }

  const themes = f.opportunityRows
    .slice()
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((r, i) => {
      const parts = [
        `${i + 1}. "${r.area}" — Opportunity Score ${r.opportunityScore.toFixed(2)}`,
        `quadrant ${r.quadrant?.label ?? "n/a"}`,
        `${r.totalVolume ?? 0} records (${r.appPlayN} app/play = ${r.appPlayRatePct}% of that source; ${r.redditN} reddit = ${r.redditRatePct}%)`,
        r.sentimentMix
          ? `TONE: ${r.sentimentMix.praise} praise / ${r.sentimentMix.negative} negative / ${r.sentimentMix.neutral} neutral. SEPARATELY, ${r.sentimentMix.friction} of ${r.totalVolume ?? 0} evidence an actual purchase blocker — that count drives the rank, not the total`
          : "",
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
      }${q.blocker ? `; WHY WEAK: ${q.blocker}` : ""}`;
    })
    .join("\n");

  const funnel = f.pipelineFunnel.map((s) => `- ${s.stage}: ${s.n} (${s.note})`).join("\n");

  // The analyst's written answers. These are the substance when someone asks
  // "what did you find" — the fill rates above say how MUCH was found, these
  // say WHAT. Analyst-written, not model-generated; the assistant should
  // reproduce them faithfully rather than improvising its own reading.
  const answers = BRIEF_ANSWERS.map((a) => {
    const mech = (a.mechanisms ?? []).map((m) => `      * ${m.label}: ${m.note}`).join("\n");
    return [
      `Q${a.id}. ${a.question}`,
      `  ANSWER: ${a.answer ?? "The corpus cannot answer this."}`,
      `  REASONING: ${a.detail}`,
      mech ? `  MECHANISMS:\n${mech}` : "",
      `  EVIDENCE: ${a.evidenceNote} (source: ${a.source})`,
      a.caveat ? `  CAVEAT: ${a.caveat}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n\n");

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

THE ANALYST'S ANSWERS TO THE BRIEF'S 10 QUESTIONS (written by hand from reading the records, NOT model-generated — reproduce these faithfully rather than improvising a different reading; they identify and quantify, they deliberately do NOT propose solutions):
${LENS_FINDING.headline} ${LENS_FINDING.detail}

${answers}

READING THE TEN TOGETHER:
${CROSS_CUTTING_FINDINGS.map((c) => `- ${c}`).join("\n")}

COVERAGE OF THE BRIEF'S 10 QUESTIONS (fill rates — how MUCH was found, not what):
${coverage}

PIPELINE FUNNEL (volume at each gate):
${funnel}

DECISION FACTORS (what shoppers say they weigh — general purchase-decision language, NOT exclusively wishlist-specific):
${decisionFactors}

POST-PURCHASE OUTCOME (corpus-wide, App/Play only):
${outcome}

${f.narrative ? `EXISTING AI SYNTHESIS NARRATIVE:\n${f.narrative}\n` : ""}
${buildInterviewsContext()}

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
