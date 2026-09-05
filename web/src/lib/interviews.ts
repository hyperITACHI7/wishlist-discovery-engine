// Primary-research interviews — 6 users, decision-making and wishlist behavior.
//
// PROVENANCE: structured from "Research Synthesis: Decision-Making & Wishlist
// Behavior", the analyst's own synthesis of the interview round. Same pattern
// as psychologyResearch.ts: ONE module read by both the Interviews tab and the
// assistant's grounding context, so the two cannot drift apart.
//
// WHAT THIS IS AND ISN'T — the boundary the UI has to keep visible:
// these are analyst-written persona syntheses, not raw transcripts. The short
// quoted fragments below are the ownership-language cues recorded during the
// interviews; everything else is summary. n=6 is qualitative depth, not a
// rate — nothing here is a percentage and nothing here is counted into the
// corpus's Opportunity Scores.
//
// NEVER CROSS-TABBED against the App/Play and Reddit themes. Interviewees and
// public reviewers are separate, unlinked populations; a joint table would
// imply a link that does not exist (same rule that governed the survey before
// it was removed, problem_statement.md §15/§18). Convergence between the two
// is reported as narrative corroboration only, which is what `corroborates`
// below is for.

export interface InterviewConcept {
  /** Reaction to the "Decision Assistant" concept. */
  decisionAssistant: string;
  /** Reaction to the "Digital Wardrobe" concept. Omitted where the interview
   * didn't cover it — User 6's synthesis records no reaction, and inventing
   * one to fill the grid would be fabrication. */
  digitalWardrobe?: string;
}

export interface InterviewPersona {
  id: number;
  age: number;
  location: "Metro" | "Tier 2" | "Tier 3";
  spendBand: string;
  /** Self-reported wishlist size, the strongest segmenting variable in this
   * round — see WISHLIST_SIZE_FINDING. */
  wishlistSize: string;
  /** One-line characterisation of what the wishlist is FOR, for this person. */
  wishlistRole: string;
  wishlistDynamic: string;
  behavioralBottleneck: string;
  psychology: string;
  /** Ownership-language fragments recorded in the interview. These are the
   * only verbatim material here; everything else is analyst summary. */
  languageCues: string[];
  concept: InterviewConcept;
  /** Which of the three behavioural clusters this person falls into. */
  cluster: "bookmarker" | "comparer" | "closer";
  /** Where the engine's own corpus independently shows the same behaviour.
   * Narrative corroboration across two separate populations — never a joint
   * count, never a cross-tab. Omitted where there's no honest parallel. */
  corroborates?: string;
}

export const INTERVIEW_META = {
  title: "Decision-Making & Wishlist Behavior",
  subtitle:
    "A qualitative study of online fashion shopping behavior, conversion bottlenecks, choice paralysis, and concept validation across core user segments.",
  n: 6,
  method:
    "Analyst-synthesised persona profiles from a round of user interviews. Quoted fragments are ownership-language cues recorded during the sessions; the rest is summary, not transcript.",
  boundary:
    "Small-n qualitative. Nothing here is a rate, and nothing here feeds the Opportunity Scores. Interviewees and public reviewers are separate, unlinked populations, so these are never cross-tabbed against the App/Play or Reddit themes — where both point the same way, that is reported as corroboration, not as a combined number.",
};

export const EXECUTIVE_SUMMARY = {
  headline:
    "The wishlist is not one feature. It performs a different psychological job depending on who is using it.",
  body:
    "Its role ranges from passive content bookmarking during boredom browsing to a functional holding area for active price comparison. The recurring theme among high-wishlist users is choice overload: saving multiple similar items creates an evaluation feedback loop that frequently ends in session drop-off or leakage to an external platform (Amazon, Google, competitor apps).",
  frictionCenters: [
    {
      label: "Fit confidence",
      note: "a stated need for real customer body-type photos rather than studio model shots",
    },
    {
      label: "Price optimisation",
      note: "waiting for sales, or cross-platform price matching before committing",
    },
    {
      label: "Opinion validation",
      note: "sharing shortlists over WhatsApp to get a trusted second opinion",
    },
  ],
};

/** The clearest segment answer this round produced — and the reason it
 * matters is that Q9 (segment differences) is the question the public-text
 * corpus is worst at, firing on only 10 of 597 records. */
export const WISHLIST_SIZE_FINDING = {
  headline: "Wishlist size behaves like a proxy for intent, not for engagement.",
  detail:
    "Across these six, the size of someone's wishlist tracked inversely with their likelihood of converting from it. The two largest lists (50+ and 30–40 items) belonged to the two people who abandon rather than decide. The two smallest (1–10) belonged to the two who convert reliably. The mid-sized lists (11–25) belonged to the two active comparers who stall in evaluation. A big wishlist reads as accumulated indecision, not as a highly engaged shopper.",
  caution:
    "Six people. This is a hypothesis worth testing at scale, not a measured relationship — and the engine's own corpus cannot check it, because public reviewers almost never state their wishlist size.",
};

