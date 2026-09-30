import React, { useEffect, useRef, useState } from "react";
import { Send, Info } from "lucide-react";
import { sanitizeText } from "../utils/security";
import { generateClinicalAiReply } from "../services/aiService";
import { ScreenTitle } from "../components/ui/SharedUI";

const SUGGESTIONS = [
  "Что такое амплитуда движения (ROM)?",
  "Нормально ли, что сустав щёлкает?",
  "Как питание влияет на заживление?",
  "Что делать при отёке после упражнения?",
];

export function AssistantScreen({ profile }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Здравствуйте, ${profile.name}! Я объясню термины, подскажу про боль, отёк, сон и питание и предупрежу об опасных симптомах.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async (raw = input) => {
    const text = sanitizeText(raw, 600);
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    const reply = await generateClinicalAiReply(text, profile);
    setMessages((m) => [...m, { role: "bot", text: reply }]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div className="screen" style={{ paddingBottom: 8, flex: 1 }}>
        <ScreenTitle subtitle="Справочные ответы по ключевым словам — не языковая модель и не врач">Помощник</ScreenTitle>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div className={`bubble ${m.role === "user" ? "user" : "bot"}`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ marginBottom: 10 }}>
            <div className="bubble bot muted">Подбираю ответ…</div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="option" style={{ marginBottom: 0, fontSize: 13, color: "var(--teal)", fontWeight: 600 }} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="small row" style={{ gap: 6, marginTop: 14, alignItems: "flex-start" }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} /> Вопросы о лекарствах, дозировках и диагнозах задавайте лечащему врачу.
        </div>
        <div ref={scrollRef} />
      </div>
      <div className="no-print chat-bar" style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line)", background: "var(--paper)" }}>
        <input
          className="input"
          value={input}
          maxLength={600}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
          placeholder="Задайте вопрос…"
          aria-label="Вопрос помощнику"
        />
        <button className="btn btn-primary" style={{ padding: "0 14px" }} onClick={() => send()} disabled={loading || !input.trim()} aria-label="Отправить">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
