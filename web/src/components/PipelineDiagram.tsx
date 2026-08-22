// n8n-style node/connector diagram of the actual pipeline described in
// problem_statement.md §5-10. Data-driven: NODES + EDGES define the graph,
// the render pass turns node rects into anchor points and draws bezier
// connectors between them. Keep node copy in sync with problem_statement.md
// and pipeline/ if either changes.

type Category =
  | "source"
  | "lensProspective"
  | "lensRetrospective"
  | "core"
  | "view"
  | "dashboard"
  | "live";

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  category: Category;
  dot?: string;
  badge?: string;
}

type Side = "left" | "right" | "top" | "bottom";

interface Edge {
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
  kind: "main" | "meta" | "live";
  label?: string;
}

const NODES: Node[] = [
  // --- Sources ---
  // YouTube dropped 2026-08-19 — no videos found with both meaningful
  // comment volume and decision-relevant discussion (problem_statement.md §9).
  { id: "reddit", x: 20, y: 24, w: 210, h: 66, title: "Reddit", subtitle: "Unauthenticated .json endpoints — no OAuth app available anymore", category: "source", dot: "#FF4500" },
  { id: "playstore", x: 20, y: 116, w: 210, h: 66, title: "Play Store", subtitle: "google-play-scraper · com.myntra.android", category: "source", dot: "#01875f" },
  { id: "appstore", x: 20, y: 208, w: 210, h: 66, title: "App Store", subtitle: "app-store-scraper · iOS reviews, India", category: "source", dot: "#111111" },

  // --- Lens routing ---
  { id: "prospective", x: 300, y: 6, w: 210, h: 102, title: "Prospective lens", subtitle: "“Still deciding” — fed by Reddit", category: "lensProspective" },
  { id: "retrospective", x: 300, y: 144, w: 210, h: 102, title: "Retrospective lens", subtitle: "“Already bought” — Play + App Store feed this lens", category: "lensRetrospective" },

  // --- Core pipeline ---
  { id: "extract", x: 580, y: 48, w: 230, h: 156, title: "Freeform extraction", subtitle: "1 pass per item · source-conditional prompt · no taxonomy shown to the model · Groq gpt-oss-20b (fast)", category: "core", badge: "1" },
  { id: "dedupe", x: 880, y: 85, w: 210, h: 82, title: "Dedupe + count", subtitle: "Plain code, not an LLM — groups repeated phrases, counts frequency", category: "core", badge: "2" },
  { id: "synthesis", x: 1160, y: 53, w: 230, h: 146, title: "Synthesis (1 call)", subtitle: "Groq gpt-oss-120b (large) · names emergent themes, then maps them to the 7 named factors + emergent bucket", category: "core", badge: "3" },

  // --- Output views ---
  { id: "view1", x: 1460, y: 6, w: 210, h: 92, title: "Opportunity table", subtitle: "Freq × Severity × Intent × Resolution leverage × Addressability", category: "view", badge: "4" },
  { id: "view2", x: 1460, y: 128, w: 210, h: 92, title: "Question coverage", subtitle: "10 brief questions × finding × confidence × who answers", category: "view" },
  { id: "view3", x: 1460, y: 250, w: 210, h: 92, title: "Cross-tabs", subtitle: "theme × intent / category / segment / workaround", category: "view" },

  // --- Dashboard ---
  { id: "panelA", x: 1740, y: 60, w: 200, h: 92, title: "Panel A", subtitle: "Findings — cached, static per page load", category: "dashboard" },
  { id: "panelC", x: 1740, y: 250, w: 200, h: 92, title: "Panel C", subtitle: "Limitations — n per source, null rates, biases", category: "dashboard" },

  // --- Live single-item path (Panel B) ---
  { id: "visitor", x: 580, y: 440, w: 230, h: 72, title: "Visitor pastes text", subtitle: "Panel B UI — picks a lens manually, no batch involved", category: "live" },
  { id: "panelB", x: 1740, y: 440, w: 200, h: 72, title: "Panel B", subtitle: "Live extractor — real Groq call, per visitor, instant", category: "live" },
];

const EDGES: Edge[] = [
  { from: "reddit", fromSide: "right", to: "prospective", toSide: "left", kind: "main" },
  { from: "playstore", fromSide: "right", to: "retrospective", toSide: "left", kind: "main" },
  { from: "appstore", fromSide: "right", to: "retrospective", toSide: "left", kind: "main" },
  { from: "prospective", fromSide: "right", to: "extract", toSide: "left", kind: "main", label: "raw text items" },
  { from: "retrospective", fromSide: "right", to: "extract", toSide: "left", kind: "main", label: "raw text items" },
  { from: "extract", fromSide: "right", to: "dedupe", toSide: "left", kind: "main", label: "structured JSON / item" },
  { from: "dedupe", fromSide: "right", to: "synthesis", toSide: "left", kind: "main", label: "counted phrases" },
  { from: "synthesis", fromSide: "right", to: "view1", toSide: "left", kind: "main" },
  { from: "synthesis", fromSide: "right", to: "view2", toSide: "left", kind: "main" },
  { from: "synthesis", fromSide: "right", to: "view3", toSide: "left", kind: "main" },
  { from: "view1", fromSide: "right", to: "panelA", toSide: "left", kind: "main" },
  { from: "view2", fromSide: "right", to: "panelA", toSide: "left", kind: "main" },
  { from: "view3", fromSide: "right", to: "panelA", toSide: "left", kind: "main" },
  { from: "dedupe", fromSide: "bottom", to: "panelC", toSide: "top", kind: "meta", label: "n per source · null rates · biases" },
  { from: "visitor", fromSide: "top", to: "extract", toSide: "bottom", kind: "live", label: "same prompt logic" },
  { from: "extract", fromSide: "bottom", to: "panelB", toSide: "top", kind: "live", label: "bypasses dedupe + synthesis" },
];

