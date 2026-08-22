"use client";

import QuadrantBadge from "../charts/QuadrantBadge";
import StatusPill, { Status } from "../charts/StatusPill";
import { OpportunityRow } from "@/lib/types";

const OUTCOME_TONE: Record<string, { label: string; bg: string; text: string }> = {
  satisfied: { label: "Satisfied", bg: "bg-[var(--color-status-good-soft)]", text: "text-[#0ca30c]" },
  regret: { label: "Regret", bg: "bg-[var(--color-status-serious-soft)]", text: "text-[#b8552f]" },
  returned: { label: "Returned", bg: "bg-[var(--color-status-serious-soft)]", text: "text-[#b8552f]" },
  unclear: { label: "Unclear", bg: "bg-line", text: "text-ink-faint" },
};

const INTENT_LABEL: Record<string, string> = {
  "buy-intent": "Stated intent to buy",
  "save-for-later": "Saving for later",
  "not-determinable": "Not determinable",
};

// Deep-dive on the single highest-scoring opportunity.
//
// The "how to fix it" section is deliberately framed as RESOLUTION PATHS
// OBSERVED IN THE DATA, not as a proposed feature. problem_statement.md §13
// puts solution design explicitly out of scope for this engine — its job ends
// at identify/quantify/compare. What the corpus legitimately supports is
// "here is what actually unstuck real people," drawn from resolution_reason
// and workaround, which is evidence, not invention. Where the corpus has no
// resolution evidence, this says so rather than filling the gap with a guess.
export default function TopOpportunityDetail({ row }: { row: OpportunityRow }) {
  const outcomes = Object.entries(row.outcomeMix?.counts ?? {}).sort((a, b) => b[1] - a[1]);
  const intents = Object.entries(row.intentMix ?? {}).sort((a, b) => b[1] - a[1]);
  const intentTotal = intents.reduce((sum, [, n]) => sum + n, 0);
  const hasResolution = row.resolutionReason && row.resolutionReason !== "not enough data yet";
  const priceCapped = Boolean(row.addressabilityNote);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-ink">{row.area}</h3>
          {row.quadrant && <QuadrantBadge quadrant={row.quadrant} />}
        </div>
        <p className="text-sm text-ink-soft">
          Opportunity Score <strong className="text-brand">{row.opportunityScore.toFixed(1)}</strong> · {row.totalVolume ?? 0}{" "}
          records ({row.appPlayN} app/play at {row.appPlayRatePct}%, {row.redditN} reddit at {row.redditRatePct}%)
          {row.confidence && (
            <>
              {" "}
              · extraction confidence <strong>{row.confidence.score}</strong>
            </>
          )}
        </p>
      </div>

      {/* Sentiment / outcome mix */}
      <section>
        <p className="mb-1 text-[11px] font-semibold uppercase text-ink-faint nav-tab">Most common outcome</p>
        {outcomes.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No <code className="text-xs">post_purchase_outcome</code> was extracted for any record in this theme — the
            field is sparse by design and this theme&apos;s records simply didn&apos;t state one.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {outcomes.map(([outcome, n]) => {
                const tone = OUTCOME_TONE[outcome] ?? OUTCOME_TONE.unclear;
                return (
                  <span key={outcome} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`}>
                    {tone.label} · {n}
                  </span>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              Stated on {row.outcomeMix?.coveredN ?? 0} of {row.outcomeMix?.ofN ?? 0} app/play records for this theme —
              this is an extracted field with a fixed vocabulary, not a sentiment model, and it only exists on the
              retrospective lens.
            </p>
          </>
        )}
      </section>

      {/* Intent mix */}
      <section>
        <p className="mb-1.5 text-[11px] font-semibold uppercase text-ink-faint nav-tab">Who is stalling here</p>
        <div className="space-y-1.5">
          {intents.map(([signal, n]) => (
            <div key={signal} className="flex items-center gap-2 text-xs">
              <span className="w-40 shrink-0 text-ink-soft">{INTENT_LABEL[signal] ?? signal}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${intentTotal ? (n / intentTotal) * 100 : 0}%`,
                    backgroundColor: signal === "buy-intent" ? "var(--color-ordinal-700)" : "var(--color-ordinal-300)",
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-semibold text-ink">{n}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">
          A blocker that only hits bookmarkers barely moves the north-star metric — buy-intent share is what makes this
          worth fixing.
        </p>
      </section>

      {/* Observed resolution paths */}
      <section className="rounded-xl border border-mint/30 bg-mint-soft/30 p-3.5">
        <p className="mb-1 text-[11px] font-semibold uppercase text-ink-faint nav-tab">What actually unstuck people</p>
        <p className="mb-2.5 text-[11px] text-ink-faint">
          Observed in the corpus — <em>not</em> a proposed feature. This engine&apos;s scope ends at identify / quantify /
          compare (problem_statement.md §13); solution design is a separate, later stage gated on these findings plus
          interviews.
        </p>

        {hasResolution ? (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">Most repeated resolution reason</p>
            <p className="text-sm font-medium text-ink">{row.resolutionReason}</p>
            {priceCapped && (
              <p className="mt-1 rounded-lg bg-[var(--color-status-warning-soft)] px-2.5 py-1.5 text-[11px] text-[#a15c00]">
                This resolution is a monetary lever, which this project explicitly cannot use — so it counts as evidence
                of the blocker, not as an available fix. {row.addressabilityNote}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">Most repeated resolution reason</p>
            <p className="text-sm text-ink-soft">
              <strong>Not enough data yet.</strong> No repeated resolution path appears for this theme, which is itself
              the finding: Resolution Leverage is the most decision-useful score dimension, and it is currently unproven
              here. The interviews are what fill this gap — see <code className="text-xs">interview_guide.md</code>.
            </p>
          </div>
        )}

        <p className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">
          Workarounds people built themselves ({row.workarounds?.length ?? 0})
        </p>
        {row.workarounds?.length ? (
          <ul className="mt-1 space-y-1.5">
            {row.workarounds.map((w) => (
              <li key={w} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-0.5 shrink-0 text-mint" aria-hidden>
                  →
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">None stated for this theme.</p>
        )}
        <p className="mt-2 text-[11px] text-ink-faint">
          A stated workaround is the strongest unmet-need evidence in the schema — someone paid a real cost to route
          around a gap, and that cost is the spec for what a fix would have to remove.
        </p>
      </section>

      <section>
        <p className="mb-1 text-[11px] font-semibold uppercase text-ink-faint nav-tab">Sample quote</p>
        <p className="italic text-ink-soft">{row.sampleQuote}</p>
      </section>

      {row.confidence && (
        <section className="flex items-center gap-2 border-t border-line pt-3">
          <StatusPill status={row.confidence.label as Status} />
          <p className="text-[11px] text-ink-faint">
            {row.confidence.mix.high} high · {row.confidence.mix.medium} medium · {row.confidence.mix.low} low confidence
            extractions behind this theme
          </p>
        </section>
      )}
    </div>
  );
}
