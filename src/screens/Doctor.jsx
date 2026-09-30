import React, { useState } from "react";
import { Stethoscope, Edit3, Copy, Printer, Share2, Mail, Phone, Check } from "lucide-react";
import { C } from "../theme/tokens";
import { EXERCISES } from "../data/mockData";
import { sanitizeText } from "../utils/security";
import { dateKey, addDays, formatDay, painTrend } from "../utils/stats";
import { Card, ScreenTitle, InputRow } from "../components/ui/SharedUI";

function buildReport({ profile, adherence, painLog, sessions, diary }) {
  const today = dateKey();
  const weekAgo = addDays(today, -6);
  const weekPain = painLog.filter((p) => p.date >= weekAgo).sort((a, b) => a.date.localeCompare(b.date));
  const weekSessions = sessions.filter((s) => s.date >= weekAgo);
  const trend = painTrend(weekPain);
  const flags = diary.filter((d) => d.redFlag && d.date >= weekAgo);
  const afterPain = weekSessions.filter((s) => Number.isFinite(s.painAfter));
  const avgAfter = afterPain.length ? (afterPain.reduce((a, s) => a + s.painAfter, 0) / afterPain.length).toFixed(1) : null;
  const byExercise = weekSessions.reduce((acc, s) => {
    acc[s.exerciseId] = (acc[s.exerciseId] || 0) + 1;
    return acc;
  }, {});

  const lines = [
    `Отчёт о реабилитации — Ainala`,
    `Период: ${formatDay(weekAgo)} – ${formatDay(today)}`,
    `Пациент: ${profile.name}`,
    `Область: ${profile.part}, ${profile.phase?.toLowerCase()} фаза`,
    profile.injuryDate ? `Дата травмы/операции: ${formatDay(profile.injuryDate, { day: "numeric", month: "long", year: "numeric" })}` : null,
    ``,
    `Выполнение плана: ${adherence}%`,
    `Тренировок за период: ${weekSessions.length}`,
    ...Object.entries(byExercise).map(([id, n]) => `  • ${EXERCISES.find((e) => e.id === id)?.name || id}: ${n}`),
    trend ? `Боль (0–10): ${trend.first} → ${trend.last} (${trend.count} отмет.)` : `Боль: нет отметок за период`,
    avgAfter ? `Средняя боль после упражнений: ${avgAfter}/10` : null,
    flags.length ? `⚠ Тревожные симптомы в дневнике: ${flags.map((f) => `${formatDay(f.date)} — ${f.redFlag}`).join("; ")}` : null,
    ``,
    `Данные введены пациентом самостоятельно.`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function DoctorScreen({ profile, doctor, onSaveDoctor, adherence, painLog, sessions, diary }) {
  const [editing, setEditing] = useState(!doctor.name);
  const [draft, setDraft] = useState(doctor);
  const [copied, setCopied] = useState(false);
  const report = buildReport({ profile, adherence, painLog, sessions, diary });

  const save = () => {
    onSaveDoctor({
      name: sanitizeText(draft.name, 80),
      specialty: sanitizeText(draft.specialty, 80),
      phone: sanitizeText(draft.phone, 30).replace(/[^\d+()\-\s]/g, ""),
      email: sanitizeText(draft.email, 120),
    });
    setEditing(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Скопируйте отчёт:", report);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Отчёт о реабилитации", text: report });
    } catch {
      // пользователь отменил
    }
  };

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email || "");
  const mailto = validEmail
    ? `mailto:${encodeURIComponent(doctor.email)}?subject=${encodeURIComponent("Отчёт о реабилитации")}&body=${encodeURIComponent(report)}`
    : null;

  return (
    <div className="screen">
      <ScreenTitle>Врач и отчёт</ScreenTitle>

      <Card>
        {!editing ? (
          <div className="row" style={{ gap: 12 }}>
            <div className="icon-tile" style={{ background: C.skySoft }}>
              <Stethoscope size={19} color={C.sky} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{doctor.name}</div>
              {doctor.specialty && <div className="small">{doctor.specialty}</div>}
              <div className="row" style={{ gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                {doctor.phone && (
                  <a href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`} className="small row" style={{ gap: 4, color: C.teal, fontWeight: 600 }}>
                    <Phone size={12} /> {doctor.phone}
                  </a>
                )}
                {doctor.email && <span className="small row" style={{ gap: 4 }}><Mail size={12} /> {doctor.email}</span>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => { setDraft(doctor); setEditing(true); }} aria-label="Изменить контакты врача">
              <Edit3 size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Ваш лечащий врач</div>
            <InputRow label="Имя" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Иванова Анна Сергеевна" />
            <InputRow label="Специализация" value={draft.specialty} onChange={(v) => setDraft({ ...draft, specialty: v })} placeholder="Травматолог-ортопед" />
            <InputRow label="Телефон" type="tel" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="+7 ___ ___-__-__" />
            <InputRow label="Email" type="email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} placeholder="doctor@clinic.ru" />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={!draft.name?.trim()}>Сохранить</button>
              {doctor.name && <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Отмена</button>}
            </div>
          </>
        )}
      </Card>

      <h2 className="h2">Отчёт за 7 дней</h2>
      <Card>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "var(--font)", fontSize: 13, lineHeight: 1.6 }}>{report}</pre>
      </Card>
      <div className="grid-2 no-print">
        <button className="btn btn-soft" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Скопировано" : "Копировать"}
        </button>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={15} /> Печать / PDF
        </button>
        {typeof navigator !== "undefined" && navigator.share && (
          <button className="btn btn-secondary" onClick={share}>
            <Share2 size={15} /> Поделиться
          </button>
        )}
        {mailto && (
          <a className="btn btn-primary" href={mailto}>
            <Mail size={15} /> Письмо врачу
          </a>
        )}
      </div>
      <p className="small no-print" style={{ marginTop: 10 }}>
        Отчёт отправляете вы сами — через почту, мессенджер или распечатку. Приложение ничего не передаёт автоматически.
      </p>
    </div>
  );
}