const CATEGORY_STYLE: Record<Category, { border: string; bg: string; title: string; sub: string; chip?: string }> = {
  source: { border: "border-line", bg: "bg-white", title: "text-ink", sub: "text-ink-faint" },
  lensProspective: { border: "border-mint/50", bg: "bg-mint-soft", title: "text-mint", sub: "text-ink-soft" },
  lensRetrospective: { border: "border-gold/50", bg: "bg-gold/10", title: "text-[#a15c00]", sub: "text-ink-soft" },
  core: { border: "border-brand/50", bg: "bg-white", title: "text-ink", sub: "text-ink-soft", chip: "bg-brand text-white" },
  view: { border: "border-line", bg: "bg-white", title: "text-ink", sub: "text-ink-faint" },
  dashboard: { border: "border-ink", bg: "bg-ink", title: "text-white", sub: "text-white/70" },
  live: { border: "border-dashed border-mint/60", bg: "bg-white", title: "text-mint", sub: "text-ink-faint" },
};

const EDGE_COLOR: Record<Edge["kind"], string> = {
  main: "#c7c8cd",
  meta: "#c7c8cd",
  live: "#14958f",
};

function nodeById(id: string): Node {
  const n = NODES.find((n) => n.id === id);
  if (!n) throw new Error(`Unknown node id: ${id}`);
  return n;
}

function anchor(n: Node, side: Side) {
  switch (side) {
    case "left":
      return { x: n.x, y: n.y + n.h / 2 };
    case "right":
      return { x: n.x + n.w, y: n.y + n.h / 2 };
    case "top":
      return { x: n.x + n.w / 2, y: n.y };
    case "bottom":
      return { x: n.x + n.w / 2, y: n.y + n.h };
  }
}

function pathFor(edge: Edge): string {
  const from = anchor(nodeById(edge.from), edge.fromSide);
  const to = anchor(nodeById(edge.to), edge.toSide);
  const horizontal = edge.fromSide === "left" || edge.fromSide === "right";

  if (horizontal) {
    const midX = from.x + (to.x - from.x) / 2;
    return `M ${from.x},${from.y} C ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`;
  }
  const midY = from.y + (to.y - from.y) / 2;
  return `M ${from.x},${from.y} C ${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`;
}

const WIDTH = 1960;
const HEIGHT = 545;

export default function PipelineDiagram() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-6 bg-[#c7c8cd]" /> batch pipeline (steps 1-4)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-6 border-t border-dashed border-mint" /> live per-visitor path (Panel B)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-ink" /> dashboard destination
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          className="block min-w-[1500px]"
          role="img"
          aria-label="Pipeline diagram: sources feed a lens router, then extraction, dedupe, and synthesis, producing three output views that populate the dashboard; a separate live path serves Panel B."
        >
          <defs>
            <marker id="arrow-main" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill={EDGE_COLOR.main} />
            </marker>
            <marker id="arrow-live" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill={EDGE_COLOR.live} />
            </marker>
          </defs>

          {/* Column labels */}
          <text x={20} y={0} dy={-6} className="fill-ink-faint text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
            Public sources
          </text>
          <text x={300} y={0} dy={-6} className="fill-ink-faint text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
            Lens routing
          </text>
          <text x={580} y={0} dy={-6} className="fill-ink-faint text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
            Extraction &amp; synthesis
          </text>
          <text x={1460} y={0} dy={-6} className="fill-ink-faint text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
            Output views
          </text>
          <text x={1740} y={0} dy={-6} className="fill-ink-faint text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
            Dashboard
          </text>

          {/* Edges (drawn first, under nodes) */}
          <g fill="none" strokeWidth={1.6}>
            {EDGES.map((edge, i) => {
              const d = pathFor(edge);
              const isLive = edge.kind === "live";
              return (
                <path
                  key={i}
                  d={d}
                  stroke={EDGE_COLOR[edge.kind]}
                  strokeDasharray={edge.kind !== "main" ? "5 4" : undefined}
                  markerEnd={isLive ? "url(#arrow-live)" : "url(#arrow-main)"}
                />
              );
            })}
          </g>

          {/* Edge labels */}
          <g>
            {EDGES.filter((e) => e.label).map((edge, i) => {
              const from = anchor(nodeById(edge.from), edge.fromSide);
              const to = anchor(nodeById(edge.to), edge.toSide);
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const isLive = edge.kind === "live";
              return (
                <g key={i} transform={`translate(${mx}, ${my})`}>
                  <rect x={-52} y={-9} width={104} height={16} rx={8} className="fill-surface" opacity={0.95} />
                  <text
                    textAnchor="middle"
                    dy={3}
                    className={`text-[9.5px] font-medium ${isLive ? "fill-mint" : "fill-ink-faint"}`}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          {NODES.map((n) => {
            const style = CATEGORY_STYLE[n.category];
            return (
              <foreignObject key={n.id} x={n.x} y={n.y} width={n.w} height={n.h}>
                <div
                  className={`relative flex h-full w-full flex-col justify-center gap-0.5 rounded-xl border px-3 py-2 shadow-sm ${style.border} ${style.bg}`}
                >
                  {n.badge && (
                    <span className={`absolute -left-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${style.chip}`}>
                      {n.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {n.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: n.dot }} />}
                    <span className={`text-[13px] font-bold leading-tight ${style.title}`}>{n.title}</span>
                  </div>
                  <p className={`text-[10.5px] leading-snug ${style.sub}`}>{n.subtitle}</p>
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
