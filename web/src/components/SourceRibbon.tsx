// Persistent, always-visible summary of what the dashboard is built on —
// visible on every panel so the corpus composition never requires a click
// to see.
//
// The survey respondents segment was dropped 2026-08-20 with the survey
// source itself (problem_statement.md §18). It had needed a separate total
// anyway, since respondents were never part of the extracted corpus — with
// it gone the bar is simply the two lenses that make up the corpus.
export default function SourceRibbon({
  totalRecords,
  totalAppPlay,
  totalReddit,
}: {
  totalRecords: number;
  totalAppPlay: number;
  totalReddit: number;
}) {
  const parts = [
    { label: "App/Play Store", n: totalAppPlay, color: "var(--color-gold)" },
    { label: "Reddit", n: totalReddit, color: "var(--color-mint)" },
  ].filter((p) => p.n > 0);

  const corpusTotal = totalAppPlay + totalReddit;

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">
          {totalRecords} records analyzed
        </span>
        <div className="flex h-2 flex-1 min-w-[160px] max-w-xs overflow-hidden rounded-full" style={{ gap: "2px" }}>
          {parts.map((p) => (
            <div
              key={p.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(p.n / (corpusTotal || 1)) * 100}%`, backgroundColor: p.color }}
              title={`${p.label}: ${p.n}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint">
          {parts.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label} <span className="font-semibold text-ink">{p.n}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
