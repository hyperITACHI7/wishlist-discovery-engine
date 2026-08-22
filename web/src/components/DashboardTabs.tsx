"use client";

import { useState } from "react";
import FindingsPanel from "./FindingsPanel";
import ExtractorPanel from "./ExtractorPanel";
import LimitationsPanel from "./LimitationsPanel";
import InterviewsPanel from "./InterviewsPanel";
import ResearchPanel from "./ResearchPanel";
import HowItWorksPanel from "./HowItWorksPanel";
import Modal from "./Modal";
import { DecisionFactorBucket, FunnelStage, OpportunityRow, OutcomeSummary, QuestionCoverageRow } from "@/lib/types";

// Restructured 2026-08-19: Limitations and the live extractor were full
// tabs competing for space with the views worth navigating to. Limitations
// is static prose (no interactivity) and the extractor is a tool, not a
// "view of the data" — both moved to on-demand triggers instead. See
// problem_statement.md's dashboard section.
//
// 2026-08-20: "How it works" joined the tab bar. It had been a section pinned
// below the dashboard, so a reader scrolling the findings ran into a full
// architecture explainer before finishing the analysis — method and results
// competing for one scroll. It's reference material you seek out, so it gets
// a tab and leaves the findings page to end on its own terms.
//
// 2026-08-20 (later): "Research findings" sits next to Interviews on purpose —
// both are evidence about this problem that did NOT come from the engine's own
// corpus, so grouping them keeps that boundary legible in the navigation
// itself, not just in each panel's copy.
//
// 2026-08-20 (later still): the "Survey segments" tab was removed along with
// the whole Google Forms source — see problem_statement.md §18.
const PANELS = [
  { id: "findings", label: "Findings" },
  { id: "interviews", label: "Interviews" },
  { id: "research", label: "Research findings" },
  { id: "how", label: "How it works" },
] as const;

type PanelId = (typeof PANELS)[number]["id"];

export default function DashboardTabs({
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
  const [panel, setPanel] = useState<PanelId>("findings");
  const [showExtractor, setShowExtractor] = useState(false);
  const [showLimitations, setShowLimitations] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex flex-wrap gap-2">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPanel(p.id)}
              className={`relative px-3 pb-3 text-sm font-semibold transition-colors ${
                panel === p.id ? "text-ink" : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {p.label}
              {panel === p.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-3">
          <button
            type="button"
            onClick={() => setShowExtractor(true)}
            className="rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold uppercase text-ink-soft nav-tab hover:border-ink hover:text-ink"
          >
            🔬 Try it yourself
          </button>
          <button
            type="button"
            onClick={() => setShowLimitations(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs font-bold text-ink-faint hover:border-ink hover:text-ink"
            aria-label="Limitations"
            title="Limitations"
          >
            ⓘ
          </button>
        </div>
      </div>

      {panel === "findings" && (
        <FindingsPanel
          pipelineHasRun={pipelineHasRun}
          opportunityRows={opportunityRows}
          questionCoverageRows={questionCoverageRows}
          pipelineFunnel={pipelineFunnel}
          decisionFactorBreakdown={decisionFactorBreakdown}
          postPurchaseOutcomeSummary={postPurchaseOutcomeSummary}
          narrative={narrative}
        />
      )}
      {panel === "interviews" && <InterviewsPanel />}
      {panel === "research" && <ResearchPanel />}
      {panel === "how" && <HowItWorksPanel />}

      {showExtractor && (
        <Modal title="Panel B · Live extractor" onClose={() => setShowExtractor(false)}>
          <ExtractorPanel />
        </Modal>
      )}
      {showLimitations && (
        <Modal title="Limitations" onClose={() => setShowLimitations(false)}>
          <LimitationsPanel />
        </Modal>
      )}
    </div>
  );
}
