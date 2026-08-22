import { OutcomeSummary } from "@/lib/types";

// Single 100%-stacked bar summarizing post_purchase_outcome corpus-wide,
// added 2026-08-23 (problem_statement.md §20). Regret and Returned share the
// project's fixed "serious" status color (good/warning/serious, never
// themed — see §16) rather than inventing a fourth hue; the legend still
// lists both counts separately underneath so neither is lost, just not
// given its own color.
export default function OutcomeMixBar({ summary }: { summary: OutcomeSummary }) {
  const { counts, coveredN, ofN } = summary;
  const satisfied = counts["satisfied"] ?? 0;
  const regret = counts["regret"] ?? 0;
  const returned = counts["returned"] ?? 0;
  const unclear = counts["unclear"] ?? 0;
  const negative = regret + returned;

  if (coveredN === 0) {
    return <p className="text-sm text-ink-faint">No post-purchase outcome stated yet.</p>;
  }

  const segments = [
    { label: "Satisfied", value: satisfied, color: "var(--color-status-good)" },
    { label: "Regret/Returned", value: negative, color: "var(--color-status-serious)" },
    { label: "Unclear", value: unclear, color: "var(--color-status-warning)" },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-line" role="img" aria-label={`${satisfied} satisfied, ${regret} regret, ${returned} returned, ${unclear} unclear, of ${coveredN} stated outcomes`}>
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / coveredN) * 100}%`, backgroundColor: s.color }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-status-good)" }} />
          <span className="font-semibold text-ink">{satisfied}</span> <span className="text-ink-faint">Satisfied</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-status-serious)" }} />
          <span className="font-semibold text-ink">{regret}</span> <span className="text-ink-faint">Regret</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-status-serious)" }} />
          <span className="font-semibold text-ink">{returned}</span> <span className="text-ink-faint">Returned</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-status-warning)" }} />
          <span className="font-semibold text-ink">{unclear}</span> <span className="text-ink-faint">Unclear</span>
        </span>
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        Outcome stated in {coveredN} of {ofN} App/Play reviews ({((coveredN / ofN) * 100).toFixed(0)}%) — the rest don&apos;t narrate what happened after purchase.
      </p>
    </div>
  );
}