export const CLUSTERS = {
  bookmarker: {
    label: "Bookmarkers",
    note: "Large unmanaged lists built during low-intent browsing. Revisiting triggers fatigue, not progress.",
  },
  comparer: {
    label: "Comparers",
    note: "Mid-sized working shortlists. Stall inside an evaluation loop, and leak to other platforms to resolve it.",
  },
  closer: {
    label: "Closers",
    note: "Small curated lists holding genuine intent. Convert on a trigger — a need, a date, or a price drop.",
  },
} as const;

export const INTERVIEWS: InterviewPersona[] = [
  {
    id: 1,
    age: 23,
    location: "Metro",
    spendBand: "₹500–999",
    wishlistSize: "50+ items",
    wishlistRole: "Unmanaged bookmarking repository",
    wishlistDynamic:
      "Saves items primarily during low-intent scrolling triggered by boredom, with no curation pass afterwards.",
    behavioralBottleneck:
      "Re-opening the wishlist triggers decision fatigue, because multiple redundant and similar items have accumulated over time. The result is abandoning the purchase rather than narrowing down the options.",
    psychology:
      "Uses passive ownership language throughout. Does not feel progressively closer to buying when revisiting saved items — revisiting resets rather than advances the decision.",
    languageCues: ["stuff I saved", "that thing I liked"],
    concept: {
      decisionAssistant:
        "Skeptical. Prefers manual browsing unless the tool is genuinely non-intrusive.",
      digitalWardrobe:
        "Strong positive reaction. Interested in social sharing via WhatsApp and style inspiration from trusted peers.",
    },
    cluster: "bookmarker",
    corroborates:
      "The corpus shows the same accumulation problem from the platform side: Reddit users hitting Myntra's own wishlist cap and deleting older saves to make room — a list grown past the point of being usable.",
  },
  {
    id: 2,
    age: 21,
    location: "Tier 2",
    spendBand: "₹1,000–1,999",
    wishlistSize: "11–25 items",
    wishlistRole: "Active shortlist area",
    wishlistDynamic:
      "Used for category-level browsing — collecting options within a category such as ethnic wear, rather than saving one-off items.",
    behavioralBottleneck:
      "Paralysed by choice when several similar options sit in the same category. Constantly cross-checks prices across competing e-commerce platforms and reads external reviews before deciding.",
    psychology:
      "Openly acknowledges taking a long time to decide. Re-opening the wishlist often restarts the entire evaluation loop rather than concluding it.",
    languageCues: ["forever to decide"],
    concept: {
      decisionAssistant:
        "Highly receptive. Wants help narrowing down redundant items, but without losing final autonomy over the choice.",
      digitalWardrobe:
        "Hesitant, citing setup effort and privacy concerns — though curious about crowd-validated picks.",
    },
    cluster: "comparer",
    corroborates:
      "Matches the corpus's strongest Reddit pattern: shoppers re-checking a saved item across days and platforms before committing, with the comparison itself becoming the delay.",
  },
  {
    id: 3,
    age: 25,
    location: "Metro",
    spendBand: "₹2,000–3,999",
    wishlistSize: "1–10 items",
    wishlistRole: "Lean, curated holding zone",
    wishlistDynamic:
      "Holds high-intent purchases that are deferred for a specific reason — timing, or immediate budget — rather than browsing finds.",
    behavioralBottleneck:
      "Minimal indecision. Converts at a high rate once a specific need arises or a price-drop notification fires.",
    psychology:
      "Demonstrates clear intent and high ownership proximity — speaks about saved items as already belonging to them. Re-opening the wishlist leads directly to conversion.",
    languageCues: ["my wishlist", "the jacket I have"],
    concept: {
      decisionAssistant:
        "Indifferent to standard recommendations. Values utility, transparency about charges, and actionable tracking instead.",
      digitalWardrobe:
        "Low interest. Highly protective of personal shopping privacy and avoids overly socialised e-commerce experiences.",
    },
    cluster: "closer",
    corroborates:
      "The price-drop trigger appears repeatedly in the corpus, including a Reddit user who wishlisted sneakers specifically to hold them while waiting for the price to fall.",
  },
  {
    id: 4,
    age: 22,
    location: "Tier 3",
    spendBand: "₹500–999",
    wishlistSize: "11–25 items",
    wishlistRole: "Functional staging ground",
    wishlistDynamic:
      "Saves in order not to lose track of items while continuing to search for a better deal elsewhere.",
    behavioralBottleneck:
      "Cross-platform price comparison leakage. Will abandon the cart immediately if an identical or equivalent item is found cheaper on an alternative platform such as Amazon or Flipkart.",
    psychology:
      "Highly transactional relationship with saved items — describes them as saved, never as owned.",
    languageCues: ["saved it"],
    concept: {
      decisionAssistant:
        "Interested only if it specifically helps aggregate discounts or highlights true value.",
      digitalWardrobe:
        "Low utility unless integrated with immediate price savings or peer discount sharing.",
    },
    cluster: "comparer",
    corroborates:
      "The corpus independently documents this leakage: shoppers checking price-history tools and comparing the same item on Nykaa, Flipkart and Amazon before buying — sometimes buying elsewhere.",
  },
  {
    id: 5,
    age: 27,
    location: "Tier 2",
    spendBand: "₹1,000–1,999",
    wishlistSize: "1–10 items",
    wishlistRole: "Event-driven, tightly curated shortlist",
    wishlistDynamic:
      "Built around a specific upcoming occasion, and regularly cleaned out of items that are no longer relevant.",
    behavioralBottleneck:
      "Lack of visualisation confidence. Cannot assess how a garment's fit and drape translate from professional models to ordinary body types or real-world settings.",
    psychology:
      "High conversion likelihood when a purchase is tied to an upcoming event or occasion — provided visual trust has been established first.",
    languageCues: ["normal body types"],
    concept: {
      decisionAssistant:
        "Very strong interest if focused on visual comparison and building fit and look confidence.",
      digitalWardrobe:
        "Strong positive reaction to WhatsApp sharing with a trusted network (sister, best friend) and to viewing community photos of similar body types.",
    },
    cluster: "closer",
    corroborates:
      "Aligns with the desk research's best-evidenced finding — sizing drives the large majority of fashion returns — and with a corpus workaround where a shopper trusts only reviews carrying real customer photos.",
  },
  {
    id: 6,
    age: 23,
    location: "Tier 2",
    spendBand: "₹500–1,500",
    wishlistSize: "30–40 items",
    wishlistRole: "Unmanaged repository",
    wishlistDynamic:
      "Saves frequently whenever she likes something but isn't ready to buy, with no later cleanup.",
    behavioralBottleneck:
      "Rarely visits the wishlist without an explicit need. When she does, it typically ends in indecision, abandonment, or the feeling of starting the whole decision over because of redundant items.",
    psychology:
      "Passive ownership language, and no sense of being closer to purchase upon revisiting.",
    languageCues: ["things I saved", "stuff in my wishlist", "starting over"],
    concept: {
      decisionAssistant:
        "Receptive — would use it to narrow choices when actively planning to buy, but not while browsing.",
      // No Digital Wardrobe reaction was recorded for this interview.
    },
    cluster: "bookmarker",
    corroborates:
      "The 'starting over' feeling is the clearest human statement of what the corpus only shows indirectly: a saved item that generates no progress toward a decision on return.",
  },
];

