import Nav from "@/components/Nav";
import DashboardTabs from "@/components/DashboardTabs";
import SourceRibbon from "@/components/SourceRibbon";
import { loadFindings } from "@/lib/loadFindings";

// Statically prerendered at build time (2026-08-20). This was force-dynamic
// back when loadFindings() read JSON off disk per request. The findings are a
// cached, precomputed corpus run that doesn't change between deploys, so
// there was never a reason to re-render them per visitor — and rendering
// statically means the page ships as HTML from the CDN with no serverless
// invocation, so there's no cold start on first visit. The two live features
// (the extractor and the assistant) are their own API routes and are
// unaffected.

export default function Home() {
  const { pipelineHasRun, opportunityRows, questionCoverageRows, pipelineFunnel, decisionFactorBreakdown, postPurchaseOutcomeSummary, totalRecords, totalAppPlay, totalReddit, narrative } = loadFindings();

  return (
    <div className="flex flex-1 flex-col">
      <Nav />

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase text-brand nav-tab">AI Discovery Engine</p>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Why wishlisted items don&apos;t become purchases — quantified, not guessed.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Mines public App/Play Store reviews and Reddit comments about Myntra, extracts why
            people stall between saving an item and buying it, and ranks the opportunity areas so the fix can
            be argued, not assumed.
          </p>
        </div>
      </section>

      {pipelineHasRun && (
        <SourceRibbon
          totalRecords={totalRecords ?? 0}
          totalAppPlay={totalAppPlay ?? 0}
          totalReddit={totalReddit ?? 0}
        />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <DashboardTabs
          pipelineHasRun={pipelineHasRun}
          opportunityRows={opportunityRows}
          questionCoverageRows={questionCoverageRows}
          pipelineFunnel={pipelineFunnel}
          decisionFactorBreakdown={decisionFactorBreakdown}
          postPurchaseOutcomeSummary={postPurchaseOutcomeSummary}
          narrative={narrative}
        />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-faint sm:px-6">
          {pipelineHasRun ? (
            <>
              Wishlist Discovery Engine — real corpus: {totalRecords} extracted records ({totalAppPlay} App/Play
              Store, {totalReddit} Reddit). Regenerate via <code>pipeline/extraction/score.py</code>.
            </>
          ) : (
            <>
              Wishlist Discovery Engine — Day 1 hosting skeleton. Collection pipeline in{" "}
              <code>pipeline/</code>, corpus not yet run.
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
