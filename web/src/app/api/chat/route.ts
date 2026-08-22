import { CHAT_SYSTEM_PROMPT, buildGroundingContext } from "@/lib/chatContext";

export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Same model as the live extractor and the pipeline's synthesis call —
// reasoning quality matters more than latency for a Q&A box, and Groq is
// fast enough either way. Keep in sync with lib/groq.ts.
const GROQ_MODEL = "openai/gpt-oss-120b";

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 8;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  let body: { message?: string; history?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "Ask a question first." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: `Keep questions under ${MAX_MESSAGE_CHARS} characters.` }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        configured: false,
        message:
          "GROQ_API_KEY is not set on this deployment, so the assistant is offline. Add a key in web/.env.local to enable it.",
      },
      { status: 200 },
    );
  }

  // Only the last few turns are replayed — this box answers questions about a
  // fixed report, so long histories add tokens without adding usable context.
  const history = (body.history ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const context = buildGroundingContext();

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "system", content: `CONTEXT (the only facts you may use):\n\n${context}` },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  }).catch(() => null);

  if (!res) {
    return Response.json({ configured: true, error: "Could not reach Groq. Check your connection and try again." }, { status: 502 });
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const isQuota = errBody.includes("rate_limit") || errBody.includes("tokens per day") || res.status === 429;
    return Response.json(
      {
        configured: true,
        error: isQuota
          ? "Groq's daily token quota for this key is exhausted — the assistant will work again after the quota resets. Everything else on this dashboard is precomputed and unaffected."
          : `Groq API error ${res.status}: ${errBody.slice(0, 200)}`,
      },
      { status: 502 },
    );
  }

  const data = await res.json();
  const reply: string | undefined = data?.choices?.[0]?.message?.content;
  if (!reply) {
    return Response.json({ configured: true, error: "Groq returned an empty reply." }, { status: 502 });
  }

  return Response.json({ configured: true, reply }, { status: 200 });
}
