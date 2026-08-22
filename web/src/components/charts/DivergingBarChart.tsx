// Two-sided comparison from a center axis. Diverging pair per
// color-formula.md — reuses this product's existing gold(warm)/mint(cool)
// lens convention (retrospective/prospective) rather than a generic
// blue/red, since that pairing is already this dashboard's visual language
// for exactly this split. One row per labeled comparison.
export interface DivergingRow {
  id: string;
  label: string;
  leftValue: number;
  leftN: number;
  rightValue: number;
  rightN: number;
}

export default function DivergingBarChart({
  rows,
  leftLegend,
  rightLegend,
  maxValue,
}: {
  rows: DivergingRow[];
  leftLegend: string;
  rightLegend: string;
  maxValue: number;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-6 text-[11px] font-semibold uppercase nav-tab">
        <span className="flex items-center gap-1.5 text-[#a15c00]">
          <span className="h-2 w-2 rounded-full bg-gold" /> {leftLegend}
        </span>
        <span className="flex items-center gap-1.5 text-mint">
          <span className="h-2 w-2 rounded-full bg-mint" /> {rightLegend}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const leftPct = maxValue > 0 ? (row.leftValue / maxValue) * 100 : 0;
          const rightPct = maxValue > 0 ? (row.rightValue / maxValue) * 100 : 0;
          return (
            <div key={row.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs text-ink-faint" style={{ fontVariantNumeric: "proportional-nums" }}>
                  {row.leftValue.toFixed(1)}% (n={row.leftN})
                </span>
                <div className="h-2.5 w-24 overflow-hidden rounded-l-full bg-line sm:w-32">
                  <div className="ml-auto h-full rounded-l-full bg-gold" style={{ width: `${leftPct}%` }} />
                </div>
              </div>
              <span className="w-28 shrink-0 truncate text-center text-xs font-semibold text-ink sm:w-40" title={row.label}>
                {row.label}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-24 overflow-hidden rounded-r-full bg-line sm:w-32">
                  <div className="h-full rounded-r-full bg-mint" style={{ width: `${rightPct}%` }} />
                </div>
                <span className="text-xs text-ink-faint" style={{ fontVariantNumeric: "proportional-nums" }}>
                  {row.rightValue.toFixed(1)}% (n={row.rightN})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
