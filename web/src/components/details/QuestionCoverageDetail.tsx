"use client";

import StatusPill, { Status } from "../charts/StatusPill";
import ConfidenceRing from "../charts/ConfidenceRing";
import { QuestionCoverageRow } from "@/lib/types";

// All 10 brief questions with what was actually found for each — the real top
// phrases from the extraction field that answers it, not just a fill-rate.
// A coverage view that only reports "captured in 3/578" tells the reader how
// MUCH was found but never WHAT, which is the part that matters.
export default function QuestionCoverageDetail({ rows }: { rows: QuestionCoverageRow[] }) {
  const strong = rows.filter((r) => r.confidence === "Strong").length;
  const medium = rows.filter((r) => r.confidence === "Medium").length;
  const weak = rows.filter((r) => r.confidence === "Weak").length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-sm leading-relaxed text-ink-soft">
          The brief poses 10 questions. An engine that claims to answer all of them equally well from public text is
          less trustworthy than one that knows its own blind spots — so each row shows what was found, from which
          extraction field, and how confident that is.
        </p>
        <ConfidenceRing strong={strong} medium={medium} weak={weak} />
      </div>

      <ul className="divide-y divide-line">
        {rows.map((row) => {
          return (
            <li key={row.question} className="py-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{row.question}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {row.finding}
                    {row.coveragePct !== undefined && (
                      <span className="text-ink-faint"> · {row.coveragePct}% coverage</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill status={row.confidence as Status} />
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-ink-soft nav-tab">
                    {row.answeredBy}
                  </span>
                </div>
              </div>

              {row.insights && row.insights.length > 0 ? (
                <div className="mt-2 rounded-xl bg-surface p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase text-ink-faint nav-tab">
                    What the corpus actually said
                    {row.fields && <span className="ml-1 font-normal normal-case">· from {row.fields.join(", ")}</span>}
                  </p>
                  <ul className="space-y-1">
                    {row.insights.map((ins) => (
                      <li key={`${ins.field}-${ins.phrase}`} className="flex gap-2 text-xs text-ink-soft">
                        <span className="shrink-0 font-semibold text-ink-faint">{ins.count}×</span>
                        <span>{ins.phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-xs text-ink-faint">
                  No phrases extracted for this question&apos;s field
                  {row.fields && <> (<code className="text-[11px]">{row.fields.join(", ")}</code>)</>} — handed to the
                  interview stage rather than answered thinly.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
