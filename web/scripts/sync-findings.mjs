// Copies the pipeline's JSON outputs into web/src/data/ so they can be
// imported as modules and bundled at build time.
//
// WHY THIS EXISTS: the dashboard used to read these files at request time via
// fs, resolving a path up into ../pipeline/. That works locally but breaks on
// any host that deploys only the web/ directory — and pipeline/data/ is
// gitignored anyway, so the files would never reach the host at all. Reading
// them at runtime also forced the page to be dynamically rendered, which means
// a serverless cold start on every first visit. Bundling them instead lets the
// whole findings page prerender to static HTML and serve from the CDN.
//
// Runs automatically before `npm run build` (see package.json "prebuild").
// If the pipeline directory isn't present — which is the normal case on a
// deploy host — it leaves the committed copies alone and exits cleanly. That
// is the intended path, not a failure.

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const pipelineDir = join(webRoot, "..", "pipeline", "data", "extracted");
const outDir = join(webRoot, "src", "data");

// Only the files the dashboard actually reads. phrases.json and themes.json
// are intermediate pipeline artifacts the web app never touches — shipping
// them would add ~100KB to the bundle for nothing.
const FILES = ["findings.json", "keywords.json", "narrative.json"];

if (!existsSync(pipelineDir)) {
  console.log(`[sync-findings] No pipeline directory at ${pipelineDir} — using the committed copies in src/data/.`);
  const committed = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith(".json")) : [];
  if (committed.length === 0) {
    console.error("[sync-findings] ERROR: no pipeline data AND no committed data. The dashboard will render its mock fallback.");
    process.exit(1);
  }
  console.log(`[sync-findings] Found ${committed.length} committed file(s): ${committed.join(", ")}`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

let copied = 0;
let missing = [];
for (const name of FILES) {
  const src = join(pipelineDir, name);
  if (!existsSync(src)) {
    missing.push(name);
    continue;
  }
  copyFileSync(src, join(outDir, name));
  copied += 1;
  const kb = (statSync(src).size / 1024).toFixed(1);
  console.log(`[sync-findings] ${name} (${kb} KB)`);
}

console.log(`[sync-findings] Copied ${copied}/${FILES.length} file(s) into src/data/.`);

if (missing.length) {
  // Not fatal: narrative.json and keywords.json are optional pipeline steps,
  // and the dashboard degrades gracefully when either is absent.
  console.log(`[sync-findings] Not produced yet (optional): ${missing.join(", ")}`);
}
