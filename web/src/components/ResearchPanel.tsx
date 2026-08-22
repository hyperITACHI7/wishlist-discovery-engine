"use client";

import { useState } from "react";
import {
  ALL_RESEARCH_SOURCES,
  RESEARCH_IMPLICATIONS,
  RESEARCH_INTRO,
  RESEARCH_QUESTIONS,
  ResearchQuestion,
} from "@/lib/psychologyResearch";

function SourceChip({ title, url, kind }: { title: string; url: string; kind: "academic" | "industry" }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        kind === "academic"
          ? "border-ordinal-500/30 bg-[var(--color-ordinal-100)]/40 text-ink hover:border-[var(--color-ordinal-500)]"
          : "border-line bg-surface text-ink-soft hover:border-ink-soft hover:text-ink"
      }`}
      title={`${title} — ${kind === "academic" ? "academic / primary research" : "industry / market data"}`}
    >
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide opacity-60">
        {kind === "academic" ? "PAPER" : "INDUSTRY"}
      </span>
      <span className="truncate">{title}</span>
      <span aria-hidden className="shrink-0 opacity-50">
        ↗
      </span>
    </a>
  );
}

function QuestionCard({ q, open, onToggle }: { q: ResearchQuestion; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
          {q.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{q.question}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{q.shortAnswer}</span>
          <span className="mt-1.5 flex flex-wrap gap-1">
            {q.mechanisms.map((m) => (
              <span
                key={m}
                className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-faint"
              >
                {m}
              </span>
            ))}
          </span>
        </span>
        <span
          className={`mt-1 shrink-0 text-xs text-ink-faint transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          ›
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3.5">
          <p className="mb-2 text-[10px] font-semibold uppercase text-ink-faint nav-tab">What the literature says</p>
          <ul className="mb-4 space-y-2.5">
            {q.findings.map((f) => (
              <li key={f.claim}>
                <p className="text-sm font-semibold text-ink">
                  {f.claim}
                  {f.stat && (
                    <span className="ml-2 rounded-full bg-[var(--color-ordinal-100)] px-2 py-0.5 align-middle text-[10px] font-bold text-[var(--color-ordinal-700)]">
                      {f.stat}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{f.detail}</p>
              </li>
            ))}
          </ul>

          <div className="mb-3 rounded-xl border border-brand/30 bg-brand-soft/20 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">What it implies here</p>
            <p className="text-xs leading-relaxed text-ink-soft">{q.implication}</p>
          </div>

          {q.enginesLink && (
            <div className="mb-3 rounded-xl border border-mint/30 bg-mint-soft/30 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">
                How this engine&apos;s own corpus compares
              </p>
              <p className="text-xs leading-relaxed text-ink-soft">{q.enginesLink}</p>
            </div>
          )}

          <p className="mb-1.5 text-[10px] font-semibold uppercase text-ink-faint nav-tab">
            Sources ({q.sources.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {q.sources.map((s) => (
              <SourceChip key={s.url} {...s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Desk research as its own tab, next to Interviews — both are non-engine
// evidence about the same problem, so they belong side by side. The framing
// job this panel has to do is keep external literature and this engine's own
// corpus findings visibly separate: they inform each other, but pooling them
// would let a Western-market academic statistic read as something the Myntra
// corpus proved, which it isn't.
export default function ResearchPanel() {
  // Open state lives here rather than in each card so "Expand all" is a real
  // state change, not a remount trick.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState("");

  const allOpen = openIds.size === RESEARCH_QUESTIONS.length;

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const shown = filter
    ? RESEARCH_QUESTIONS.filter(
        (q) =>
          q.question.toLowerCase().includes(filter.toLowerCase()) ||
          q.shortAnswer.toLowerCase().includes(filter.toLowerCase()) ||
          q.mechanisms.some((m) => m.toLowerCase().includes(filter.toLowerCase())) ||
          q.findings.some((f) => f.claim.toLowerCase().includes(filter.toLowerCase())),
      )
    : RESEARCH_QUESTIONS;

  const academicCount = ALL_RESEARCH_SOURCES.filter((s) => s.kind === "academic").length;
  const industryCount = ALL_RESEARCH_SOURCES.filter((s) => s.kind === "industry").length;

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-[var(--color-ordinal-500)]/30 bg-[var(--color-ordinal-100)]/30 px-4 py-3 text-sm text-ink">
        <span className="mt-0.5 text-[var(--color-ordinal-500)]">●</span>
        <p className="leading-relaxed">
          <span className="font-semibold">External literature, not this engine&apos;s findings.</span>{" "}
          {RESEARCH_INTRO.caveat}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{RESEARCH_INTRO.title}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-soft">{RESEARCH_INTRO.blurb}</p>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            {RESEARCH_QUESTIONS.length} questions · {academicCount} academic sources · {industryCount} industry sources ·
            full narrative in <code className="text-[10px]">vault/09-Assignment/10-Psychology-Research.md</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by topic or mechanism…"
            className="w-52 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-brand"
          />
          <button
            type="button"
            onClick={() => setOpenIds(allOpen ? new Set() : new Set(RESEARCH_QUESTIONS.map((q) => q.id)))}
            className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-6 text-center text-sm text-ink-faint">
            No question matches &ldquo;{filter}&rdquo;.
          </p>
        ) : (
          shown.map((q) => (
            <QuestionCard key={q.id} q={q} open={openIds.has(q.id)} onToggle={() => toggle(q.id)} />
          ))
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">What this research changes in the plan</p>
        <ul className="space-y-2">
          {RESEARCH_IMPLICATIONS.map((imp) => (
            <li key={imp} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
              <span className="mt-0.5 shrink-0 text-brand" aria-hidden>
                →
              </span>
              <span>{imp}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">All sources ({ALL_RESEARCH_SOURCES.length})</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_RESEARCH_SOURCES.map((s) => (
            <SourceChip key={s.url} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
}
