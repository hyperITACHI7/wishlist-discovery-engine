import PipelineDiagram from "./PipelineDiagram";

// Moved out of page.tsx into its own tab 2026-08-20. It had been a section
// pinned below the dashboard, which meant a reader scrolling the findings hit
// a full architecture explainer before reaching the end of the analysis —
// method and results competing for the same scroll. It's reference material
// you go to deliberately, so it gets a tab.
export default function HowItWorksPanel() {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-brand nav-tab">How it works</p>
      <h2 className="mb-6 max-w-2xl text-xl font-bold text-ink sm:text-2xl">
        Freeform extraction first, taxonomy second — so the findings come from the corpus, not from our assumptions.
      </h2>

      <PipelineDiagram />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="mb-1.5 text-sm font-semibold text-ink">Why freeform extraction, not a fixed taxonomy</p>
          <p className="text-xs leading-relaxed text-ink-soft">
            Classifying against a known list of blockers (&ldquo;fit / price / trust / styling&rdquo;) would be faster,
            but it primes the model with our assumptions before it reads a single review — the anchoring bias that
            produces &ldquo;findings&rdquo; which are really just the researcher&apos;s hypotheses reflected back. Here,
            nothing is shown to the model at extraction time. Themes are named afterwards, from what the corpus
            actually said, and only then mapped onto the brief&apos;s seven named factors plus an explicit emergent
            bucket.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="mb-1.5 text-sm font-semibold text-ink">Two lenses on one problem</p>
          <p className="text-xs leading-relaxed text-ink-soft">
            App/Play Store reviewers already bought — they resolved their hesitation, and a minority narrate{" "}
            <em>what tipped them</em>. Reddit catches people still stuck, mid-decision. Neither is the whole picture;
            together they give both the blocker and the way out. That&apos;s what makes Resolution Leverage — the most
            decision-useful score dimension — measurable at all.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="mb-1.5 text-sm font-semibold text-ink">The quantification layer</p>
          <p className="text-xs leading-relaxed text-ink-soft">
            Rates are always reported <em>within</em> their own source with n shown, never pooled — App/Play volume
            would otherwise silently dominate Reddit. Cross-tabs go beyond single-variable frequency. The Opportunity
            Score is the geometric mean of five 1–5 dimensions, with all five raw inputs kept visible so the ranking
            stays arguable rather than being a black box.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="mb-1.5 text-sm font-semibold text-ink">What&apos;s a judgment call, and labelled as one</p>
          <p className="text-xs leading-relaxed text-ink-soft">
            Four of the five score dimensions are computed from the data. The fifth — non-monetary addressability —
            is a deliberate judgment call, because this project may not use price levers. It&apos;s kept visibly
            separate rather than dressed up as measured, since presenting a subjective score as objective precision is
            exactly the failure mode this engine is built to avoid.
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-faint">
        Full design rationale, the extraction schema, rejected alternatives, and the question-to-source routing map live
        in <code>problem_statement.md</code> at the project root. Collector and prompt code behind every node above is
        in <code>pipeline/</code> and <code>web/src/lib/groq.ts</code>. Known blind spots and the interview questions
        aimed at them are in <code>interview_guide.md</code>.
      </p>
    </div>
  );
}
