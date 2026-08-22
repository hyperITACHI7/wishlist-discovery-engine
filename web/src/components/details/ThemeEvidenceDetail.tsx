"use client";

import { useState } from "react";
import QuadrantBadge from "../charts/QuadrantBadge";
import StatusPill, { Status } from "../charts/StatusPill";
import DivergingBarChart from "../charts/DivergingBarChart";
import { EvidenceRecord, OpportunityRow } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  playstore_review: "Play Store",
  appstore_review: "App Store",
  reddit_post: "Reddit post",
  reddit_comment: "Reddit comment",
};

const CONFIDENCE_DOT: Record<string, string> = {
  high: "bg-[var(--color-status-good)]",
  medium: "bg-[var(--color-status-warning)]",
  low: "bg-[var(--color-status-serious)]",
};

function EvidenceCard({ rec }: { rec: EvidenceRecord }) {
  const isReddit = rec.lens === "prospective";
  return (
    <li className="rounded-xl border border-line bg-white p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${
            isReddit ? "bg-mint-soft text-mint" : "bg-gold/10 text-[#a15c00]"
          }`}
        >
          {SOURCE_LABEL[rec.source] ?? rec.source}
        </span>
        {rec.subreddit && <span className="text-ink-faint">r/{rec.subreddit}</span>}
        {rec.date && <span className="text-ink-faint">{rec.date}</span>}
        <span className="flex items-center gap-1 text-ink-faint">
          <span className={`h-1.5 w-1.5 rounded-full ${CONFIDENCE_DOT[rec.confidence]}`} aria-hidden />
          {rec.confidence} confidence
        </span>
        <span className="rounded-full border border-line px-1.5 py-0.5 text-ink-soft">{rec.intentSignal}</span>
        {rec.productCategory !== "unclear" && (
          <span className="rounded-full border border-line px-1.5 py-0.5 text-ink-soft">{rec.productCategory}</span>
        )}
      </div>

      {rec.quote && <p className="mb-2 text-sm italic leading-relaxed text-ink">&ldquo;{rec.quote}&rdquo;</p>}

      <div className="space-y-1 text-xs">
        {rec.blocker && (
          <p className="text-ink-soft">
            <span className="font-semibold text-ink-faint">Blocker: </span>
            {rec.blocker}
          </p>
        )}
        {rec.workaround && (
          <p className="text-ink-soft">
            <span className="font-semibold text-mint">Workaround: </span>
            {rec.workaround}
          </p>
        )}
        {rec.resolutionReason && (
          <p className="text-ink-soft">
            <span className="font-semibold text-ink-faint">Resolved by: </span>
            {rec.resolutionReason}
          </p>
        )}
      </div>

      {rec.sourceUrl && (
        <a
          href={rec.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] font-semibold text-brand hover:underline"
        >
          View source ↗
        </a>
      )}
    </li>
  );
}

// The full drill-down behind one opportunity area: every source record that
// carries the theme, then the synthesized read of them underneath.
//
// Order matters here — evidence first, interpretation second. The reader
// should be able to look at the raw reviews and Reddit posts and form their
// own read before the engine tells them what it concluded, which is the whole
// argument for a discovery engine over a summarizer.
export default function ThemeEvidenceDetail({ row }: { row: OpportunityRow }) {
  const evidence = row.evidence ?? [];
  const [lensFilter, setLensFilter] = useState<"all" | "retrospective" | "prospective">("all");

  const appPlayCount = evidence.filter((e) => e.lens === "retrospective").length;
  const redditCount = evidence.filter((e) => e.lens === "prospective").length;
  const shown = lensFilter === "all" ? evidence : evidence.filter((e) => e.lens === lensFilter);

  const filters = [
    { id: "all" as const, label: `All (${evidence.length})` },
    { id: "retrospective" as const, label: `App/Play (${appPlayCount})` },
    { id: "prospective" as const, label: `Reddit (${redditCount})` },
  ];

  const hasResolution = row.resolutionReason && row.resolutionReason !== "not enough data yet";

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-ink">{row.area}</h3>
          {row.quadrant && <QuadrantBadge quadrant={row.quadrant} />}
          {row.confidence && <StatusPill status={row.confidence.label as Status} />}
        </div>
        <p className="text-sm text-ink-soft">
          Opportunity Score <strong className="text-brand">{row.opportunityScore.toFixed(1)}</strong> · {evidence.length}{" "}
          source records
        </p>
      </div>

      <DivergingBarChart
        leftLegend="App/Play"
        rightLegend="Reddit"
        maxValue={Math.max(row.appPlayRatePct, row.redditRatePct, 1)}
        rows={[
          {
            id: row.area,
            label: "hesitation / blocker rate within each source",
            leftValue: row.appPlayRatePct,
            leftN: row.appPlayN,
            rightValue: row.redditRatePct,
            rightN: row.redditN,
          },
        ]}
      />

      {/* Raw evidence — the reviews and posts themselves */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase text-ink-faint nav-tab">Source records</p>
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLensFilter(f.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  lensFilter === f.id ? "bg-brand-soft text-brand" : "text-ink-faint hover:text-ink-soft"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl bg-surface px-3 py-4 text-sm text-ink-faint">
            No records from this source carry this theme. That asymmetry is itself a finding — a theme strong in one lens
            and absent in the other says something about where the behaviour gets narrated.
          </p>
        ) : (
          <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {shown.map((rec, i) => (
              <EvidenceCard key={`${rec.sourceUrl}-${i}`} rec={rec} />
            ))}
          </ul>
        )}
      </section>

      {/* Interpretation — after the evidence, never before it */}
      <section className="rounded-xl border border-brand/30 bg-brand-soft/20 p-3.5">
        <p className="mb-2 text-[11px] font-semibold uppercase text-ink-faint nav-tab">What the engine reads from this</p>

        <div className="space-y-2.5 text-sm">
          <p className="text-ink-soft">
            <span className="font-semibold text-ink">Where it shows up: </span>
            {row.appPlayN} of {row.totalVolume ?? 0} records come from App/Play ({row.appPlayRatePct}% of that source),{" "}
            {row.redditN} from Reddit ({row.redditRatePct}% of that source).{" "}
            {row.appPlayN > 0 && row.redditN === 0 && "Absent from Reddit entirely — a retrospective-lens-only signal."}
            {row.redditN > 0 && row.appPlayN === 0 && "Absent from App/Play entirely — only surfaces while people are still deciding."}
          </p>

          <p className="text-ink-soft">
            <span className="font-semibold text-ink">Resolution leverage: </span>
            {hasResolution ? (
              <>
                &ldquo;{row.resolutionReason}&rdquo; is the most repeated path out.
                {row.addressabilityNote && " That path is a monetary lever this project can't use, so it reads as evidence, not as an available fix."}
              </>
            ) : (
              "Not enough data yet — no repeated resolution path, which means this theme's most decision-useful dimension is still unproven. The interviews target exactly this gap."
            )}
          </p>

          {row.workarounds && row.workarounds.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-ink">Unmet-need signal: </span>
              <span className="text-sm text-ink-soft">
                {row.workarounds.length} distinct workaround{row.workarounds.length === 1 ? "" : "s"} described — people
                are paying a real cost to route around this.
              </span>
              <ul className="mt-1.5 space-y-1">
                {row.workarounds.map((w) => (
                  <li key={w} className="flex gap-2 text-xs text-ink-soft">
                    <span className="mt-0.5 shrink-0 text-mint" aria-hidden>
                      →
                    </span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {row.confidence && (
            <p className="text-[11px] text-ink-faint">
              Extraction confidence {row.confidence.score}/100 across these records ({row.confidence.mix.high} high,{" "}
              {row.confidence.mix.medium} medium, {row.confidence.mix.low} low). This is the extractor&apos;s own
              certainty, not a statistical confidence interval.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
