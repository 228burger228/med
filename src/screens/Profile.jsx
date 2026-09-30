import React from "react";
import { Download, Trash2, Edit3, Lock } from "lucide-react";
import { C } from "../theme/tokens";
import { ACTIVITY_LEVELS } from "../data/mockData";
import { formatDay } from "../utils/stats";
import { Card, ScreenTitle, BodyMap, Pill } from "../components/ui/SharedUI";

function Row({ label, value }) {
  return (
    <div className="between" style={{ padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <span className="muted">{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function ProfileScreen({ profile, onEdit, onExport, onWipe }) {
  const imperial = profile.units === "imperial";
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activityLevel)?.label || "—";

  const wipe = () => {
    if (window.confirm("Удалить все данные Ainala с этого устройства? Это действие нельзя отменить. Рекомендуем сначала сделать экспорт.")) onWipe();
  };

  return (
    <div className="screen">
      <ScreenTitle>Профиль</ScreenTitle>
      <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ background: C.tealSoft, borderRadius: 14, padding: "6px 10px" }}>
          <BodyMap part={profile.part} size={80} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 21 }}>{profile.name}</div>
          <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <Pill tone="teal">{profile.part}</Pill>
            <Pill tone="coral">{profile.phase} фаза</Pill>
          </div>
        </div>
      </Card>

      <Card>
        {profile.injuryDate && <Row label="Дата травмы / операции" value={formatDay(profile.injuryDate, { day: "numeric", month: "long", year: "numeric" })} />}
        <Row label="Начало с Ainala" value={formatDay(profile.startDate, { day: "numeric", month: "long", year: "numeric" })} />
        <Row label="Боль при старте" value={`${profile.pain ?? "—"} / 10`} />
        <Row label="Активность" value={activity} />
        {profile.age && <Row label="Возраст" value={profile.age} />}
        {profile.weight && <Row label="Вес" value={`${profile.weight} ${imperial ? "фунт." : "кг"}`} />}
        {profile.height && <Row label="Рост" value={`${profile.height} ${imperial ? "дюйм." : "см"}`} />}
        {profile.allergies && <Row label="Аллергии" value={profile.allergies} />}
        {profile.description && (
          <div style={{ paddingTop: 11 }}>
            <div className="muted" style={{ marginBottom: 4 }}>Описание травмы</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{profile.description}</div>
          </div>
        )}
      </Card>

      <button className="btn btn-soft block" onClick={onEdit}>
        <Edit3 size={15} /> Изменить травму, этап и данные
      </button>

      <h2 className="h2">Ваши данные</h2>
      <div className="alert info">
        <Lock size={17} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>Всё хранится только в этом браузере и никуда не отправляется. При очистке данных браузера записи пропадут — делайте экспорт.</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onExport}>
          <Download size={15} /> Экспорт (JSON)
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, color: C.red }} onClick={wipe}>
          <Trash2 size={15} /> Удалить всё
        </button>
      </div>
    </div>
  );
}
