"use client";

import { useState } from "react";
import { FunnelStage } from "@/lib/types";

// Volume at each gate the corpus passed through.
//
// Form choice (choosing-a-form.md): a funnel, not a pie. The stages are
// SEQUENTIAL — each one's input is the previous one's output — so they are
// not parts of one whole and a pie would imply a false relationship (the
// slices would sum to more than the corpus, since a record counted at
// "Collected" is counted again at "Extracted"). A funnel encodes the one
// thing that actually matters here: how much survives each gate.
//
// Color: sequential single-hue ramp (magnitude job), darkest at the widest
// stage. Every stage carries its drop reason on hover and inline, because a
// funnel that shows attrition without explaining it reads as a bug report.
export default function PipelineFunnel({ stages }: { stages: FunnelStage[] }) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  if (!stages.length) return null;

  const max = Math.max(...stages.map((s) => s.n), 1);

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">How much data survived each gate</p>
      <p className="mb-4 text-[11px] text-ink-faint">
        Sequential stages, not parts of a whole — each gate&apos;s input is the previous gate&apos;s output. Click a
        stage for why it narrowed.
      </p>

      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const widthPct = Math.max(6, (s.n / max) * 100);
          const prev = i > 0 ? stages[i - 1].n : null;
          const dropPct = prev && prev > 0 ? Math.round(((prev - s.n) / prev) * 100) : null;
          const isOpen = openStage === s.stage;
          // Sequential ramp, darkest first — magnitude, not identity.
          const shades = [
            "var(--color-ordinal-700)",
            "var(--color-ordinal-700)",
            "var(--color-ordinal-500)",
            "var(--color-ordinal-500)",
            "var(--color-ordinal-300)",
            "var(--color-ordinal-300)",
          ];
          const isLight = i >= 4;

          return (
            <div key={s.stage}>
              <button
                type="button"
                onClick={() => setOpenStage(isOpen ? null : s.stage)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface"
              >
                <span className="w-32 shrink-0 text-xs font-semibold text-ink">{s.stage}</span>
                <span className="relative flex h-7 flex-1 items-center">
                  <span
                    className="flex h-full items-center rounded-md px-2 transition-all"
                    style={{ width: `${widthPct}%`, backgroundColor: shades[i] ?? "var(--color-ordinal-300)" }}
                  >
                    <span className={`text-xs font-bold ${isLight ? "text-ink" : "text-white"}`}>{s.n.toLocaleString()}</span>
                  </span>
                </span>
                <span className="w-24 shrink-0 text-right text-[11px] text-ink-faint">
                  {dropPct !== null && dropPct > 0 ? `−${dropPct}% vs prev` : i === 0 ? "intake" : "—"}
                </span>
                <span className={`shrink-0 text-[11px] text-ink-faint transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden>
                  ›
                </span>
              </button>
              {isOpen && (
                <p className="ml-32 mr-8 rounded-lg bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft">{s.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
