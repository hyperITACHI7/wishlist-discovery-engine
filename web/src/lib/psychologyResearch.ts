// Desk research grounding the project in named psychological mechanisms.
//
// PROVENANCE: structured from `vault/09-Assignment/10-Psychology-Research.md`,
// which stays the narrative source of truth. This file is the dashboard's
// representation of it — same claims, same numbers, same sources, reshaped so
// both the Research tab and the chatbot's grounding context read from ONE
// place rather than drifting apart. If the vault doc changes materially,
// update here too.
//
// CRITICAL BOUNDARY, enforced in the UI copy and in the chatbot prompt: this
// is EXTERNAL LITERATURE, not this engine's own corpus findings. It is mostly
// Western-market academic work applied to an Indian fashion context. It can
// corroborate, contradict, or contextualise what the engine found — it can
// never stand in as evidence *from* the engine, and the two must never be
// presented as one body of evidence.

export interface ResearchSource {
  title: string;
  url: string;
  kind: "academic" | "industry";
}

export interface ResearchFinding {
  /** The claim in one line — what a reader takes away if they read nothing else. */
  claim: string;
  /** The supporting detail, mechanism, or number. */
  detail: string;
  /** A headline statistic, when the finding rests on one. */
  stat?: string;
}

export interface ResearchQuestion {
  id: number;
  question: string;
  /** One-sentence answer, for scanning. */
  shortAnswer: string;
  /** Named psychological mechanisms at work — the reason this is research and
   * not just opinion. */
  mechanisms: string[];
  findings: ResearchFinding[];
  /** What it means for this project specifically. */
  implication: string;
  /** Where the engine's own corpus can check this claim, when it can. */
  enginesLink?: string;
  sources: ResearchSource[];
}

