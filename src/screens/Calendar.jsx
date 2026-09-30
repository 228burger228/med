import React, { useState } from "react";
import { Dumbbell, Pill as PillIcon, Stethoscope, Trash2, Plus } from "lucide-react";
import { C } from "../theme/tokens";
import { sanitizeText } from "../utils/security";
import { dateKey, formatDay } from "../utils/stats";
import { Card, ScreenTitle, InputRow, Segmented } from "../components/ui/SharedUI";

const TYPES = [
  { value: "exercise", label: "Упражнение", icon: Dumbbell, color: C.teal, bg: C.tealSoft },
  { value: "med", label: "Лекарство", icon: PillIcon, color: C.coral, bg: C.coralSoft },
  { value: "doctor", label: "Врач", icon: Stethoscope, color: C.sky, bg: C.skySoft },
];

export function CalendarScreen({ events, onAdd, onDelete }) {
  const today = dateKey();
  const [showForm, setShowForm] = useState(events.length === 0);
  const [form, setForm] = useState({ title: "", date: today, time: "", type: "doctor" });
  const [showPast, setShowPast] = useState(false);

  const add = () => {
    const title = sanitizeText(form.title, 100);
    if (!title || !form.date) return;
    onAdd({ id: `e${Date.now()}`, title, date: form.date, time: form.time, type: form.type });
    setForm({ title: "", date: form.date, time: "", type: form.type });
    setShowForm(false);
  };

  const sorted = [...events].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const visible = sorted.filter((e) => showPast || e.date >= today);
  const pastCount = sorted.length - sorted.filter((e) => e.date >= today).length;
  const groups = visible.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="screen">
      <ScreenTitle
        subtitle="Визиты к врачу, приём назначенных лекарств, тренировки. Напоминания на сегодня появляются на главной."
        right={
          <button className="btn btn-primary sm" onClick={() => setShowForm((v) => !v)}>
            <Plus size={14} /> Добавить
          </button>
        }
      >
        Календарь
      </ScreenTitle>

      {showForm && (
        <Card>
          <div style={{ marginBottom: 12 }}>
            <Segmented value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES} />
          </div>
          <InputRow
            label="Название"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder={form.type === "med" ? "Препарат и дозировка по назначению врача" : form.type === "doctor" ? "Контрольный осмотр у травматолога" : "Вечерний комплекс"}
            maxLength={100}
          />
          <div className="grid-2" style={{ gap: 8 }}>
            <InputRow label="Дата" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <InputRow label="Время" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
          </div>
          {form.type === "med" && <div className="small" style={{ marginBottom: 10 }}>Добавляйте только лекарства, назначенные врачом.</div>}
          <button className="btn btn-primary block" onClick={add} disabled={!form.title.trim() || !form.date}>
            Сохранить напоминание
          </button>
        </Card>
      )}

      {!visible.length && !showForm && <div className="empty">Пока нет запланированных событий.</div>}

      {Object.entries(groups).map(([date, evs]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ margin: "8px 0", color: date === today ? C.teal : undefined }}>
            {date === today ? "Сегодня · " : ""}
            {formatDay(date, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {evs.map((e) => {
            const t = TYPES.find((x) => x.value === e.type) || TYPES[0];
            const Icon = t.icon;
            return (
              <div key={e.id} className="task" style={{ opacity: e.date < today ? 0.6 : 1 }}>
                <div className="icon-tile" style={{ background: t.bg }}>
                  <Icon size={17} color={t.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-title">{e.title}</div>
                  <div className="small">{e.time || "В течение дня"} · {t.label}</div>
                </div>
                <button className="icon-btn" onClick={() => onDelete(e.id)} aria-label="Удалить">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {pastCount > 0 && (
        <button className="btn btn-ghost sm" onClick={() => setShowPast((v) => !v)}>
          {showPast ? "Скрыть прошедшие" : `Показать прошедшие (${pastCount})`}
        </button>
      )}
    </div>
  );
}
