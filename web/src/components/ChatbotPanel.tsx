"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Summarise the whole report in brief",
  "What does the Opportunity Score actually mean?",
  "What does the psychology research say about why people wishlist?",
  "Where does the research agree or disagree with what the engine found?",
  "Why are some questions marked Weak?",
];

export default function ChatbotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: messages }),
      });
      const data = await res.json();

      if (data.configured === false) {
        setError(data.message);
      } else if (data.error) {
        setError(data.error);
      } else {
        setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Something went wrong reaching the assistant. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-brand" aria-hidden>
            ✦
          </span>
          <p className="text-sm font-semibold text-ink">Ask about this report</p>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand nav-tab">LLM</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">
          Answers only from the computed findings — if something isn&apos;t in the data, it says so instead of guessing.
        </p>
      </div>

      <div ref={scrollRef} className="max-h-[380px] min-h-[140px] overflow-y-auto px-4 py-3">
        {messages.length === 0 && !loading && (
          <div>
            <p className="mb-2.5 text-sm text-ink-soft">
              Ask what a widget means, what the engine found, or where its blind spots are.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-brand text-white" : "bg-surface text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface px-3.5 py-2.5 text-sm text-ink-faint">Reading the findings…</div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-[var(--color-status-serious)]/30 bg-[var(--color-status-serious-soft)] px-3 py-2.5 text-xs leading-relaxed text-[#b8552f]">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-line px-3 py-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this dashboard…"
          maxLength={1000}
          className="flex-1 rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ask
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="rounded-full px-2 py-2 text-xs font-semibold text-ink-faint hover:text-ink"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