const S = {
  heartCart: {
    title: '"Heart it or cart it": the mere placement effect and purchase likelihood',
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0969698926001013",
    kind: "academic",
  } as ResearchSource,
  ironicDelay: {
    title: "The Desire to Acquire Wish List Items: The Ironic Effect of Choosing to Delay Aspirational Purchases",
    url: "https://www.researchgate.net/publication/312057422_The_Desire_to_Acquire_Wish_List_Items_the_Ironic_Effect_of_Choosing_to_Delay_Aspirational_Purchases",
    kind: "academic",
  } as ResearchSource,
  psychSafety: {
    title: "Analysis of Online Shoppers' Wish List and the Emergence of Psychological Safety",
    url: "https://www.researchgate.net/publication/348110114_Analysis_of_Online_Shoppers'_Wish_List_and_the_emergence_of_Psychological_Safety_as_a_Salient_Factor_in_Online_Shopping_Intentions",
    kind: "academic",
  } as ResearchSource,
  endowment: {
    title: "Endowment effect — overview and primary literature",
    url: "https://en.wikipedia.org/wiki/Endowment_effect",
    kind: "academic",
  } as ResearchSource,
  cartComposition: {
    title: "Effect of Online Cart Composition on Cart Abandonment",
    url: "https://academic.oup.com/jcr/advance-article/doi/10.1093/jcr/ucag002/8460775",
    kind: "academic",
  } as ResearchSource,
  deferral: {
    title: "A vignette study of option refusal and decision deferral",
    url: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0241182",
    kind: "academic",
  } as ResearchSource,
  statusQuo: {
    title: "Status quo bias in decision making",
    url: "https://link.springer.com/article/10.1007/BF00055564",
    kind: "academic",
  } as ResearchSource,
  hyperbolic: {
    title: "Hyperbolic discounting",
    url: "https://thedecisionlab.com/biases/hyperbolic-discounting",
    kind: "academic",
  } as ResearchSource,
  fakeReviewCues: {
    title: "Suspicion of online product reviews as fake: cues and consequences",
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0148296323001388",
    kind: "academic",
  } as ResearchSource,
  goalGradient: {
    title: "The Goal-Gradient Hypothesis Resurrected",
    url: "https://www.columbia.edu/~rk566/Session4/Goal-Gradient_Illusionary_Goal_Progress.pdf",
    kind: "academic",
  } as ResearchSource,
  jamStudy: {
    title: "The Jam Study and Choice Overload: When Moderators Matter More Than the Main Effect",
    url: "https://atticusli.com/replication-crisis/choice-overload-jam-study/",
    kind: "academic",
  } as ResearchSource,
  betterTest: {
    title: "A Better Test of Choice Overload",
    url: "https://arxiv.org/pdf/2212.03931",
    kind: "academic",
  } as ResearchSource,
  giftChoice: {
    title: "Giving pleasure or avoiding risk: how social closeness shapes givers' gift choice",
    url: "https://www.emerald.com/apjml/article-abstract/37/10/3058/1252377/",
    kind: "academic",
  } as ResearchSource,
  sizeFinders: {
    title: "Fits like a glove? Knowledge and use of size finders and high-end fashion retail returns",
    url: "https://www.sciencedirect.com/science/article/pii/S2444569X25001246",
    kind: "academic",
  } as ResearchSource,
  mdpiTrust: {
    title: "Influence of Consumer Trust, Return Policy, and Risk Perception on Satisfaction",
    url: "https://www.mdpi.com/2079-8954/13/3/158",
    kind: "academic",
  } as ResearchSource,

  shopCircle: {
    title: "Why Shoppers Save to Wishlists but Never Buy (2026 Guide)",
    url: "https://shopcircle.co/blogs/news/why-people-add-to-wishlist-never-purchase",
    kind: "industry",
  } as ResearchSource,
  nng: {
    title: "Wishlist or shopping cart? Saving products for later in ecommerce",
    url: "https://www.nngroup.com/articles/wishlist-or-cart/",
    kind: "industry",
  } as ResearchSource,
  baymard: {
    title: "Cart Abandonment Statistics 2026",
    url: "https://baymard.com/lists/cart-abandonment-rate",
    kind: "industry",
  } as ResearchSource,
  returnRates: {
    title: "Apparel return rates: the stats retailers cannot ignore",
    url: "https://3dlook.ai/content-hub/apparel-return-rates-the-stats-retailers-cannot-ignore/",
    kind: "industry",
  } as ResearchSource,
  trueFit: {
    title: "Why your ecommerce return rate won't budge",
    url: "https://www.truefit.com/post/why-ecommerce-return-rate-wont-budge",
    kind: "industry",
  } as ResearchSource,
  lastMile: {
    title: "The consumer psychology of last-mile delivery: why reliability beats speed",
    url: "https://www.retailcustomerexperience.com/blogs/the-consumer-psychology-of-last-mile-delivery-why-reliability-beats-speed/",
    kind: "industry",
  } as ResearchSource,
  tier23: {
    title: "Tier-2 & Tier-3 City Fashion E-Commerce India 2026",
    url: "https://www.firstresort.in/blogs/research/tier-2-tier-3-city-fashion-ecommerce-india-2026",
    kind: "industry",
  } as ResearchSource,
  forrester: {
    title: "Women and mobile shoppers in Tier 2 & 3 cities are driving India's online retail market",
    url: "https://www.forrester.com/blogs/14-11-24-women_and_mobile_shoppers_in_tier_2_3_cities_are_driving_indias_online_retail_market/",
    kind: "industry",
  } as ResearchSource,
  yougov: {
    title: "70% of US special occasion shoppers say price drives purchases",
    url: "https://yougov.com/en-us/articles/52003-70-of-us-special-occasion-shoppers-say-price-drives-special-occasion-purchases",
    kind: "industry",
  } as ResearchSource,
  fusionCx: {
    title: "Fashion Customer Journey: From Fit Anxiety to Loyalty",
    url: "https://www.fusioncx.com/blog/retail/fashion-apparel/fashion-customer-journey-special-occasion-apparel/",
    kind: "industry",
  } as ResearchSource,
  shopeeUx: {
    title: "How to Improve the Experience of the Wishlist Feature — Shopee UX case study",
    url: "https://medium.com/@fadhil.ibrhm12/how-to-improve-the-experience-of-wishlist-feature-in-e-commerce-app-shopee-ux-case-study-eaa0e97ffca1",
    kind: "industry",
  } as ResearchSource,
  plussTrust: {
    title: "What Customer Reviews Reveal About Trust in Online Apparel",
    url: "https://pluss.in/blogs/inclusive-fashion-news/what-customer-reviews-reveal-about-trust-in-online-apparel",
    kind: "industry",
  } as ResearchSource,
  eshopbox: {
    title: "7 major problems faced by ecommerce fashion brands",
    url: "https://www.eshopbox.com/blog/problems-faced-by-ecommerce-fashion-brands",
    kind: "industry",
  } as ResearchSource,
  powerReviews: {
    title: "Survey: How Fake Reviews Destroy Consumer Trust",
    url: "https://www.powerreviews.com/how-fake-reviews-destroy-consumer-trust/",
    kind: "industry",
  } as ResearchSource,
  psychToday: {
    title: "What's Behind the Fake Review",
    url: "https://www.psychologytoday.com/us/blog/the-mechanisms-behind-our-behaviors/202603/whats-behind-the-fake-review",
    kind: "industry",
  } as ResearchSource,
  decisionFatigue: {
    title: "Fashion Planning: Beat Decision Fatigue & Style Stress",
    url: "https://glance.com/blogs/glanceai/fashion/decision-fatigue-fashion-planning-outfit-mental-health",
    kind: "industry",
  } as ResearchSource,
  capsule: {
    title: "Capsule Wardrobe Explained",
    url: "https://glance.com/us/blogs/glanceai/fashion/ultimate-guide-capsule-wardrobe",
    kind: "industry",
  } as ResearchSource,
  trustpilot: {
    title: "Myntra / Nykaa reviews on Trustpilot",
    url: "https://ca.trustpilot.com/review/www.myntra.com",
    kind: "industry",
  } as ResearchSource,
};