export interface InterviewRecommendation {
  id: number;
  title: string;
  detail: string;
  /** Which personas the recommendation was drawn from, where the synthesis
   * named them explicitly. */
  personas?: number[];
}

export const RECOMMENDATIONS: InterviewRecommendation[] = [
  {
    id: 1,
    title: "Wishlist curation & de-duplication mechanics",
    detail:
      "Automatically group similar saved items (for example, \"3 floral midi dresses saved\") with side-by-side spec comparisons — price, material, customer rating, fit feedback — directly inside the wishlist view, to mitigate choice paralysis.",
  },
  {
    id: 2,
    title: "Social validation loops via lightweight sharing",
    detail:
      "Build frictionless, non-public sharing flows — native one-click WhatsApp polls, or dynamic image cards — so users can get quick peer feedback without needing a public profile or a heavy digital-wardrobe setup.",
  },
  {
    id: 3,
    title: "User-generated visual proof integration",
    detail:
      "Prioritise real customer review images over studio model shots directly within wishlist item preview cards, specifically for fit-conscious buyers.",
    personas: [2, 5],
  },
  {
    id: 4,
    title: "Cross-platform retention & price tracking",
    detail:
      "Introduce subtle price-drop alert toggles and clear fee transparency on saved items, to reduce external platform searching and abandonment among price-sensitive cohorts.",
    personas: [3, 4],
  },
];

/** What these interviews add that the public-text corpus structurally cannot.
 * Kept explicit because it's the justification for running them at all. */
export const WHAT_INTERVIEWS_ADD = [
  "Segment attributes. Age, city tier and spend band are stated by every participant. The corpus extracts a segment signal from roughly 10 of 597 records, because public reviewers almost never volunteer who they are — this is the question the engine is worst at, and the only place it gets a real answer.",
  "Wishlist size, and what it predicts. Nobody writes their wishlist count in an App Store review. Here it is stated by all six, and it turns out to track with conversion behaviour more cleanly than any demographic does.",
  "Why people save in the first place. The corpus's save-motivation field fires on a handful of records, because reviews are written after the decision is over. An interview can simply ask.",
  "Reaction to concepts that do not exist yet. No amount of public text can tell you how someone would respond to a proposed feature. Both concepts were tested here, and both drew genuinely split reactions rather than uniform enthusiasm.",
];
