"use client";

import { useState } from "react";
import QuadrantBadge from "./QuadrantBadge";
import { QuadrantBadge as QuadrantBadgeData } from "@/lib/types";

export interface RankedBarDatum {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
  quadrant?: QuadrantBadgeData;
}

// Single-series magnitude ranking. Per color-formula.md: one series needs no
// legend box (the title names it) — brand color is appropriate here since
// this is the product's single primary metric, not a multi-category
// identity encoding. Marks: 4px rounded data-end, square baseline, value
// label at the tip (marks-and-anatomy.md).
export default function RankedBarChart({
  data,
  maxValue,
  onSelect,
  selectedId,
}: {
  data: RankedBarDatum[];
  maxValue: number;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = Math.max(2, (d.value / maxValue) * 100);
        const isActive = hoveredId === d.id || selectedId === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect?.(d.id)}
            onMouseEnter={() => setHoveredId(d.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`block w-full rounded-xl border px-3 py-2 text-left transition-colors ${
              selectedId === d.id ? "border-brand bg-brand-soft/40" : "border-transparent hover:border-line"
            }`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink">{d.label}</span>
                {d.quadrant && <QuadrantBadge quadrant={d.quadrant} />}
              </span>
              <span className="shrink-0 text-sm font-bold text-brand" style={{ fontVariantNumeric: "proportional-nums" }}>
                {d.value.toFixed(1)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${pct}%`, opacity: isActive ? 1 : 0.85 }}
              />
            </div>
            {d.sublabel && <p className="mt-1 text-xs text-ink-faint">{d.sublabel}</p>}
          </button>
        );
      })}
    </div>
  );
}
