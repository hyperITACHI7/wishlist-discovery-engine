"use client";

import { useMemo, useState } from "react";
import StatTile from "./charts/StatTile";
import RankedBarChart from "./charts/RankedBarChart";
import PipelineFunnel from "./charts/PipelineFunnel";
import CrossTabMatrixChart from "./charts/CrossTabMatrix";
import KeywordCloud from "./charts/KeywordCloud";
import AiSynthesisCard from "./AiSynthesisCard";
import ChatbotPanel from "./ChatbotPanel";
import Modal from "./Modal";
import OpportunityAreasDetail from "./details/OpportunityAreasDetail";
import TopOpportunityDetail from "./details/TopOpportunityDetail";
import QuestionCoverageDetail from "./details/QuestionCoverageDetail";
import WorkaroundsDetail from "./details/WorkaroundsDetail";
import ThemeEvidenceDetail from "./details/ThemeEvidenceDetail";
import { CrossTabMatrix, FunnelStage, KeywordCloudData, OpportunityRow, QuestionCoverageRow } from "@/lib/types";

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
  crossTabMatrices,
  pipelineFunnel,
  keywords,
  narrative,
}: {
  pipelineHasRun: boolean;
  opportunityRows: OpportunityRow[];
  questionCoverageRows: QuestionCoverageRow[];
  crossTabMatrices: CrossTabMatrix[];
  pipelineFunnel: FunnelStage[];
  keywords: KeywordCloudData | null;
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

      {/* Keyword Buzz */}
      {keywords && (
        <div className="mb-6">
          <KeywordCloud keywords={keywords} />
        </div>
      )}

      {/* Cross-tabs — one joint matrix per theme, not two marginals */}
      {crossTabMatrices.length > 0 && (
        <div className="mb-6">
          <div className="mb-3">
            <p className="text-sm font-semibold text-ink">Cross-tabs — who is stalling, and on what</p>
            <p className="text-[11px] leading-relaxed text-ink-faint">
              One table per theme crossing <strong>product category</strong> against <strong>purchase intent</strong>.
              This replaced two separate bar charts that were the two edges of this same table — showing them apart hid
              the only thing worth knowing: whether the apparel records <em>are</em> the buy-intent ones.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {crossTabMatrices.map((m) => (
              <CrossTabMatrixChart key={m.theme} matrix={m} />
            ))}
          </div>
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
