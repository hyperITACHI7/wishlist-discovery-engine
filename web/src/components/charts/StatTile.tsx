// Hero-number stat tile. Per marks-and-anatomy.md: proportional figures for
// big standalone numbers (not tabular-nums — that's for columns), system
// sans throughout, one hero figure per view.
//
// Made optionally clickable 2026-08-20: passing onClick turns the tile into a
// real <button> (not a div with a handler) so it keeps keyboard focus and
// screen-reader semantics for free, and shows an affordance chevron —
// otherwise nothing signals that a stat is a door to a fuller view.
export default function StatTile({
  label,
  value,
  sublabel,
  accent = "brand",
  onClick,
  actionLabel = "View detail",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "brand" | "mint" | "gold" | "ink";
  onClick?: () => void;
  actionLabel?: string;
}) {
  const accentClass = {
    brand: "text-brand",
    mint: "text-mint",
    gold: "text-[#a15c00]",
    ink: "text-ink",
  }[accent];

  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold leading-none ${accentClass}`} style={{ fontVariantNumeric: "proportional-nums" }}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-soft">{sublabel}</p>}
    </>
  );

  if (!onClick) {
    return <div className="rounded-2xl border border-line bg-white p-4">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-2xl border border-line bg-white p-4 text-left transition-all hover:border-brand hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      {body}
      <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-ink-faint transition-colors group-hover:text-brand">
        {actionLabel}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </button>
  );
}
