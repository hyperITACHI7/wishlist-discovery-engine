"use client";

import QuadrantBadge from "../charts/QuadrantBadge";
import { OpportunityRow } from "@/lib/types";

// Every theme where someone described routing around the problem themselves.
//
// Why this gets its own view rather than a boolean in a table: per
// problem_statement.md §6, a stated workaround is the strongest unmet-need
// evidence the schema produces — someone paid a real, ongoing cost to get
// past a gap. The cost they described IS the spec for what a fix removes, so
// the verbatim text is the payload here, not the count.
export default function WorkaroundsDetail({
  rows,
  onOpenTheme,
}: {
  rows: OpportunityRow[];
  onOpenTheme?: (area: string) => void;
}) {
  const withWorkarounds = rows
    .filter((r) => r.hasWorkaround)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
  const without = rows.filter((r) => !r.hasWorkaround);
  const totalStated = withWorkarounds.reduce((sum, r) => sum + (r.workarounds?.length ?? 0), 0);

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-ink-soft">
        <strong>{withWorkarounds.length} of {rows.length}</strong> opportunity areas have at least one workaround stated
        in the corpus, with <strong>{totalStated}</strong> distinct workarounds described in total. High frequency{" "}
        <em>and</em> people actively routing around it is the strongest unmet-need signal this engine produces.
      </p>

      <div className="space-y-3">
        {withWorkarounds.map((r) => (
          <div key={r.area} className="rounded-xl border border-line bg-white p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {onOpenTheme ? (
                  <button
                    type="button"
                    onClick={() => onOpenTheme(r.area)}
                    className="text-sm font-semibold text-ink hover:text-brand hover:underline"
                  >
                    {r.area}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-ink">{r.area}</span>
                )}
                {r.quadrant && <QuadrantBadge quadrant={r.quadrant} />}
              </div>
              <span className="text-[11px] text-ink-faint">
                score {r.opportunityScore.toFixed(1)} · n={r.totalVolume ?? 0}
              </span>
            </div>

            {r.workarounds?.length ? (
              <ul className="space-y-1.5">
                {r.workarounds.map((w) => (
                  <li key={w} className="flex gap-2 text-sm text-ink-soft">
                    <span className="mt-0.5 shrink-0 text-mint" aria-hidden>
                      →
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-faint">
                Flagged as having a workaround, but no distinct text captured — the field fired on a record whose value
                didn&apos;t survive deduplication.
              </p>
            )}
          </div>
        ))}
      </div>

      {without.length > 0 && (
        <div className="mt-5 rounded-xl bg-surface p-3.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase text-ink-faint nav-tab">
            No workaround seen ({without.length})
          </p>
          <p className="mb-2 text-xs leading-relaxed text-ink-soft">
            Absence of a workaround is genuinely ambiguous and shouldn&apos;t be read as good news: it can mean the
            blocker is easy to live with, or that it&apos;s unroutable-around and people simply abandon the purchase.
            Public text rarely distinguishes the two — another gap the interviews target.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {without.map((r) => (
              <span key={r.area} className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] text-ink-soft">
                {r.area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
