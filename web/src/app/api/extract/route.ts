import { runExtraction } from "@/lib/groq";
import { Lens } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { text?: string; lens?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const lens = body.lens === "prospective" ? "prospective" : "retrospective";

  if (!text) {
    return Response.json({ error: "Paste some text to extract from." }, { status: 400 });
  }
  if (text.length > 4000) {
    return Response.json({ error: "Text too long — keep it under 4000 characters for the demo box." }, { status: 400 });
  }

  const outcome = await runExtraction(text, lens as Lens);

  if (!outcome.configured) {
    return Response.json(
      {
        configured: false,
        message:
          "GROQ_API_KEY is not set on this deployment, so the live extractor is running in stub mode. Add a key in .env.local (see web/.env.local.example) to run real extractions.",
      },
      { status: 200 },
    );
  }

  if (outcome.error) {
    return Response.json({ configured: true, error: outcome.error }, { status: 502 });
  }

  return Response.json({ configured: true, extraction: outcome.parsed }, { status: 200 });
}
