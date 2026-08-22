"use client";

import { useMemo, useState } from "react";
import StatTile from "./charts/StatTile";
import RankedBarChart from "./charts/RankedBarChart";
import PipelineFunnel from "./charts/PipelineFunnel";
import OutcomeMixBar from "./charts/OutcomeMixBar";
import AiSynthesisCard from "./AiSynthesisCard";
import ChatbotPanel from "./ChatbotPanel";
import Modal from "./Modal";
import OpportunityAreasDetail from "./details/OpportunityAreasDetail";
import TopOpportunityDetail from "./details/TopOpportunityDetail";
import QuestionCoverageDetail from "./details/QuestionCoverageDetail";
import WorkaroundsDetail from "./details/WorkaroundsDetail";
import ThemeEvidenceDetail from "./details/ThemeEvidenceDetail";
import { DecisionFactorBucket, FunnelStage, OpportunityRow, OutcomeSummary, QuestionCoverageRow } from "@/lib/types";

// Which stat card's detail view is open, if any.
type CardId = "areas" | "top" | "coverage" | "workarounds";

const CARD_TITLES: Record<CardId, string> = {
  areas: "All opportunity areas",
  top: "Top opportunity — full breakdown",
  coverage: "Coverage of the brief's 10 questions",
  workarounds: "Themes with a stated workaround",
};

export default function FindingsPanel({
  pipelineHasRun,
  opportunityRows,
  questionCoverageRows,
  pipelineFunnel,
  decisionFactorBreakdown,
  postPurchaseOutcomeSummary,
  narrative,
}: {
  pipelineHasRun: boolean;
  opportunityRows: OpportunityRow[];
  questionCoverageRows: QuestionCoverageRow[];
  pipelineFunnel: FunnelStage[];
  decisionFactorBreakdown: DecisionFactorBucket[];
  postPurchaseOutcomeSummary: OutcomeSummary;
  narrative: string | null;
}) {
  const sorted = useMemo(
    () => [...opportunityRows].sort((a, b) => b.opportunityScore - a.opportunityScore),
    [opportunityRows],
  );

  const [openCard, setOpenCard] = useState<CardId | null>(null);
  // Theme drill-down is its own modal so it can be opened from three places:
  // the ranked chart, the all-areas table, and the workarounds list.
  const [openTheme, setOpenTheme] = useState<string | null>(null);

  const themeRow = sorted.find((r) => r.area === openTheme) ?? null;
  const maxScore = Math.max(...sorted.map((r) => r.opportunityScore), 1);

  const strongCount = questionCoverageRows.filter((r) => r.confidence === "Strong").length;
  const mediumCount = questionCoverageRows.filter((r) => r.confidence === "Medium").length;
  const workaroundCount = sorted.filter((r) => r.hasWorkaround).length;

  function openThemeFrom(area: string) {
    setOpenCard(null);
    setOpenTheme(area);
  }

  return (
    <div>
      {!pipelineHasRun && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
          <span className="mt-0.5 text-gold">●</span>
          <p>
            <span className="font-semibold">Demo data.</span> The rows below illustrate the intended output shape only —
            not real findings about Myntra users.
          </p>
        </div>
      )}

      {/* Headline stats — every card opens its own full view */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Opportunity areas"
          value={sorted.length}
          accent="brand"
          onClick={() => setOpenCard("areas")}
          actionLabel="See all"
        />
        <StatTile
          label="Top opportunity"
          value={sorted[0]?.opportunityScore.toFixed(1) ?? "—"}
          sublabel={sorted[0]?.area}
          accent="brand"
          onClick={() => setOpenCard("top")}
          actionLabel="Break it down"
        />
        <StatTile
          label="Brief questions covered"
          value={`${strongCount + mediumCount}/${questionCoverageRows.length}`}
          sublabel="Strong or Medium confidence"
          accent="mint"
          onClick={() => setOpenCard("coverage")}
          actionLabel="See all 10"
        />
        <StatTile
          label="Themes with a workaround"
          value={workaroundCount}
          sublabel="strongest unmet-need signal"
          accent="gold"
          onClick={() => setOpenCard("workarounds")}
          actionLabel="See workarounds"
        />
      </div>

      {/* Pipeline funnel */}
      {pipelineFunnel.length > 0 && (
        <div className="mb-6">
          <PipelineFunnel stages={pipelineFunnel} />
        </div>
      )}

      {/* Ranked leaderboard — click a theme for its full evidence */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm font-semibold text-ink">Ranked by Opportunity Score</p>
        <p className="mb-3 text-[11px] text-ink-faint">
          Click any theme to read every review and Reddit post behind it, plus what the engine concludes from them.
        </p>
        <RankedBarChart
          data={sorted.map((r) => ({
            id: r.area,
            label: r.area,
            value: r.opportunityScore,
            sublabel: r.addressabilityNote,
            quadrant: r.quadrant,
          }))}
          maxValue={maxScore}
          onSelect={setOpenTheme}
          selectedId={openTheme}
        />
      </div>

      {/* Decision factors — what shoppers say they weigh, not exclusively wishlist-specific */}
      {decisionFactorBreakdown.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">Decision Factors — what shoppers say they weigh</p>
          <p className="mb-3 text-[11px] leading-relaxed text-ink-faint">
            Every factor a reviewer raised themselves ({decisionFactorBreakdown.reduce((sum, b) => sum + b.count, 0)} mentions across{" "}
            {decisionFactorBreakdown.length} categories), bucketed by a keyword-marker classifier. This is general
            purchase-decision language — quality, price, delivery — not exclusively about wishlist hesitation; that
            narrower signal is too sparse in public text to chart on its own.
          </p>
          <RankedBarChart
            data={decisionFactorBreakdown.map((b) => ({
              id: b.category,
              label: b.category,
              value: b.count,
              sublabel: `e.g. ${b.examplePhrases.join(", ")}`,
            }))}
            maxValue={Math.max(...decisionFactorBreakdown.map((b) => b.count), 1)}
          />
        </div>
      )}

      {/* Post-purchase outcome — corpus-wide rollup of a per-theme field */}
      {postPurchaseOutcomeSummary.coveredN > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">What Happens After Purchase</p>
          <p className="mb-3 text-[11px] leading-relaxed text-ink-faint">
            Corpus-wide post_purchase_outcome, App/Play reviews only (retrospective lens) — the same field already
            broken down per opportunity area, rolled up here across the whole corpus.
          </p>
          <OutcomeMixBar summary={postPurchaseOutcomeSummary} />
        </div>
      )}

      {/* AI Synthesis */}
      {narrative && (
        <div className="mb-6">
          <AiSynthesisCard narrative={narrative} />
        </div>
      )}

      {/* Assistant */}
      <ChatbotPanel />

      {/* Stat-card detail modals */}
      {openCard && (
        <Modal title={CARD_TITLES[openCard]} onClose={() => setOpenCard(null)}>
          {openCard === "areas" && <OpportunityAreasDetail rows={sorted} onOpenTheme={openThemeFrom} />}
          {openCard === "top" && sorted[0] && <TopOpportunityDetail row={sorted[0]} />}
          {openCard === "coverage" && <QuestionCoverageDetail rows={questionCoverageRows} />}
          {openCard === "workarounds" && <WorkaroundsDetail rows={sorted} onOpenTheme={openThemeFrom} />}
        </Modal>
      )}

      {/* Theme evidence drill-down */}
      {themeRow && (
        <Modal title="Evidence behind this opportunity" onClose={() => setOpenTheme(null)}>
          <ThemeEvidenceDetail row={themeRow} />
        </Modal>
      )}
    </div>
  );
}
