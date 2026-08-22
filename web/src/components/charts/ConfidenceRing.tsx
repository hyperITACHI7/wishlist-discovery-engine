// Small donut summarizing a status distribution (e.g. "6 Strong, 2 Medium,
// 2 Weak" across the 10 brief questions) — the headline before the detailed
// matrix. Same fixed status colors as StatusPill; a legend is shown since
// this is a 3-segment breakdown (>= 2 series always gets a legend).
export default function ConfidenceRing({
  strong,
  medium,
  weak,
}: {
  strong: number;
  medium: number;
  weak: number;
}) {
  const total = strong + medium + weak;
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const strongLen = (strong / total) * circumference;
  const mediumLen = (medium / total) * circumference;
  const weakLen = (weak / total) * circumference;

  let offset = 0;
  const segments = [
    { len: strongLen, color: "var(--color-status-good)" },
    { len: mediumLen, color: "var(--color-status-warning)" },
    { len: weakLen, color: "var(--color-status-serious)" },
  ];

  return (
    <div className="flex items-center gap-4">
      <svg width={88} height={88} viewBox="0 0 88 88" className="shrink-0" role="img" aria-label={`${strong} of ${total} questions Strong, ${medium} Medium, ${weak} Weak`}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="var(--color-chart-grid)" strokeWidth={10} />
        {segments.map((seg, i) => {
          const dashArray = `${seg.len} ${circumference - seg.len}`;
          const el = (
            <circle
              key={i}
              cx={44}
              cy={44}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={10}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              transform="rotate(-90 44 44)"
              strokeLinecap="butt"
            />
          );
          offset += seg.len;
          return el;
        })}
        <text x={44} y={40} textAnchor="middle" className="fill-ink text-[20px] font-extrabold" style={{ fontVariantNumeric: "proportional-nums" }}>
          {total}
        </text>
        <text x={44} y={54} textAnchor="middle" className="fill-ink-faint text-[9px] font-semibold uppercase">
          questions
        </text>
      </svg>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-status-good)]" /> <span className="font-semibold text-ink">{strong}</span> <span className="text-ink-faint">Strong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-status-warning)]" /> <span className="font-semibold text-ink">{medium}</span> <span className="text-ink-faint">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-status-serious)]" /> <span className="font-semibold text-ink">{weak}</span> <span className="text-ink-faint">Weak</span>
        </div>
      </div>
    </div>
  );
}
