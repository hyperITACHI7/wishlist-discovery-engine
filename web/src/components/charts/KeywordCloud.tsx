"use client";

import { useState } from "react";
import { KeywordCloudData } from "@/lib/types";

// Tabbed pill cloud, sized by mention count. Frustrations = status-serious,
// Praise = status-good — reusing the fixed status scale rather than a new
// diverging pair, since this IS a good/bad polarity, not a generic
// categorical split. Text always carries the label, color never stands
// alone (palette.md) — every pill shows its own count.
export default function KeywordCloud({ keywords }: { keywords: KeywordCloudData }) {
  const [tab, setTab] = useState<"negative" | "positive">("negative");
  const list = tab === "negative" ? keywords.negative : keywords.positive;
  const color =
    tab === "negative"
      ? { bg: "bg-[var(--color-status-serious-soft)]", text: "text-[#b8552f]", ring: "ring-[var(--color-status-serious)]" }
      : { bg: "bg-[var(--color-status-good-soft)]", text: "text-[#0ca30c]", ring: "ring-[var(--color-status-good)]" };

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Keyword Buzz</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("negative")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold nav-tab transition-colors ${
              tab === "negative" ? "bg-[var(--color-status-serious-soft)] text-[#b8552f]" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            Frustrations ({keywords.negative.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("positive")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold nav-tab transition-colors ${
              tab === "positive" ? "bg-[var(--color-status-good-soft)] text-[#0ca30c]" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            Praise ({keywords.positive.length})
          </button>
        </div>
      </div>
      <p className="mb-3 text-[11px] text-ink-faint">Keyword-marker heuristic on phrase text, not a trained sentiment model</p>

      {list.length === 0 ? (
        <p className="text-sm text-ink-faint">No {tab === "negative" ? "frustration" : "praise"} phrases matched.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((kw) => (
            <span
              key={kw.text}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${color.bg} ${color.text}`}
            >
              {kw.text}
              <span className="text-[10px] font-normal opacity-70">{kw.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
