// Reserved slot for the 5-6 user interviews (execution timeline Days 4-7),
// designed now rather than bolted on later. Same treatment as Reddit quotes
// once real interviews exist: short attributed excerpts tagged by segment,
// explicitly small-n qualitative — never counted into the Panel A rates.
//
// With the survey removed (problem_statement.md §18), these interviews are
// now the ONLY input to Q9 (segment differences), which raises what they
// have to carry — see interview_guide.md.
export default function InterviewsPanel() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
      <p className="mb-1 text-sm font-semibold text-ink">Interviews — reserved, not run yet</p>
      <p className="mx-auto max-w-md text-xs leading-relaxed text-ink-soft">
        5-6 user interviews are part of the primary research plan (execution timeline Days 4-7), separate from
        this AI discovery engine. When they&apos;re done, this panel will hold short attributed quotes tagged by
        segment — same small-n, never-counted-into-rates treatment as everything else that isn&apos;t the
        automated corpus, and never cross-tabbed against the review/Reddit themes, since interviewees and public
        reviewers are separate, unlinked populations.
      </p>
    </div>
  );
}
