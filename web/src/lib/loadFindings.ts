// Reads the real pipeline output, falling back to illustrative mock data if
// the pipeline hasn't produced anything usable yet.
//
// Rewritten 2026-08-20 for deployment. This previously read the JSON at
// request time with fs.readFileSync, resolving a path up into ../pipeline/.
// Two problems with that on a host: (1) only web/ gets deployed, and
// pipeline/data/ is gitignored, so the files were never there — the live site
// would have silently served mock data; (2) runtime file reads force the page
// to render dynamically, which means a serverless cold start on every first
// visit. Both go away by importing the JSON as modules: it's bundled at build
// time, so the findings page prerenders to static HTML and serves from the
// CDN with no function invocation at all.
//
// scripts/sync-findings.mjs copies pipeline/data/extracted/*.json into
// src/data/ and runs automatically before every build.
import findingsData from "@/data/findings.json";
import keywordsData from "@/data/keywords.json";
import narrativeData from "@/data/narrative.json";
import { crossTabMatrices as mockCrossTabMatrices, opportunityRows as mockOpportunityRows, questionCoverageRows as mockQuestionCoverageRows, pipelineFunnel as mockPipelineFunnel } from "./mockFindings";
import { CrossTabMatrix, FunnelStage, KeywordCloudData, OpportunityRow, QuestionCoverageRow } from "./types";

interface FindingsFile {
  totalRecords: number;
  totalAppPlay: number;
  totalReddit: number;
  opportunityRows: OpportunityRow[];
  questionCoverageRows: QuestionCoverageRow[];
  crossTabMatrices: CrossTabMatrix[];
  pipelineFunnel: FunnelStage[];
}

export interface LoadedFindings {
  pipelineHasRun: boolean;
  totalRecords?: number;
  totalAppPlay?: number;
  totalReddit?: number;
  opportunityRows: OpportunityRow[];
  questionCoverageRows: QuestionCoverageRow[];
  crossTabMatrices: CrossTabMatrix[];
  pipelineFunnel: FunnelStage[];
  keywords: KeywordCloudData | null;
  narrative: string | null;
}

export function loadFindings(): LoadedFindings {
  const findings = findingsData as unknown as FindingsFile;

  const keywords = keywordsData as unknown as KeywordCloudData;
  const narrative = (narrativeData as { narrative?: string })?.narrative ?? null;

  const hasRun = Array.isArray(findings?.opportunityRows) && findings.opportunityRows.length > 0;

  return {
    pipelineHasRun: hasRun,
    totalRecords: hasRun ? findings.totalRecords : undefined,
    totalAppPlay: hasRun ? findings.totalAppPlay : undefined,
    totalReddit: hasRun ? findings.totalReddit : undefined,
    opportunityRows: hasRun ? findings.opportunityRows : mockOpportunityRows,
    questionCoverageRows: hasRun ? findings.questionCoverageRows : mockQuestionCoverageRows,
    crossTabMatrices: hasRun ? (findings.crossTabMatrices ?? []) : mockCrossTabMatrices,
    pipelineFunnel: hasRun ? (findings.pipelineFunnel ?? []) : mockPipelineFunnel,
    keywords: keywords && (keywords.negative?.length || keywords.positive?.length) ? keywords : null,
    narrative,
  };
}
