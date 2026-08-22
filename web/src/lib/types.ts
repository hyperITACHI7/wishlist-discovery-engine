// Types mirror the v4 extraction schema and output views defined in
// ../../../problem_statement.md (§6, §7, §8). Keep in sync with that document.

export type IntentSignal = "buy-intent" | "save-for-later" | "not-determinable";

export type Lens = "retrospective" | "prospective";

/** Fields common to every extraction, regardless of lens. */
export interface CoreExtraction {
  product_category?: "apparel" | "footwear" | "beauty" | "accessories" | "unclear";
  intent_signal: IntentSignal;
  intent_evidence?: string;
  segment_signal?: string;
  decision_factors?: string[];
  confidence: "low" | "medium" | "high";
}

/** Behavioural fields, present on either lens when evidenced. */
export interface BehaviouralExtraction {
  save_motivation?: string;
  comparison_behavior?: string;
  offsite_research?: string;
  workaround?: string;
}

/** Retrospective lens only — App/Play Store style "I already bought this" text. */
export interface RetrospectiveExtraction {
  hesitation_signal?: string;
  delay_signal?: string;
  resolution_reason?: string;
  post_purchase_outcome?: "satisfied" | "regret" | "returned" | "unclear";
}

/** Prospective lens only — Reddit/forum style "still deciding" text. */
export interface ProspectiveExtraction {
  current_blocker_freeform?: string;
  deferral_trigger?: string;
  mentions_wishlist?: boolean;
}

export type ExtractionResult = CoreExtraction &
  BehaviouralExtraction &
  Partial<RetrospectiveExtraction> &
  Partial<ProspectiveExtraction> & {
    verbatim_quote: string;
  };

/** Quadrant badge — Frequency x Intent Quality, not Frequency x Severity:
 * at this corpus size post_purchase_outcome rarely resolves to
 * regret/returned, so severity min-max-scales flat across every theme and
 * carries no signal yet. Frequency/Intent Quality both have real spread.
 * See pipeline/extraction/score.py for the computation. */
export interface QuadrantBadge {
  label: "CRITICAL" | "HIGH INTENT" | "HIGH VOLUME" | "MONITOR";
  tier: "serious" | "warning" | "neutral";
}

/** Theme-level rollup of per-record extraction confidence. The raw mix ships
 * alongside the score because a "60" can mean "all medium" or "half high,
 * half low" — see pipeline/extraction/score.py's confidence_profile(). */
export interface ConfidenceProfile {
  score: number;
  label: "Strong" | "Medium" | "Weak";
  mix: { high: number; medium: number; low: number };
}

/** One source record behind a theme, as rendered in the evidence drill-down. */
export interface EvidenceRecord {
  source: string;
  sourceUrl: string;
  date?: string | null;
  subreddit?: string | null;
  lens: "retrospective" | "prospective";
  quote?: string | null;
  confidence: "low" | "medium" | "high";
  intentSignal: IntentSignal;
  productCategory: string;
  blocker?: string | null;
  workaround?: string | null;
  resolutionReason?: string | null;
}

/** View 1 — the headline two-sided opportunity table. */
export interface OpportunityRow {
  area: string;
  appPlayRatePct: number;
  appPlayN: number;
  resolutionReason: string;
  redditRatePct: number;
  redditN: number;
  hasWorkaround: boolean;
  sampleQuote: string;
  opportunityScore: number;
  quadrant?: QuadrantBadge;
  addressabilityNote?: string;
  totalVolume?: number;
  confidence?: ConfidenceProfile;
  workarounds?: string[];
  /** post_purchase_outcome distribution. Retrospective lens only, and its own
   * coverage (coveredN of ofN) ships with it — this field is sparse, so a bare
   * count would overstate how much of the theme it actually describes. */
  outcomeMix?: { counts: Record<string, number>; coveredN: number; ofN: number };
  intentMix?: Record<string, number>;
  evidence?: EvidenceRecord[];
}

/** View 2 — question coverage. */
export interface QuestionCoverageRow {
  question: string;
  finding: string;
  n: string;
  confidence: "Strong" | "Medium" | "Weak";
  answeredBy: "Engine" | "Engine + Interviews" | "Interviews";
  present?: number;
  coveragePct?: number;
  /** Which extraction field(s) answer this question — the auditable link
   * between a brief question and the schema, see score.py's QUESTION_FIELDS. */
  fields?: string[];
  /** Actual top phrases behind the question, so coverage shows WHAT was
   * found and not only how many records it appeared in. */
  insights?: { phrase: string; count: number; field: string }[];
}

/** View 3 (rewritten 2026-08-20) — the JOINT product_category x intent_signal
 * table per theme. Replaced two separate marginal bar charts, which showed the
 * same records twice without ever showing the interaction between them. */
export interface CrossTabMatrix {
  theme: string;
  totalN: number;
  rowDimension: string;
  colDimension: string;
  rowLabels: string[];
  colLabels: string[];
  rowTotals: { label: string; n: number }[];
  colTotals: { label: string; n: number }[];
  cells: { row: string; col: string; n: number; pctOfTotal: number; smallCell: boolean }[];
}

/** Volume at each gate the corpus passed through, collection -> ranking. Each
 * stage carries the reason for its drop, since every one is a documented
 * external constraint rather than incidental loss. */
export interface FunnelStage {
  stage: string;
  n: number;
  note: string;
}

/** Survey (Google Forms) segment data — structured, not LLM-extracted, and
 * never cross-tabbed against review/Reddit themes (different, unlinked
 * anonymous populations). See pipeline/extraction/survey_segments.py. */
export interface SurveyDistribution {
  question: string;
  field: string;
  cells: { label: string; valuePct: number; n: number; smallCell?: boolean }[];
}

export interface SurveyHeavyVsLight {
  dimension: string;
  groups: {
    label: string;
    cells: { label: string; valuePct: number; n: number; smallCell?: boolean }[];
  }[];
}

export interface SurveyFindings {
  totalResponses: number;
  distributions: SurveyDistribution[];
  heavyVsLightWishlisters: SurveyHeavyVsLight | null;
  note: string;
}

/** Keyword Buzz cloud — see pipeline/extraction/keywords.py. A keyword-marker
 * lexicon applied to phrase text, not a trained sentiment model; phrases
 * matching neither list are left out rather than guessed at. */
export interface KeywordCloudData {
  negative: { text: string; value: number }[];
  positive: { text: string; value: number }[];
  method: string;
}
