// Groq client + source-conditional extraction prompt.
// Schema, lens split, and "omit keys with no evidence" rule are locked
// decisions — see problem_statement.md §6.

import { Lens } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Larger model for the live single-item demo box, per problem_statement.md §10
// ("either model works given Groq's speed; default to the larger one").
// Groq's catalog turns over — llama-3.3-70b-versatile was fully retired
// (404) as of 2026-08-18. Keep this in sync with pipeline/config.py's
// GROQ_MODEL_SYNTHESIS, and note a 403 "blocked at the project level" means
// the key works but the model needs enabling at
// console.groq.com/settings/project/limits.
const GROQ_MODEL = "openai/gpt-oss-120b";

const CORE_FIELDS = `
- product_category: one of "apparel" | "footwear" | "beauty" | "accessories" | "unclear"
- intent_signal: one of "buy-intent" | "save-for-later" | "not-determinable". This MUST be a literal, observable call, not a guess.
- intent_evidence: the exact quote fragment that justifies intent_signal. Required whenever intent_signal is not "not-determinable"; omit the key otherwise.
- segment_signal: a short freeform phrase capturing any stated user attribute (age, location, shopper type) — omit the key if nothing is stated.
- decision_factors: array of factors this specific person raised themselves (do not supply your own list, only what is textually present).
- confidence: "low" | "medium" | "high" — your confidence in this extraction overall.
- save_motivation: why they saved/shortlisted the item, if stated — omit if absent.
- comparison_behavior: how they narrowed between options, if stated — omit if absent.
- offsite_research: what they checked outside Myntra and where, if stated — omit if absent.
- workaround: what they did instead of the "ideal" resolution, if stated — omit if absent.`;

const RETROSPECTIVE_ONLY = `
- hesitation_signal: any trace of delay, doubt, comparison, or size-bracketing before this purchase — omit if absent.
- delay_signal: any explicit time gap ("finally", "after weeks") — omit if absent.
- resolution_reason: what actually tipped them into buying — omit if absent.
- post_purchase_outcome: "satisfied" | "regret" | "returned" | "unclear" — omit if not inferable.`;

const PROSPECTIVE_ONLY = `
- current_blocker_freeform: the still-unresolved blocker, in their own words — omit if absent.
- deferral_trigger: what they say they are waiting for before deciding — omit if absent.
- mentions_wishlist: boolean, true only if a wishlist/save/shortlist action is explicitly mentioned.`;

function buildPrompt(text: string, lens: Lens): string {
  const lensFields = lens === "retrospective" ? RETROSPECTIVE_ONLY : PROSPECTIVE_ONLY;
  const lensLabel =
    lens === "retrospective"
      ? "This text is from someone who ALREADY BOUGHT the item (e.g. an app/Play Store review). You are looking backward at what friction they overcame."
      : "This text is from someone who is STILL DECIDING (e.g. a Reddit/forum comment). You are looking at an unresolved blocker in real time.";

  return `You are a careful qualitative-data extractor for a product-research pipeline about online fashion shopping (wishlist-to-purchase behaviour). You are NOT told any taxonomy of blockers in advance — extract only what this specific text actually says, in the person's own terms. Do not invent, generalise, or infer beyond the text.

${lensLabel}

Extract a single JSON object with these fields. Every field is OPTIONAL except intent_signal and confidence — if a field has no evidence in the text, omit the key entirely rather than emitting null or an empty string.

Fields:${CORE_FIELDS}
${lensFields}

Also include:
- verbatim_quote: the single most relevant short quote from the text (<= 30 words).

Return ONLY the JSON object, no prose, no markdown fences.

Text to extract from:
"""
${text}
"""`;
}

export interface GroqExtractionOutcome {
  configured: boolean;
  raw?: string;
  parsed?: Record<string, unknown>;
  error?: string;
}

export async function runExtraction(text: string, lens: Lens): Promise<GroqExtractionOutcome> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { configured: false };
  }

  const prompt = buildPrompt(text, lens);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return { configured: true, error: `Groq API error ${res.status}: ${errBody.slice(0, 300)}` };
  }

  const data = await res.json();
  const raw: string | undefined = data?.choices?.[0]?.message?.content;
  if (!raw) {
    return { configured: true, error: "Groq returned no content" };
  }

  try {
    const parsed = JSON.parse(raw);
    return { configured: true, raw, parsed };
  } catch {
    return { configured: true, raw, error: "Model output was not valid JSON" };
  }
}
