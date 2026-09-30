import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SHORT_ARTICLES, LONG_ARTICLES, COMMUNITY_POSTS } from "../data/mockData";
import { Card, Pill, ScreenTitle, Segmented } from "../components/ui/SharedUI";

function Expandable({ id, openId, setOpenId, tag, tone, title, body }) {
  const open = openId === id;
  return (
    <Card onClick={() => setOpenId(open ? null : id)}>
      <div className="between" style={{ alignItems: "flex-start" }}>
        <div>
          <Pill tone={tone}>{tag}</Pill>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 8, lineHeight: 1.35 }}>{title}</div>
        </div>
        <ChevronDown size={18} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", color: "var(--muted)" }} />
      </div>
      {open && <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>{body}</div>}
    </Card>
  );
}

export function LibraryScreen() {
  const [tab, setTab] = useState("short");
  const [openId, setOpenId] = useState(null);
  return (
    <div className="screen">
      <ScreenTitle subtitle="Общая информация. Индивидуальные рекомендации даёт ваш врач.">Библиотека</ScreenTitle>
      <div style={{ marginBottom: 14 }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: "short", label: "Вопрос-ответ" }, { value: "long", label: "Статьи" }]} />
      </div>
      {tab === "short" &&
        SHORT_ARTICLES.map((a) => <Expandable key={a.id} id={a.id} openId={openId} setOpenId={setOpenId} tag={a.category} tone="sky" title={a.q} body={a.a} />)}
      {tab === "long" &&
        LONG_ARTICLES.map((a) => <Expandable key={a.id} id={a.id} openId={openId} setOpenId={setOpenId} tag={a.category} tone="teal" title={a.title} body={a.body} />)}
    </div>
  );
}

export function StoriesScreen() {
  return (
    <div className="screen">
      <ScreenTitle subtitle="Примеры того, как выглядит путь восстановления. Это иллюстрации, а не реальные пользователи.">Истории восстановления</ScreenTitle>
      {COMMUNITY_POSTS.map((p) => (
        <Card key={p.id}>
          <div className="between" style={{ marginBottom: 8 }}>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--coral-soft)", display: "grid", placeItems: "center", fontWeight: 700, color: "var(--coral)" }}>
                {p.author[0]}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.author}</div>
            </div>
            <Pill>{p.tag}</Pill>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{p.text}</div>
        </Card>
      ))}
      <div className="empty">Сообщество с публикациями появится после подключения сервера с модерацией.</div>
    </div>
  );
}
