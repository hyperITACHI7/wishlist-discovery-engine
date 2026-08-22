"use client";

import { useEffect, useRef, useState } from "react";
import StatTile from "./charts/StatTile";
import DivergingBarChart, { DivergingRow } from "./charts/DivergingBarChart";
import { SurveyFindings, SurveyHeavyVsLight } from "@/lib/types";

function Bars({ cells }: { cells: { label: string; valuePct: number; n: number; smallCell?: boolean }[] }) {
  return (
    <div className="space-y-2">
      {cells.map((cell) => (
        <div key={cell.label} className="flex items-center gap-2 text-xs">
          <span className="w-40 shrink-0 truncate text-ink-soft" title={cell.label}>
            {cell.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-mint"
              style={{
                width: `${cell.valuePct}%`,
                boxShadow: cell.smallCell ? "inset 0 0 0 1.5px var(--color-status-warning)" : undefined,
              }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-ink">
            {cell.valuePct}% <span className={cell.smallCell ? "text-[#a15c00]" : "text-ink-faint"}>(n={cell.n})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function buildHeavyVsLightRows(groups: SurveyHeavyVsLight["groups"] | undefined): DivergingRow[] {
  if (!groups || groups.length < 2) return [];
  const [heavy, light] = groups;
  const labels = Array.from(new Set([...heavy.cells.map((c) => c.label), ...light.cells.map((c) => c.label)]));
  return labels.map((label) => {
    const h = heavy.cells.find((c) => c.label === label);
    const l = light.cells.find((c) => c.label === label);
    return {
      id: label,
      label,
      leftValue: h?.valuePct ?? 0,
      leftN: h?.n ?? 0,
      rightValue: l?.valuePct ?? 0,
      rightN: l?.n ?? 0,
    };
  });
}

export default function SurveyPanel({ survey, jumpToField }: { survey: SurveyFindings | null; jumpToField?: string | null }) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!jumpToField) return;
    const el = cardRefs.current[jumpToField];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlighted(jumpToField);
      const t = setTimeout(() => setHighlighted(null), 2000);
      return () => clearTimeout(t);
    }
  }, [jumpToField]);

  if (!survey) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-soft">
        <p className="mb-2 font-semibold text-ink">No survey responses yet</p>
        <p>
          Run <code className="text-xs">python run_pipeline.py collect-survey</code> once responses come in, then{" "}
          <code className="text-xs">python -m extraction.survey_segments</code> to compute this panel.
        </p>
      </div>
    );
  }

  const heavyVsLightRows = buildHeavyVsLightRows(survey.heavyVsLightWishlisters?.groups);
  const maxHeavyLight = Math.max(...heavyVsLightRows.map((r) => Math.max(r.leftValue, r.rightValue)), 1);

  // Respondent-snapshot headline stats — pick out the most decision-relevant
  // single-glance numbers rather than making the reader scan all 13 charts.
  const topOf = (field: string) => survey.distributions.find((d) => d.field === field)?.cells[0];
  const ageTop = topOf("age");
  const cityTop = topOf("city_tier");
  const saveFreqTop = topOf("wishlist_save_frequency");

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-mint/30 bg-mint-soft px-4 py-3 text-sm text-ink">
        <span className="mt-0.5 text-mint">●</span>
        <p>
          <span className="font-semibold">Structured survey data, not AI-extracted.</span> These are the
          multiple-choice questions, counted directly rather than run through the LLM pipeline. The form also
          has a few open-text questions (why you saved something, what stopped you, a one-line complaint) —
          those are captured separately and not reflected in this panel yet. Never cross-tabbed against the
          review/Reddit themes in Panel A — respondents and reviewers are different, unlinked, anonymous
          populations. Self-selected convenience sample, not statistically representative.
        </p>
      </div>

      {/* Respondent snapshot */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Responses" value={survey.totalResponses} accent="brand" />
        {ageTop && <StatTile label="Most common age" value={ageTop.label} sublabel={`${ageTop.valuePct}% of respondents`} accent="mint" />}
        {cityTop && <StatTile label="Most common location" value={cityTop.label} sublabel={`${cityTop.valuePct}% of respondents`} accent="mint" />}
        {saveFreqTop && <StatTile label="Most common wishlist habit" value={saveFreqTop.label} sublabel={`${saveFreqTop.valuePct}% of respondents`} accent="gold" />}
      </div>

      {survey.heavyVsLightWishlisters && heavyVsLightRows.length > 0 && (
        <div className="mb-5 rounded-2xl border border-brand/30 bg-brand-soft/20 p-4">
          <p className="mb-1 text-sm font-semibold text-ink">{survey.heavyVsLightWishlisters.dimension}</p>
          <p className="mb-3 text-xs text-ink-faint">
            The one segment cut public reviews can&apos;t give — directly targets Q9 (&ldquo;how do behaviours
            differ across segments?&rdquo;), flagged Weak in Panel A&apos;s question coverage.
          </p>
          <DivergingBarChart
            rows={heavyVsLightRows}
            leftLegend={survey.heavyVsLightWishlisters.groups[0]?.label ?? "Heavy"}
            rightLegend={survey.heavyVsLightWishlisters.groups[1]?.label ?? "Light"}
            maxValue={maxHeavyLight}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {survey.distributions.map((d) => (
          <div
            key={d.field}
            ref={(el) => {
              cardRefs.current[d.field] = el;
            }}
            className={`rounded-2xl border bg-white p-4 transition-colors ${
              highlighted === d.field ? "border-brand ring-2 ring-brand/30" : "border-line"
            }`}
          >
            <p className="mb-3 text-sm font-semibold text-ink">{d.question}</p>
            <Bars cells={d.cells} />
          </div>
        ))}
      </div>
    </div>
  );
}
