"use client";

import QuadrantBadge from "../charts/QuadrantBadge";
import StatusPill, { Status } from "../charts/StatusPill";
import { OpportunityRow } from "@/lib/types";

// Full table behind the "Opportunity areas" stat: every theme with its size,
// criticality, volume and confidence side by side. This is the one view where
// a table beats a chart — the reader is comparing four different measures
// across eight rows, which is a lookup task, not a magnitude-comparison task
// (choosing-a-form.md: "sometimes the answer is not a chart").
export default function OpportunityAreasDetail({
  rows,
  onOpenTheme,
}: {
  rows: OpportunityRow[];
  onOpenTheme?: (area: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const maxScore = Math.max(...sorted.map((r) => r.opportunityScore), 1);

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-ink-soft">
        Every opportunity area the synthesis stage named from the corpus, ranked by Opportunity Score. <strong>Size</strong>{" "}
        is the score itself (geometric mean of 5 dimensions). <strong>Volume</strong> is how many extracted records carry
        the theme. <strong>Confidence</strong> is the extractor&apos;s own certainty across those records — not a
        statistical interval.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="pb-2 pr-3 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Opportunity area</th>
              <th className="pb-2 pr-3 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Size (score)</th>
              <th className="pb-2 pr-3 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Criticality</th>
              <th className="pb-2 pr-3 text-right text-[10px] font-semibold uppercase text-ink-faint nav-tab">Volume</th>
              <th className="pb-2 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((r) => (
              <tr key={r.area} className="group">
                <td className="py-3 pr-3 align-top">
                  {onOpenTheme ? (
                    <button
                      type="button"
                      onClick={() => onOpenTheme(r.area)}
                      className="text-left font-semibold text-ink hover:text-brand hover:underline"
                    >
                      {r.area}
                    </button>
                  ) : (
                    <span className="font-semibold text-ink">{r.area}</span>
                  )}
                  {r.addressabilityNote && (
                    <p className="mt-0.5 text-[11px] text-[#a15c00]">{r.addressabilityNote}</p>
                  )}
                </td>
                <td className="py-3 pr-3 align-top">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 shrink-0 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(r.opportunityScore / maxScore) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-brand">{r.opportunityScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 align-top">{r.quadrant && <QuadrantBadge quadrant={r.quadrant} />}</td>
                <td className="py-3 pr-3 text-right align-top">
                  <span className="font-semibold text-ink">{r.totalVolume ?? 0}</span>
                  <span className="block text-[10px] text-ink-faint">
                    {r.appPlayN} app/play · {r.redditN} reddit
                  </span>
                </td>
                <td className="py-3 align-top">
                  {r.confidence ? (
                    <div className="flex items-center gap-2">
                      <StatusPill status={r.confidence.label as Status} />
                      <span className="text-xs font-semibold text-ink-soft">{r.confidence.score}</span>
                      <span className="text-[10px] text-ink-faint">
                        {r.confidence.mix.high}H/{r.confidence.mix.medium}M/{r.confidence.mix.low}L
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-[11px] leading-relaxed text-ink-faint">
        Criticality is Frequency × Intent Quality, not Frequency × Severity — at this corpus size{" "}
        <code>post_purchase_outcome</code> almost never resolves to regret/returned, so severity scales flat across every
        theme and would label them all identically. Confidence mix reads high/medium/low record counts.
      </p>
    </div>
  );
}
