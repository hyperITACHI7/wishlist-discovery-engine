"use client";

import { useState } from "react";
import StatTile from "./charts/StatTile";
import {
  CLUSTERS,
  EXECUTIVE_SUMMARY,
  INTERVIEWS,
  INTERVIEW_META,
  InterviewPersona,
  RECOMMENDATIONS,
  WHAT_INTERVIEWS_ADD,
  WISHLIST_SIZE_FINDING,
} from "@/lib/interviews";

const CLUSTER_STYLE: Record<InterviewPersona["cluster"], string> = {
  bookmarker: "bg-[var(--color-status-serious-soft)] text-[#a1441a]",
  comparer: "bg-[var(--color-status-warning-soft)] text-[#a15c00]",
  closer: "bg-[var(--color-status-good-soft)] text-[#0a7a0a]",
};

function PersonaCard({ p, open, onToggle }: { p: InterviewPersona; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
          U{p.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{p.wishlistRole}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CLUSTER_STYLE[p.cluster]}`}>
              {CLUSTERS[p.cluster].label.replace(/s$/, "")}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-faint">
            <span>{p.age} yrs</span>
            <span>{p.location}</span>
            <span>{p.spendBand}</span>
            <span className="font-semibold text-ink-soft">{p.wishlistSize}</span>
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">{p.behavioralBottleneck}</span>
        </span>
        <span className={`mt-1 shrink-0 text-xs text-ink-faint transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3.5">
          <div className="mb-3">
            <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">How they use it</p>
            <p className="text-xs leading-relaxed text-ink-soft">{p.wishlistDynamic}</p>
          </div>

          <div className="mb-3">
            <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Psychology</p>
            <p className="text-xs leading-relaxed text-ink-soft">{p.psychology}</p>
            {p.languageCues.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.languageCues.map((c) => (
                  <span key={c} className="rounded-full bg-surface px-2 py-0.5 text-[11px] italic text-ink-soft">
                    &ldquo;{c}&rdquo;
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Decision Assistant</p>
              <p className="text-xs leading-relaxed text-ink-soft">{p.concept.decisionAssistant}</p>
            </div>
            <div className="rounded-xl bg-surface p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Digital Wardrobe</p>
              {p.concept.digitalWardrobe ? (
                <p className="text-xs leading-relaxed text-ink-soft">{p.concept.digitalWardrobe}</p>
              ) : (
                <p className="text-xs italic leading-relaxed text-ink-faint">
                  Not covered in this interview — left blank rather than inferred.
                </p>
              )}
            </div>
          </div>

          {p.corroborates && (
            <div className="rounded-xl border border-mint/30 bg-mint-soft/30 p-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase text-ink-faint nav-tab">
                Where the corpus independently shows the same thing
              </p>
              <p className="text-xs leading-relaxed text-ink-soft">{p.corroborates}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Primary research, rendered as its own evidence base rather than folded into
// the corpus views. The framing job this panel does: keep it obvious that
// n=6 qualitative depth and 597 extracted records are different kinds of
// evidence, and that they are never combined into one number.
export default function InterviewsPanel() {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const allOpen = openIds.size === INTERVIEWS.length;

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const clusterCounts = INTERVIEWS.reduce<Record<string, number>>((acc, p) => {
    acc[p.cluster] = (acc[p.cluster] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-mint/30 bg-mint-soft/30 px-4 py-3 text-sm text-ink">
        <span className="mt-0.5 text-mint">●</span>
        <p className="leading-relaxed">
          <span className="font-semibold">Primary research, not the automated corpus.</span> {INTERVIEW_META.boundary}
        </p>
      </div>

      <div className="mb-5">
        <h2 className="text-lg font-bold text-ink">{INTERVIEW_META.title}</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-ink-soft">{INTERVIEW_META.subtitle}</p>
        <p className="mt-1.5 text-[11px] text-ink-faint">{INTERVIEW_META.method}</p>
      </div>

      {/* Snapshot */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Participants" value={INTERVIEW_META.n} accent="brand" />
        <StatTile
          label="Bookmarkers"
          value={clusterCounts.bookmarker ?? 0}
          sublabel="large lists, abandon on return"
          accent="ink"
        />
        <StatTile
          label="Comparers"
          value={clusterCounts.comparer ?? 0}
          sublabel="stall in evaluation, leak off-platform"
          accent="gold"
        />
        <StatTile
          label="Closers"
          value={clusterCounts.closer ?? 0}
          sublabel="small lists, convert on a trigger"
          accent="mint"
        />
      </div>

      {/* Executive summary */}
      <section className="mb-5 rounded-2xl border border-brand/30 bg-brand-soft/20 p-4">
        <p className="mb-1.5 text-sm font-semibold text-ink">{EXECUTIVE_SUMMARY.headline}</p>
        <p className="mb-3 text-sm leading-relaxed text-ink-soft">{EXECUTIVE_SUMMARY.body}</p>
        <p className="mb-1.5 text-[10px] font-semibold uppercase text-ink-faint nav-tab">Friction centres on three things</p>
        <ul className="space-y-1.5">
          {EXECUTIVE_SUMMARY.frictionCenters.map((f) => (
            <li key={f.label} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-0.5 shrink-0 text-brand" aria-hidden>
                →
              </span>
              <span>
                <span className="font-semibold text-ink">{f.label}</span> — {f.note}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* The segment finding — the reason these interviews matter most */}
      <section className="mb-5 rounded-2xl border border-line bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-ink">{WISHLIST_SIZE_FINDING.headline}</p>
        <p className="mb-2.5 text-sm leading-relaxed text-ink-soft">{WISHLIST_SIZE_FINDING.detail}</p>

        <div className="mb-2.5 space-y-1.5">
          {(["bookmarker", "comparer", "closer"] as const).map((c) => {
            const members = INTERVIEWS.filter((p) => p.cluster === c);
            return (
              <div key={c} className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`w-28 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase ${CLUSTER_STYLE[c]}`}>
                  {CLUSTERS[c].label}
                </span>
                <span className="font-semibold text-ink">{members.map((m) => m.wishlistSize).join(" · ")}</span>
                <span className="text-ink-soft">{CLUSTERS[c].note}</span>
              </div>
            );
          })}
        </div>

        <p className="rounded-lg bg-surface px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-faint">
          {WISHLIST_SIZE_FINDING.caution}
        </p>
      </section>

      {/* Personas */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">The six participants</p>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? new Set() : new Set(INTERVIEWS.map((p) => p.id)))}
          className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="mb-5 space-y-2.5">
        {INTERVIEWS.map((p) => (
          <PersonaCard key={p.id} p={p} open={openIds.has(p.id)} onToggle={() => toggle(p.id)} />
        ))}
      </div>

      {/* Recommendations */}
      <section className="mb-5 rounded-2xl border border-line bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-ink">Strategic product recommendations</p>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-faint">
          These come from the interview round, not from the discovery engine. The engine&apos;s own scope stops at
          identify / quantify / compare — solution design is a separate stage, and this is it.
        </p>
        <ol className="space-y-3">
          {RECOMMENDATIONS.map((r) => (
            <li key={r.id} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink-soft">
                {r.id}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {r.title}
                  {r.personas && (
                    <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 align-middle text-[10px] font-bold text-brand">
                      from U{r.personas.join(", U")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{r.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Why this round was worth running */}
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-ink">What these interviews add that public text cannot</p>
        <ul className="space-y-2">
          {WHAT_INTERVIEWS_ADD.map((w) => (
            <li key={w.slice(0, 40)} className="flex gap-2 text-xs leading-relaxed text-ink-soft">
              <span className="mt-0.5 shrink-0 text-brand" aria-hidden>
                ●
              </span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
