"use client";

import { useState } from "react";
import { Lens } from "@/lib/types";

type ApiResponse =
  | { configured: false; message: string }
  | { configured: true; extraction: Record<string, unknown> }
  | { configured: true; error: string };

const FIELD_LABELS: Record<string, string> = {
  product_category: "Product category",
  intent_signal: "Intent signal",
  intent_evidence: "Intent evidence",
  segment_signal: "Segment signal",
  decision_factors: "Decision factors",
  confidence: "Confidence",
  save_motivation: "Save motivation",
  comparison_behavior: "Comparison behaviour",
  offsite_research: "Offsite research",
  workaround: "Workaround",
  hesitation_signal: "Hesitation signal",
  delay_signal: "Delay signal",
  resolution_reason: "Resolution reason",
  post_purchase_outcome: "Post-purchase outcome",
  current_blocker_freeform: "Current blocker",
  deferral_trigger: "Deferral trigger",
  mentions_wishlist: "Mentions wishlist",
  verbatim_quote: "Verbatim quote",
};

const EXAMPLES: Record<Lens, string> = {
  retrospective:
    "Was on the fence about this for almost a month because I wasn't sure about the fit, but finally ordered after reading a bunch of recent reviews saying it runs true to size. Glad I did, fits perfectly.",
  prospective:
    "Been eyeing this jacket for weeks but can't decide if it'll actually suit me for winter here. Checked the same one on two other sites to compare price and reviews, still haven't pulled the trigger.",
};

export default function ExtractorPanel() {
  const [lens, setLens] = useState<Lens>("retrospective");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lens }),
      });
      const data = (await res.json()) as ApiResponse;
      setResult(data);
    } catch {
      setResult({ configured: true, error: "Network error calling the extraction API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink">1. What kind of text is this?</p>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setLens("retrospective")}
            className={`flex-1 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
              lens === "retrospective" ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft hover:border-ink"
            }`}
          >
            <span className="block font-semibold">A review of something I bought</span>
            <span className="block text-ink-faint">Retrospective lens — App/Play Store style</span>
          </button>
          <button
            onClick={() => setLens("prospective")}
            className={`flex-1 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
              lens === "prospective" ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft hover:border-ink"
            }`}
          >
            <span className="block font-semibold">Something I&apos;m still deciding on</span>
            <span className="block text-ink-faint">Prospective lens — Reddit style</span>
          </button>
        </div>

        <p className="mb-2 text-sm font-semibold text-ink">2. Paste the text</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLES[lens]}
          rows={7}
          maxLength={4000}
          className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink outline-none focus:border-brand"
        />
        <div className="mt-1 flex items-center justify-between">
          <button
            onClick={() => setText(EXAMPLES[lens])}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Use example text
          </button>
          <span className="text-xs text-ink-faint">{text.length}/4000</span>
        </div>

        <button
          onClick={handleExtract}
          disabled={loading || !text.trim()}
          className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Extracting…" : "Extract"}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink">Structured extraction</p>

        {!result && !loading && (
          <p className="text-sm text-ink-faint">Run an extraction to see the structured output here.</p>
        )}

        {loading && <p className="text-sm text-ink-faint">Calling Groq…</p>}

        {result && !result.configured && (
          <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-ink">{result.message}</div>
        )}

        {result && result.configured && "error" in result && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{result.error}</div>
        )}

        {result && result.configured && "extraction" in result && (
          <ExtractionOutput extraction={result.extraction} />
        )}
      </div>
    </div>
  );
}

function ExtractionOutput({ extraction }: { extraction: Record<string, unknown> }) {
  const entries = Object.entries(extraction).filter(([, v]) => v !== null && v !== undefined && v !== "");

  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-faint">
        Empty extraction — the model found no confident evidence for any field in this text. Shown honestly,
        not hidden, per the engine&apos;s own limitations policy.
      </p>
    );
  }

  return (
    <dl className="space-y-2.5">
      {entries.map(([key, value]) => (
        <div key={key} className="border-b border-line pb-2 last:border-0">
          <dt className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">
            {FIELD_LABELS[key] ?? key}
          </dt>
          <dd className="text-sm text-ink">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
