import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, RotateCw, Copy, Check, Bot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeakAIBot } from "@/hooks/usePeakAIBot";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "bot" | "user"; content: string; cta_label?: string; cta_url?: string };

const QUICK = [
  "How do I join Peak League?",
  "Help me find a team",
  "Improve my profile",
  "Generate team recruitment post",
  "Explain Free Agents",
  "Create a Valorant warm-up",
  "What should I do next?",
];

const WELCOME: Msg = {
  role: "bot",
  content:
    "Yo, I'm PeakBot. I can help with Peak League, teams, free agents, match results, warm-ups and profile fixes. Ask before your ranked brain takes over.",
};

export default function PeakBotView() {
  const { loading, error, callBot, regenerate, response } = usePeakAIBot();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, loading]);

  const ask = async (text: string) => {
    const trimmed = text.trim().slice(0, 1000);
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    const res = await callBot("assistant", trimmed, {}, { tone: "default", language: "en" });
    if (res?.success) {
      setMessages((m) => [
        ...m,
        { role: "bot", content: res.message, cta_label: res.cta_label, cta_url: res.cta_url },
      ]);
    }
  };

  const regen = async () => {
    const res = await regenerate();
    if (res?.success) {
      setMessages((m) => {
        const copy = [...m];
        // replace last bot message if exists
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === "bot") {
            copy[i] = {
              role: "bot",
              content: res.message,
              cta_label: res.cta_label,
              cta_url: res.cta_url,
            };
            return copy;
          }
        }
        return [...copy, { role: "bot", content: res.message }];
      });
    }
  };

  const copyMsg = async (idx: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <>
      <div className="pk-pinned" style={{ borderColor: "rgba(255,70,85,.18)" }}>
        <Sparkles size={13} color="#ff4655" style={{ marginTop: 3, flexShrink: 0 }} />
        <span>
          <b>PeakBot</b> · Your in-platform esports assistant. Not a person, no private data leaks.
        </span>
      </div>

      <div className="pk-messages" ref={scrollRef} style={{ padding: "12px 14px 4px" }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              flexDirection: m.role === "user" ? "row-reverse" : "row",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background:
                  m.role === "bot"
                    ? "linear-gradient(135deg,#ff4655,#ff8c42)"
                    : "rgba(255,255,255,.06)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: "#fff",
              }}
            >
              {m.role === "bot" ? <Bot size={15} /> : null}
            </div>
            <div style={{ maxWidth: "78%" }}>
              <div
                style={{
                  background:
                    m.role === "bot"
                      ? "var(--pk-panel-3)"
                      : "linear-gradient(135deg,#ff4655 0%,#e63d4b 100%)",
                  border:
                    m.role === "bot" ? "1px solid var(--pk-line-2)" : "1px solid rgba(255,70,85,.5)",
                  color: "#fff",
                  padding: "9px 12px",
                  borderRadius: 10,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
              {m.role === "bot" && idx > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {m.cta_label && m.cta_url && (
                    <Link
                      to={m.cta_url}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "rgba(255,70,85,.12)",
                        color: "#ff4655",
                        border: "1px solid rgba(255,70,85,.3)",
                        textDecoration: "none",
                      }}
                    >
                      {m.cta_label} →
                    </Link>
                  )}
                  <button
                    onClick={() => copyMsg(idx, m.content)}
                    className="pk-act-btn"
                    aria-label="Copy"
                    data-tip="Copy"
                    type="button"
                  >
                    {copiedIdx === idx ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  {idx === messages.length - 1 && (
                    <button
                      onClick={regen}
                      className="pk-act-btn"
                      aria-label="Regenerate"
                      data-tip="Regenerate"
                      type="button"
                      disabled={loading}
                    >
                      <RotateCw size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "linear-gradient(135deg,#ff4655,#ff8c42)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
              }}
            >
              <Bot size={15} />
            </div>
            <div
              style={{
                background: "var(--pk-panel-3)",
                border: "1px solid var(--pk-line-2)",
                padding: "10px 14px",
                borderRadius: 10,
                color: "var(--pk-text-mid)",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              PeakBot is thinking…
            </div>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              margin: "0 0 12px",
              padding: "9px 12px",
              border: "1px solid rgba(255,180,84,.25)",
              background: "rgba(255,180,84,.06)",
              borderRadius: 8,
              color: "var(--pk-amber)",
              fontSize: 12.5,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div style={{ marginTop: 6 }}>
            <div
              className="pk-mono"
              style={{
                fontSize: 10,
                letterSpacing: ".08em",
                color: "var(--pk-text-dim)",
                marginBottom: 8,
              }}
            >
              QUICK ACTIONS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  disabled={loading}
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid var(--pk-line-2)",
                    color: "var(--pk-text-mid)",
                    cursor: "pointer",
                  }}
                  className="hover:!text-white hover:!border-[rgba(255,70,85,.4)]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pk-composer">
        <div className="pk-input-wrap">
          <div
            className="pk-tool"
            aria-hidden
            style={{ color: "#ff4655", cursor: "default" }}
          >
            <Sparkles size={15} />
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask PeakBot anything…"
            maxLength={1000}
            disabled={loading}
          />
          <button
            className="pk-send"
            disabled={!canSend}
            onClick={() => ask(input)}
            aria-label="Send"
            data-tip="Ask PeakBot"
            type="button"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="pk-hint">
          <span>PeakBot can make mistakes. Don't trust ELO numbers it makes up.</span>
          <span>
            <kbd>Enter</kbd> send
          </span>
        </div>
      </div>
    </>
  );
}
