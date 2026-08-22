// ILLUSTRATIVE PLACEHOLDER DATA.
// The real corpus (Reddit / App & Play Store) has not been collected
// or run through the extraction + synthesis pipeline yet — see pipeline/ and
// problem_statement.md §9-10. These rows exist only to demonstrate the shape
// of the output views (opportunity table, question coverage) that
// Panel A will render once the batch pipeline has actually run. Do not treat
// any number below as a real finding about Myntra users.

import { DecisionFactorBucket, FunnelStage, OpportunityRow, OutcomeSummary, QuestionCoverageRow } from "./types";

export const PIPELINE_HAS_RUN = false;

export const opportunityRows: OpportunityRow[] = [
  {
    area: "Fit/size uncertainty (return-visit specific)",
    appPlayRatePct: 12,
    appPlayN: 480,
    resolutionReason: "Checked size chart again + read 2-3 recent reviews before buying",
    redditRatePct: 21,
    redditN: 96,
    hasWorkaround: true,
    sampleQuote: "“I keep it wishlisted for weeks because I always second-guess the size when I come back to it.”",
    opportunityScore: 3.2,
  },
  {
    area: "Styling/occasion doubt",
    appPlayRatePct: 8,
    appPlayN: 480,
    resolutionReason: "Paired mentally with an existing outfit after seeing more photos/reviews",
    redditRatePct: 15,
    redditN: 96,
    hasWorkaround: false,
    sampleQuote: "“It's cute but I genuinely don't know if I'd ever wear it anywhere.”",
    opportunityScore: 2.6,
  },
  {
    area: "Trust/quality gap",
    appPlayRatePct: 10,
    appPlayN: 480,
    resolutionReason: "Waited for more reviews / photos to accumulate before buying",
    redditRatePct: 9,
    redditN: 96,
    hasWorkaround: true,
    sampleQuote: "“Photos never match what actually shows up, so I wait and see what people say.”",
    opportunityScore: 2.4,
  },
  {
    area: "Price-watching (not purchase-intent-driven)",
    appPlayRatePct: 6,
    appPlayN: 480,
    resolutionReason: "Bought only once a sale/price-drop hit",
    redditRatePct: 18,
    redditN: 96,
    hasWorkaround: true,
    sampleQuote: "“I just leave stuff in wishlist and wait for it to go on sale.”",
    opportunityScore: 1.1,
    addressabilityNote: "Addressability capped — no monetary levers allowed for this project",
  },
  {
    area: "Decision paralysis / comparison overload",
    appPlayRatePct: 5,
    appPlayN: 480,
    resolutionReason: "Picked one arbitrarily after too long, or gave up entirely",
    redditRatePct: 11,
    redditN: 96,
    hasWorkaround: false,
    sampleQuote: "“I have like 80 things saved, I genuinely can't tell what I actually want anymore.”",
    opportunityScore: 2.0,
  },
];

export const questionCoverageRows: QuestionCoverageRow[] = [
  { question: "1. Why do users add products to their wishlist?", finding: "pending pipeline run", n: "—", confidence: "Medium", answeredBy: "Engine + Interviews" },
  { question: "2. What prevents wishlisted products from being purchased?", finding: "pending pipeline run", n: "—", confidence: "Strong", answeredBy: "Engine" },
  { question: "3. What uncertainties remain after finding a product they like?", finding: "pending pipeline run", n: "—", confidence: "Strong", answeredBy: "Engine" },
  { question: "4. What causes users to postpone a purchase?", finding: "pending pipeline run", n: "—", confidence: "Medium", answeredBy: "Engine + Interviews" },
  { question: "5. How do users compare multiple shortlisted products?", finding: "rarely narrated in public text", n: "—", confidence: "Weak", answeredBy: "Interviews" },
  { question: "6. What information do users seek outside Myntra?", finding: "pending pipeline run", n: "—", confidence: "Strong", answeredBy: "Engine" },
  { question: "7. Role of fit, size, styling, price, reviews, occasion, social validation", finding: "pending pipeline run", n: "—", confidence: "Strong", answeredBy: "Engine" },
  { question: "8. Genuine purchase intent vs. bookmarking?", finding: "pending pipeline run", n: "—", confidence: "Medium", answeredBy: "Engine + Interviews" },
  { question: "9. How do behaviours differ across segments?", finding: "attributes rarely stated in public text", n: "—", confidence: "Weak", answeredBy: "Interviews" },
  { question: "10. What unmet needs emerge consistently?", finding: "pending pipeline run", n: "—", confidence: "Strong", answeredBy: "Engine" },
];

export const decisionFactorBreakdown: DecisionFactorBucket[] = [
  { category: "Quality & Authenticity", count: 0, pctOfMentions: 0, examplePhrases: ["pending pipeline run"] },
  { category: "Price & Value", count: 0, pctOfMentions: 0, examplePhrases: ["pending pipeline run"] },
];

export const postPurchaseOutcomeSummary: OutcomeSummary = {
  counts: {},
  coveredN: 0,
  ofN: 0,
};

export const pipelineFunnel: FunnelStage[] = [
  { stage: "Collected", n: 0, note: "pending pipeline run" },
  { stage: "Extracted", n: 0, note: "pending pipeline run" },
  { stage: "Unique phrases", n: 0, note: "pending pipeline run" },
  { stage: "Into synthesis", n: 0, note: "pending pipeline run" },
  { stage: "Mapped to themes", n: 0, note: "pending pipeline run" },
  { stage: "Ranked themes", n: 0, note: "pending pipeline run" },
];
