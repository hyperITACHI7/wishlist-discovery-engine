// Fixed status scale (never themed — palette.md). Strong/Medium/Weak map to
// good/warning/serious. Always icon+label, never color alone — warning and
// serious sit under 3:1 contrast on a light surface by design, so the
// dot+text pairing is the actual accessibility mechanism, not decoration.
export type Status = "Strong" | "Medium" | "Weak";

const STATUS_STYLE: Record<Status, { dot: string; bg: string; text: string; icon: string }> = {
  Strong: { dot: "bg-[var(--color-status-good)]", bg: "bg-[var(--color-status-good-soft)]", text: "text-[#0ca30c]", icon: "●" },
  Medium: { dot: "bg-[var(--color-status-warning)]", bg: "bg-[var(--color-status-warning-soft)]", text: "text-[#a15c00]", icon: "◐" },
  Weak: { dot: "bg-[var(--color-status-serious)]", bg: "bg-[var(--color-status-serious-soft)]", text: "text-[#b8552f]", icon: "○" },
};

export default function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold nav-tab ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {status}
    </span>
  );
}
