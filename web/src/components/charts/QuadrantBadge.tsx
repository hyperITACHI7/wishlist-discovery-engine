import { QuadrantBadge as QuadrantBadgeData } from "@/lib/types";

// Reuses the fixed status scale (never themed) rather than inventing a 4th
// color for MONITOR — serious/warning carry urgency, MONITOR stays neutral
// ink, same convention as StatusPill. Always icon-free text label, never
// color alone, per palette.md.
const TIER_STYLE: Record<QuadrantBadgeData["tier"], { bg: string; text: string }> = {
  serious: { bg: "bg-[var(--color-status-serious-soft)]", text: "text-[#b8552f]" },
  warning: { bg: "bg-[var(--color-status-warning-soft)]", text: "text-[#a15c00]" },
  neutral: { bg: "bg-line", text: "text-ink-faint" },
};

export default function QuadrantBadge({ quadrant }: { quadrant: QuadrantBadgeData }) {
  const s = TIER_STYLE[quadrant.tier];
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide nav-tab ${s.bg} ${s.text}`}
      title="Frequency x Intent Quality — how often this comes up, crossed with how much of that is genuine buy-intent rather than bookmarking"
    >
      {quadrant.label}
    </span>
  );
}
