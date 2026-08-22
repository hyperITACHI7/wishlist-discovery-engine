const LIMITATIONS = [
  {
    title: "Self-selection bias",
    body: "Public reviewers (App/Play Store, Reddit) over-represent complaints and extreme experiences relative to the silent satisfied majority. Treated as a directional proxy for the wishlist-user population, not a representative sample.",
  },
  {
    title: "n per source, stated always",
    body: "App/Play Store volume structurally dwarfs Reddit. Every rate in the findings views is reported within its own source with n shown — never pooled into one misleading blended number.",
  },
  {
    title: "Per-field null rates",
    body: "Most extraction fields are empty on most items by design — value comes from counting at corpus scale, not from every field firing on every item. Fields that come back >95% empty in the 50-item pilot get their prompt rewritten or dropped rather than carried dead-weight.",
  },
  {
    title: "5–10% human spot-check, not full verification",
    body: "LLM-based extraction is spot-checked on a sample of output before the synthesis stage is trusted — not manually verified record-by-record. Directional ranking is the goal, not survey-grade precision.",
  },
  {
    title: "Two questions this engine can't answer alone",
    body: "Comparison behaviour (Q5) and cross-segment differences (Q9) are rarely narrated in public text. The engine screens for them; the 5–6 user interviews are what actually answer them.",
  },
  {
    title: "Addressability is a judgment score, not data",
    body: "The Opportunity Score's non-monetary-addressability dimension is a labelled judgment call (can this be fixed without price levers?), not a measured quantity — kept visibly separate from the four data-derived dimensions so the ranking stays auditable, not falsely objective.",
  },
];

export default function LimitationsPanel() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-ink-soft">
        An engine that states what it can&apos;t answer is more trustworthy than one that claims to answer
        everything equally well. This panel is intentionally small and always visible — see{" "}
        <code className="text-xs">problem_statement.md §4, §7d</code> for the full reasoning.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {LIMITATIONS.map((l) => (
          <div key={l.title} className="rounded-2xl border border-line bg-white p-4">
            <p className="mb-1 text-sm font-semibold text-ink">{l.title}</p>
            <p className="text-xs leading-relaxed text-ink-soft">{l.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