export const RESEARCH_INTRO = {
  title: "Psychology research — 14 questions",
  blurb:
    "Desk research grounding the project in named psychological mechanisms rather than intuition. Each answer states the finding, the mechanism behind it, and what it implies for this project.",
  caveat:
    "This is desk research — directional, and mostly Western-market academic literature applied to an Indian fashion context. It is external literature, NOT this engine's own corpus findings, and the two are never pooled. It corroborates or challenges what the engine found; it never stands in as evidence from it. Nothing here substitutes for the interviews.",
};

export const RESEARCH_QUESTIONS: ResearchQuestion[] = [
  {
    id: 1,
    question: "Why do users add to wishlist?",
    shortAnswer:
      "Not one reason but a cluster of distinct psychological jobs — and conflating them is the most common analysis error in this space.",
    mechanisms: ["Endowment effect", "Mere placement effect", "Ironic delay effect", "Psychological safety"],
    findings: [
      {
        claim: "Memory / retrieval insurance",
        detail: "The plainest motive: don't lose the product. Cheapest to satisfy, least interesting to design for.",
      },
      {
        claim: "Psychological safety, not urgency-avoidance",
        detail:
          "Wishlisting lets a shopper deliberate without transactional pressure. Psychological safety (friendly returns, no-pressure saving) correlates strongly with purchase intention in its own right.",
      },
      {
        claim: "Endowment effect, pre-purchase — the mechanism worth building around",
        detail:
          "Saving an item triggers a sense of ownership before any money changes hands. The longer it sits saved, the more it enters the user's mental inventory, and removing it starts to feel like a loss rather than a non-purchase.",
      },
      {
        claim: "The mere placement effect — directly on point",
        detail:
          "Wishlist-placed items start out LESS likely to be purchased than cart-placed items, but that likelihood rises over time while cart-item likelihood stays flat — because wishlisting triggers procrastination without decision closure, keeping the choice cognitively open rather than closed.",
        stat: "Wishlist purchase likelihood rises over time; cart likelihood stays flat",
      },
      {
        claim: "The ironic delay effect",
        detail:
          "Deliberately delaying purchase of a wanted item — wishlisting instead of buying — can increase desire for it rather than dampen it. Aspiration compounds while parked.",
      },
    ],
    implication:
      "The wishlist is not a failed cart. It is a working psychological state with its own dynamics: rising latent intent, compounding aspiration, and a felt sense of loss on removal. Design should work with that state — surface it at the right moment — rather than treat it as inventory to be cleared.",
    enginesLink:
      "The engine's own save_motivation field fired on only 1 of 578 records, so it cannot confirm or deny any of this — people don't narrate why they saved something. This is exactly the gap the interviews target.",
    sources: [S.heartCart, S.ironicDelay, S.psychSafety, S.endowment, S.nng, S.shopCircle],
  },
  {
    id: 2,
    question: "How do users compare shortlisted items?",
    shortAnswer:
      "Multi-attribute comparison is the norm, and it happens ambiently across whatever was seen alongside the target item — not inside a formal compare feature.",
    mechanisms: ["Anchoring bias", "Co-visitation effects"],
    findings: [
      {
        claim: "Multi-attribute comparison is the norm, not the exception",
        detail:
          "In competitive online categories, shoppers routinely weigh several options across several attributes. The fashion equivalent is comparing across saved items and open tabs, not a single deliberation.",
        stat: "72% considered 2+ options; 57% checked 5+ sites (phone purchase)",
      },
      {
        claim: "Co-visitation shapes the decision heavily",
        detail:
          "Comparison isn't confined to a formal compare feature — it happens across whatever was viewed alongside the target item.",
        stat: "~85% report other viewed products influencing their eventual choice",
      },
      {
        claim: "Anchoring",
        detail:
          "Whichever item a shopper opens first sets the reference point everything else is judged against — price, fit, styling all relative to that first anchor, not absolute.",
      },
      {
        claim: "Structured comparison tools measurably help",
        detail:
          "Comparison tables increase the share of genuinely non-dominated options considered — they reduce bad picks, not just speed up the choice.",
      },
      {
        claim: "The decision stays fragile until checkout completes",
        detail:
          "A late-arriving negative review or a lower price spotted elsewhere can derail an otherwise-settled comparison at the last step.",
      },
    ],
    implication:
      "The psychology supports building a comparison feature — but the design goal should be reducing anchor bias and surfacing non-dominated options, not just laying out a spec table. A plain side-by-side without interpretation risks reinforcing whichever item the user opened first rather than correcting for it.",
    enginesLink:
      "comparison_behavior was captured in only 5 of 578 records — the engine flags this question Weak and routes it to interviews, exactly as the routing table predicted.",
    sources: [S.cartComposition, S.goalGradient, S.nng],
  },
  {
    id: 3,
    question: "What blocks purchase from wishlists?",
    shortAnswer:
      "The best-documented question in this set. The load-bearing fact is that a large share of abandoners were never trying to buy at all.",
    mechanisms: ["Intent heterogeneity", "Perceived deception (cost shock)"],
    findings: [
      {
        claim: "Cart abandonment sets the baseline",
        detail: "The adjacent cart-abandonment literature is the closest well-measured proxy for wishlist non-conversion.",
        stat: "~70% abandonment industry-wide; ~80% on mobile",
      },
      {
        claim: "The intent split is the load-bearing fact",
        detail:
          "Roughly 43% of cart/wishlist abandoners were never trying to buy on that visit — they were browsing, comparing, or parking for later. This is the empirical backbone of any intent pre-filter.",
        stat: "~43% had no purchase intent on that visit",
      },
      {
        claim: "Of the remainder, cost shock dominates — and reads as deception",
        detail:
          "Unexpected shipping, tax, or fees are the top blocker among genuine near-converters. The psychological response is disproportionate to the actual sum, because it registers as being tricked rather than merely as cost.",
        stat: "~48% cite unexpected extra costs",
      },
      {
        claim: "Checkout friction compounds",
        detail: "Forced account creation and long checkout flows are secondary but real.",
        stat: "~19% forced account creation; ~18% long checkout",
      },
    ],
    implication:
      "\"Unexpected cost at checkout\" is a distinct failure mode from affordability — it is a trust/transparency failure that happens to be denominated in money. Worth checking whether App/Play Store hesitation language distinguishes \"too expensive\" from \"felt tricked by the total.\"",
    enginesLink:
      "The engine ranks Price and value perception top by Opportunity Score — but its addressability is capped, because this project may not use monetary levers. The literature's cost-shock finding suggests part of that theme may actually be a transparency problem, which would be addressable without touching price.",
    sources: [S.baymard, S.cartComposition, S.shopCircle],
  },
  {
    id: 4,
    question: "How do behaviours differ across segments?",
    shortAnswer:
      "Behavioural segmentation explains more than demographics — and the easy assumption that Tier 2/3 India is simply price-sensitive is contradicted by the data.",
    mechanisms: ["Behavioural segmentation", "Identity-embedded consumption"],
    findings: [
      {
        claim: "A five-way behavioural segmentation recurs in the literature",
        detail:
          "Quality-conscious, fashion-conscious, brand-conscious, impulsive, and uninterested shoppers. This maps more usefully onto product decisions than age or gender alone.",
      },
      {
        claim: "Gender shapes shopping style measurably",
        detail:
          "Per Indian-market studies specifically — though the mechanism (risk tolerance, social shopping behaviour, browsing patience) matters more for product design than the demographic label itself.",
      },
      {
        claim: "Tier 2/3 India is not simply price-sensitive",
        detail:
          "Contrary to the stereotype, these shoppers are growing at twice the national rate and driving up basket value. Mobile-first, socially and identity-embedded shopping (belonging, not individualism) is a more useful differentiator than an income proxy.",
        stat: "2× national growth rate; 65% of festive 2025 orders; ~55% of India's new luxury shoppers",
      },
    ],
    implication:
      "City tier and gender are worth keeping as optional segmentation fields, but funnel-position segmentation plus the behavioural cluster above will likely explain more variance than raw demographics. Don't over-index on age/city findings from a personal-network sample.",
    enginesLink:
      "segment_signal fired on only 10 of 578 records — public text almost never states demographics. Q9 is Weak for exactly this reason, and with no survey in the project it now rests entirely on the interviews.",
    sources: [S.tier23, S.forrester, S.giftChoice],
  },
  {
    id: 5,
    question: "What causes users to postpone a purchase?",
    shortAnswer:
      "Three named biases converge — and reconciling two that look contradictory is the interesting part.",
    mechanisms: ["Status quo bias", "Loss aversion", "Present bias / hyperbolic discounting", "Decision avoidance"],
    findings: [
      {
        claim: "Status quo bias / decision avoidance",
        detail:
          "People have an inflated preference for the current state of affairs — and for a wishlist, the current state IS not-yet-bought. Decision-avoidance research treats choice deferral as a first-class category, distinct from actively rejecting an option.",
      },
      {
        claim: "Loss aversion cuts against buying, not toward it",
        detail:
          "The pain of a bad purchase (money lost, wrong choice, regret) looms larger than the pleasure of a good one, so an uncertain decision defaults to inaction.",
      },
      {
        claim: "Present bias — and the resolution of the apparent contradiction",
        detail:
          "Hyperbolic discounting says people over-weight immediate reward, yet wishlisting is itself an act of choosing to delay. The resolution: present bias explains the INITIAL save (defer the cost, keep the immediate pleasure of having claimed it). It does not explain why the delay then persists for weeks — that is status quo bias and decision avoidance taking over once the first deferral has happened.",
      },
    ],
    implication:
      "Postponement isn't one thing with one fix. The save is driven by present-bias-plus-endowment; the ongoing non-purchase is driven by status-quo inertia and loss-averse uncertainty. A resurfacing nudge addresses the first; a confidence-building intervention addresses the second. Which one a solution targets should be an explicit choice, not an accident.",
    enginesLink:
      "delay/deferral signal appeared in 9 of 578 records — thin, because retrospective reviews are written after the delay has already resolved.",
    sources: [S.statusQuo, S.deferral, S.hyperbolic, S.endowment],
  },
  {
    id: 6,
    question: "What information do users seek outside the app?",
    shortAnswer:
      "Webrooming is close to universal — and it signals engagement, not disloyalty.",
    mechanisms: ["Webrooming", "Information-gathering confidence"],
    findings: [
      {
        claim: "Webrooming is near-universal, not a fringe behaviour",
        detail: "Researching online before an offline or cross-platform purchase is standard practice.",
        stat: "81% research online before an offline purchase; 88% consider it essential",
      },
      {
        claim: "Showrooming runs lower",
        detail: "Seeing in-store then buying online is common but less so than the reverse.",
        stat: "~60%",
      },
      {
        claim: "Webroomers are measurably more confident and attribute-focused",
        detail:
          "They read reviews, compare prices, and gather full information before committing — a more deliberate shopper, not a less loyal one.",
      },
    ],
    implication:
      "Off-platform checking is evidence of engagement, not leakage to fight. The better read is that in-app information (fit confidence, styling context, trust signals) is currently insufficient to close the loop without an external check — which is itself a finding about the predictability and trust gates.",
    enginesLink:
      "offsite_research fired on just 3 of 578 records — far below the near-universal rate the literature reports. The likeliest read is a text-availability problem rather than a behaviour-rarity one: people simply don't mention cross-checking in a store review. The interviews ask about it directly to test that.",
    sources: [S.shopCircle, S.plussTrust, S.nng],
  },
  {
    id: 7,
    question: "What unmet needs emerge consistently?",
    shortAnswer:
      "Wishlist organisation is explicitly and repeatedly requested; styling help is wanted but trust-gated.",
    mechanisms: ["Trust calibration", "Relevance / personalisation"],
    findings: [
      {
        claim: "Wishlist organisation is explicitly, repeatedly requested",
        detail:
          "Messy, uncategorised wishlists and the absence of auto-removal for out-of-stock items are named directly as user complaints in UX case studies.",
      },
      {
        claim: "Styling / outfit-matching help is wanted but trust-gated",
        detail:
          "Users want AI styling, but a single mismatched recommendation erodes trust fast. The bar isn't \"helpful sometimes\" — it's \"rarely visibly wrong.\"",
      },
      {
        claim: "Wardrobe-aware recommendations, not generic ones",
        detail: "Advice divorced from what the user already owns reads as generic and gets ignored.",
      },
    ],
    implication:
      "If an AI shortlist or styling feature is built, the literature suggests its success depends less on model sophistication and more on explainability and a low visible-error-rate.",
    enginesLink:
      "The engine independently surfaced \"Wishlist capacity limit\" as an emergent theme from Reddit — corroborating the organisation complaint from a completely different source type.",
    sources: [S.shopeeUx, S.nng, S.eshopbox],
  },
  {
    id: 8,
    question: "What drives product quality concerns?",
    shortAnswer:
      "Three currently-conflatable things with three different owners: material defects, damage in transit, and description mismatch.",
    mechanisms: ["Expectation disconfirmation"],
    findings: [
      {
        claim: "India-specific complaint data is consistent",
        detail:
          "Wrong product delivered and below-par quality are the leading garment grievances; fabric-durability complaints (\"feels cheap\", \"shrinks after wash\") recur in review content separately from sizing.",
      },
      {
        claim: "Damaged goods drive a large share of returns",
        detail:
          "Packaging and logistics quality bleed into \"product quality\" perception even when the item itself was fine.",
        stat: "80%+ of returns in certain categories",
      },
      {
        claim: "Description-mismatch is its own category",
        detail:
          "Distinct from both fit and objective quality: the item had no defect, but didn't match what the photos or copy implied.",
      },
    ],
    implication:
      "Extraction should be able to distinguish genuine material defects, damage-in-transit, and description mismatch. These point to different owners (manufacturing, logistics, content) and different fixes, even though a naive read lumps them all together as \"quality complaints.\"",
    enginesLink:
      "Product quality concerns is the engine's #2 theme by Opportunity Score (21 records) — but it currently conflates exactly these three sub-causes, which is a concrete improvement the next extraction pass could make.",
    sources: [S.eshopbox, S.trustpilot, S.plussTrust],
  },
  {
    id: 9,
    question: "How much do fit and comfort matter?",
    shortAnswer:
      "The single best-evidenced topic in this set — worth treating as near-fact rather than hypothesis.",
    mechanisms: ["Uncertainty avoidance", "Post-purchase anxiety", "Vanity sizing / identity"],
    findings: [
      {
        claim: "Sizing is the dominant return driver, not one factor among several",
        detail: "Apparel return rates run 20–40% in Western markets and 25–40% in India, spiking further during sales.",
        stat: "77% of fashion returns attributed to sizing",
      },
      {
        claim: "Bracketing is a named, measured behaviour",
        detail:
          "Shoppers deliberately order multiple sizes intending to return most. It's a rational response to sizing uncertainty, not carelessness — and expensive for the platform regardless of fault.",
        stat: "~15% of all returns traced to bracketing at one retailer",
      },
      {
        claim: "Post-purchase anxiety is near-universal",
        detail:
          "The return policy functions as a PRE-purchase confidence mechanism, not just a post-purchase remedy — people check it to secure an exit route before committing.",
        stat: "~2/3 report post-purchase anxiety; ~90% check the return policy before buying",
      },
      {
        claim: "Vanity sizing adds an identity dimension",
        detail:
          "Inconsistent size labels across brands don't just create logistical friction — for body-image-sensitive shoppers they carry emotional weight beyond the practical inconvenience.",
      },
    ],
    implication:
      "Myntra already ships AI size prediction, Shape ID and body profiles addressing FIRST-VIEW fit uncertainty. None of this literature contradicts that — it confirms fit dominates the category generally, which raises the stakes on the real question: does confidence decay by the RETURN visit, after the first-view tools already did their job once?",
    enginesLink:
      "Fit and comfort ranks #3 in the engine (13 records, HIGH VOLUME) — present and real, but at a far lower rate than the 77%-of-returns literature would predict, because App/Play reviews are written by people who already resolved the uncertainty.",
    sources: [S.returnRates, S.trueFit, S.sizeFinders, S.mdpiTrust],
  },
  {
    id: 10,
    question: "How much does service reliability matter?",
    shortAnswer:
      "The market shifted from speed to reliability as the primary trust lever — and in India, transparency is the named weak point.",
    mechanisms: ["Trust signalling", "Risk perception vs satisfaction"],
    findings: [
      {
        claim: "Reliability replaced speed as the top priority",
        detail:
          "Delivery speed was the top consumer priority in 2022; by 2024 it had fallen to fifth, replaced by predictability and honest communication about delays. A genuine trend, not a stable preference.",
        stat: "Speed: #1 in 2022 → #5 by 2024",
      },
      {
        claim: "Reliability functions as a general trust signal",
        detail:
          "Sites perceived as reliable see measurably higher purchase rates independent of the specific transaction.",
      },
      {
        claim: "Return-policy leniency helps satisfaction but not perceived risk",
        detail:
          "A subtle but real distinction: a generous return policy makes people feel better about a PLATFORM, but doesn't make them feel more certain about a SPECIFIC ITEM — a separate problem a return policy alone can't solve.",
      },
      {
        claim: "India-specific: transparency is the weak point",
        detail:
          "Customers report not knowing where a package is or what went wrong more than they report slow delivery per se.",
      },
    ],
    implication:
      "Service reliability sits partly inside trust and partly outside the wishlist-decision problem entirely — it can be a platform-level operational issue a decision-layer product cannot fix. Worth naming as an out-of-scope root cause if the engine surfaces it heavily.",
    enginesLink:
      "Service reliability ranks #4 in the engine (11 records, HIGH INTENT) — a good example of the honesty principle: the engine surfaces it, but a wishlist-decision layer isn't the thing that fixes it.",
    sources: [S.lastMile, S.mdpiTrust, S.trustpilot],
  },
  {
    id: 11,
    question: "How does styling versatility affect the decision?",
    shortAnswer:
      "People aren't buying the object — they're buying a projected relationship with it.",
    mechanisms: ["Decision fatigue", "Mental simulation / projected self"],
    findings: [
      {
        claim: "Decision fatigue is the operative mechanism",
        detail:
          "Reducing visual complexity measurably eases decisions. The capsule-wardrobe literature treats \"fewer, more versatile pieces\" explicitly as a decision-fatigue-reduction strategy, not merely an aesthetic choice.",
      },
      {
        claim: "\"Will this go with anything I own?\" is a named, common failure point",
        detail:
          "Distinct from fit or trust. Outfit uncertainty escalates from ordinary preparation into genuine paralysis, with defaulting to safe choices and last-minute regret as observed symptoms.",
      },
      {
        claim: "Purchases are decisions about an imagined future scene",
        detail:
          "Fashion decisions are about a brief imagined scene — an occasion, an outfit, a version of oneself — not the garment as a standalone object. That framing sharpens why styling uncertainty blocks purchase even when fit and trust are both already resolved.",
      },
    ],
    implication:
      "\"Too many similar items\" (choice overload) and \"can't picture how this fits my existing wardrobe/life\" (styling versatility) are different cognitive operations. Worth keeping them distinguishable in synthesis rather than collapsing into one bucket.",
    enginesLink:
      "Styling versatility appears in 22.2% of Reddit records but 0% of App/Play — the sharpest lens asymmetry in the whole corpus, and exactly what this mechanism predicts: it's narrated while still deciding, not after buying.",
    sources: [S.decisionFatigue, S.capsule, S.nng],
  },
  {
    id: 12,
    question: "How much do users trust reviews?",
    shortAnswer:
      "Truth bias is strong and specific — people default to believing reviews are genuine even when explicitly warned they aren't.",
    mechanisms: ["Truth bias", "Heuristic processing", "Negativity bias"],
    findings: [
      {
        claim: "Reviews function as a heuristic shortcut, not read as data",
        detail:
          "Shoppers rely on surface cues — rating average, review count, presence of photos, \"feels real\" — rather than genuinely evaluating claims. Faster cognitive processing, not unreliable shortcuts per se.",
      },
      {
        claim: "Truth bias persists even after explicit warning",
        detail:
          "In one study, even after being told half the reviews shown were fabricated, participants still classified most as real. This cuts against the intuition that fake-review awareness protects buyer trust.",
      },
      {
        claim: "Negative reviews are trusted more than positive ones",
        detail: "A systematically useful asymmetry — negative signal reads as more credible.",
      },
      {
        claim: "Awareness is rising even as behaviour doesn't adjust",
        detail: "Concern about fake reviews is widespread, yet the truth-bias finding shows it doesn't translate into detection.",
        stat: "81% concerned about fake reviews; 90% believe they've encountered one",
      },
      {
        claim: "Counterintuitive: showing unflattering content increases trust",
        detail:
          "Platforms that visibly display some negative or flagged content are trusted MORE, not less.",
        stat: "80% say a platform showing unflattering reviews increases their trust in the review system",
      },
    ],
    implication:
      "The last finding is directly relevant to this dashboard's own design principle of showing low-confidence extractions honestly — the same logic that makes an honest review platform more credible makes an honest discovery engine more credible.",
    enginesLink:
      "Review trustworthiness is an engine theme (2 Reddit records, HIGH INTENT) with a real stated workaround: sorting reviews by newest and only trusting ones with customer photos — a shopper manually correcting for exactly the heuristic weakness this literature describes.",
    sources: [S.fakeReviewCues, S.powerReviews, S.psychToday, S.plussTrust],
  },
  {
    id: 13,
    question: "How does occasion relevance change the decision?",
    shortAnswer:
      "Occasion isn't only \"waiting for a date\" — it's a stakes multiplier that amplifies every other uncertainty.",
    mechanisms: ["Stakes amplification", "Deadline-bound risk"],
    findings: [
      {
        claim: "Price is the stated top driver for special-occasion purchases — with a caveat",
        detail:
          "Stated price-sensitivity in a survey and revealed willingness-to-pay under real emotional stakes often diverge. Treat this as directional, not literal.",
        stat: "~70% in one large survey",
      },
      {
        claim: "Occasion apparel carries disproportionate emotional weight",
        detail:
          "Buyers show markedly lower tolerance for uncertainty than in ordinary purchases. A sizing mistake or shipping delay lands as a much bigger deal than the objective inconvenience suggests, because the cost of getting it wrong is social and time-bound — the event happens regardless.",
      },
      {
        claim: "The implied fix is deadline-specific confidence infrastructure",
        detail:
          "Event timeline visibility, alteration options, and fit guidance oriented around \"will this be right by [date]\" — not general reassurance.",
      },
    ],
    implication:
      "Occasion should be modelled as a multiplier on predictability and trust for date-bound items, not only as its own independent gate. Worth testing whether occasion-driven saves show measurably higher hesitation-language rates than non-occasion saves.",
    enginesLink:
      "Occasion relevance is an engine theme (3 Reddit records, HIGH INTENT) — present but too thin to test the stakes-multiplier hypothesis. An interview question could.",
    sources: [S.yougov, S.fusionCx, S.mdpiTrust],
  },
  {
    id: 14,
    question: "When does a wishlist start feeling like clutter?",
    shortAnswer:
      "Honest finding: no research gives a specific item-count threshold. This is a genuine gap in the public literature, not a search failure.",
    mechanisms: ["Choice overload", "Moderated overload effects"],
    findings: [
      {
        claim: "No source quantifies a wishlist clutter threshold",
        detail:
          "UX case studies confirm the SYMPTOM — users want auto-removal of out-of-stock items and better organisation once lists get messy — but never quantify the number that triggers it.",
      },
      {
        claim: "The adjacent choice-overload literature offers a proxy, with real caveats",
        detail:
          "The classic jam study found a 24-item display converted far worse than a 6-item one. But a 99-study meta-analysis complicates the simple \"fewer is always better\" reading.",
        stat: "Jam study: 24 items vs 6 items",
      },
      {
        claim: "Overload effects are moderated, not universal",
        detail:
          "The effect appears specifically when the decision must be made quickly, options are hard to compare, the choice is high-stakes, or the chooser is already uncertain about preferences — not as a general law. Separately, one study found 12 options were perceived as subjectively optimal.",
        stat: "12 options perceived as subjectively optimal",
      },
      {
        claim: "Applying the proxy cautiously argues AGAINST a jam-sized number",
        detail:
          "A wishlist is browsed at leisure (no time pressure) and revisited repeatedly (not one-shot) — exactly the conditions under which the meta-analysis says overload effects weaken. So a wishlist may tolerate a higher item count than a jam shelf would.",
      },
    ],
    implication:
      "The literature can bound expectations — probably higher than 6, plausibly in a \"dozens\" range if the 12-option optimum generalises at all — but it genuinely cannot supply the number. Do not cite a specific threshold without primary research to back it.",
    enginesLink:
      "The engine found a real, concrete answer the literature couldn't: Reddit users hitting Myntra's own 1,000-item wishlist cap and deleting older items to make room. That's a hard platform limit, not a psychological threshold — a different question than the one the literature fails to answer, and worth not confusing with it.",
    sources: [S.jamStudy, S.betterTest, S.shopeeUx, S.nng],
  },
];

/** What this research changes in the plan — the cross-cutting conclusions. */
export const RESEARCH_IMPLICATIONS = [
  "Asking \"why didn't you buy this?\" risks measuring accumulated aspiration rather than the original blocker — Q1's ironic-delay and endowment findings predict a saved item's felt importance GROWS with time even without action. Interview questions should anchor on a specific remembered moment, not a general feeling.",
  "\"Unexpected cost at checkout\" is a candidate blocker that a price/affordability bucket doesn't cleanly cover — it's a trust and transparency failure that happens to be denominated in money.",
  "Occasion should be modelled as a multiplier on predictability and trust for date-bound items, not only as its own independent category.",
  "The wishlist capacity question stays open until primary data returns. The literature explicitly does not support citing a specific number.",
];

export const ALL_RESEARCH_SOURCES: ResearchSource[] = Object.values(S);
