// Baked once at pipeline synthesis time (pipeline/extraction/narrate.py),
// not regenerated per page view — this dashboard has no live filter
// backend to re-query, so unlike a per-filter LLM call this is a single
// cached narrative over the full corpus. Names conclusions the engine
// already reached numerically; adds no new claims of its own.
export default function AiSynthesisCard({ narrative }: { narrative: string }) {
  return (
    <div className="rounded-2xl border-t-2 border-t-brand border-line bg-white p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-brand">✦</span>
        <p className="text-sm font-semibold text-ink">AI Synthesis</p>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand nav-tab">LLM</span>
      </div>
      <p className="mb-3 text-[11px] text-ink-faint">
        Narrative summary generated once from the ranked findings above — not a new analysis, a plain-language reading of it
      </p>
      <p className="text-sm leading-relaxed text-ink-soft">{narrative}</p>
    </div>
  );
}
