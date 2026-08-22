"use client";

import { CrossTabMatrix as MatrixData } from "@/lib/types";

// ONE joint table per theme, replacing the two separate marginal bar charts
// this section used to show.
//
// Why the old version was confusing: "by intent_signal" and "by
// product_category" were the two MARGINALS of a single two-way table. Both
// summed to the same n over the same records, so they looked like two charts
// of the same thing — because in a sense they were. What neither could show
// is the interaction: "38% apparel" and "40% buy-intent" can't tell you
// whether the apparel records ARE the buy-intent ones.
//
// A heatmap of the joint table answers exactly that, and puts the two
// marginals back on its own edges where they belong — so nothing is lost,
// and the relationship between them becomes the visible part.
//
// Color: sequential single-hue ramp keyed to cell magnitude (magnitude job,
// per color-formula.md). Every cell also prints its own count, so color is
// never the only encoding.
export default function CrossTabMatrix({ matrix }: { matrix: MatrixData }) {
  const maxCell = Math.max(...matrix.cells.map((c) => c.n), 1);
  const cellAt = (row: string, col: string) => matrix.cells.find((c) => c.row === row && c.col === col);
  const rowTotal = (label: string) => matrix.rowTotals.find((r) => r.label === label)?.n ?? 0;
  const colTotal = (label: string) => matrix.colTotals.find((c) => c.label === label)?.n ?? 0;

  // Sequential ramp: intensity by share of the densest cell. Zero cells stay
  // surface-colored rather than getting the palest ink, so "no records here"
  // reads as absence, not as a very small value.
  function cellStyle(n: number) {
    if (n === 0) return { backgroundColor: "var(--color-surface)", color: "var(--color-ink-faint)" };
    const t = n / maxCell;
    const step = t > 0.66 ? "var(--color-ordinal-700)" : t > 0.33 ? "var(--color-ordinal-500)" : "var(--color-ordinal-100)";
    return { backgroundColor: step, color: t > 0.33 ? "#fff" : "var(--color-ink)" };
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{matrix.theme}</p>
        <p className="text-[11px] text-ink-faint">n={matrix.totalN} records</p>
      </div>
      <p className="mb-3 text-[11px] text-ink-faint">
        {matrix.rowDimension} <span className="text-ink-soft">×</span> {matrix.colDimension} — each cell is the count of
        records that are <em>both</em>. Row/column totals on the edges.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: "2px" }}>
          <thead>
            <tr>
              <th className="w-24 text-left text-[10px] font-semibold uppercase text-ink-faint nav-tab" />
              {matrix.colLabels.map((col) => (
                <th key={col} className="px-1 pb-1 text-center text-[10px] font-semibold text-ink-soft">
                  {col}
                </th>
              ))}
              <th className="px-1 pb-1 text-center text-[10px] font-semibold uppercase text-ink-faint nav-tab">All</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rowLabels.map((row) => (
              <tr key={row}>
                <th className="pr-2 text-right text-[11px] font-semibold text-ink-soft">{row}</th>
                {matrix.colLabels.map((col) => {
                  const cell = cellAt(row, col);
                  const n = cell?.n ?? 0;
                  return (
                    <td
                      key={col}
                      className="relative h-11 min-w-[64px] rounded-md text-center align-middle"
                      style={{
                        ...cellStyle(n),
                        boxShadow: cell?.smallCell ? "inset 0 0 0 2px var(--color-status-warning)" : undefined,
                      }}
                      title={`${row} × ${col}: ${n} record${n === 1 ? "" : "s"} (${cell?.pctOfTotal ?? 0}% of this theme)${
                        cell?.smallCell ? " — small n, directional only" : ""
                      }`}
                    >
                      {/* Count and share stack rather than sitting inline —
                          side by side, "7" next to "33%" reads as "733%". */}
                      <span className="flex flex-col items-center justify-center leading-none">
                        <span className="text-sm font-bold">{n}</span>
                        {n > 0 && <span className="mt-0.5 text-[10px] opacity-80">{cell?.pctOfTotal}%</span>}
                      </span>
                    </td>
                  );
                })}
                <td className="min-w-[52px] rounded-md bg-surface text-center text-xs font-bold text-ink-soft">{rowTotal(row)}</td>
              </tr>
            ))}
            <tr>
              <th className="pr-2 text-right text-[10px] font-semibold uppercase text-ink-faint nav-tab">All</th>
              {matrix.colLabels.map((col) => (
                <td key={col} className="rounded-md bg-surface text-center text-xs font-bold text-ink-soft">
                  {colTotal(col)}
                </td>
              ))}
              <td className="rounded-md bg-line text-center text-xs font-bold text-ink">{matrix.totalN}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-ordinal-100)" }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-ordinal-500)" }} />
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--color-ordinal-700)" }} />
          </span>
          fewer → more records
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm bg-white"
            style={{ boxShadow: "inset 0 0 0 2px var(--color-status-warning)" }}
          />
          small n (&lt;5) — directional only
        </span>
      </div>
    </div>
  );
}
