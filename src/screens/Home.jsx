import React, { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Plus, MoreHorizontal, MoreVertical, ChevronLeft, ChevronRight, Play, Check, Flame, ShieldAlert,
  Snowflake, ArrowUpFromLine, Egg, Footprints, Activity, Pill as PillIcon, Stethoscope, Dumbbell, HeartPulse,
} from "lucide-react";
import { C, FONT } from "../theme/tokens";
import { EXERCISES, CARE_ROUTINE, PHASE_INFO } from "../data/mockData";
import { dateKey, addDays, daysBetween, formatDay, isDayActive, painTone } from "../utils/stats";
import { Modal, ModalHeader, PainSlider, PainAdvice, JourneyStepper, BodyMap } from "../components/ui/SharedUI";
import { JointAnimation } from "../components/JointAnimation";
import { VideoHubModal } from "./Exercises";

const CARE_ICONS = { Snowflake, ArrowUpFromLine, Egg, Footprints, Activity };
const TINTS = ["green", "blue", "yellow"];
const PAIN_BLUE = "#5B9BD5";
const AFTER_GREEN = "#3DAA5C";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

// ─── Мои показатели ──────────────────────────────────────────────────────────

function ParametersCard({ profile, painLog, sessions, done, plan, onAddPain, onMore }) {
  const [tab, setTab] = useState("pain");
  const today = dateKey();
  // Для новых пользователей «Всё время» информативнее, чем полупустые 30 дней
  const [range, setRange] = useState(() => (daysBetween(profile.startDate || today, today) < 30 ? "all" : "30"));

  const data = useMemo(() => {
    const firstData = [...painLog.map((p) => p.date), ...sessions.map((s) => s.date), profile.startDate].filter(Boolean).sort()[0] || today;
    const span = range === "all" ? Math.max(daysBetween(firstData, today) + 1, 7) : Number(range);
    const painBy = Object.fromEntries(painLog.map((p) => [p.date, p.pain]));
    const rows = [];
    for (let i = span - 1; i >= 0; i--) {
      const key = addDays(today, -i);
      const daySessions = sessions.filter((s) => s.date === key);
      const afters = daySessions.map((s) => s.painAfter).filter(Number.isFinite);
      const dayDone = done[key] || {};
      const beforeStart = profile.startDate && key < profile.startDate;
      rows.push({
        key,
        label: formatDay(key, { day: "numeric", month: span > 14 ? "short" : "numeric" }),
        pain: painBy[key] ?? null,
        after: afters.length ? +(afters.reduce((a, b) => a + b, 0) / afters.length).toFixed(1) : null,
        adherence: beforeStart || !plan.length ? null : Math.round((plan.filter((id) => dayDone[id]).length / plan.length) * 100),
        sessions: daySessions.length,
      });
    }
    return rows;
  }, [painLog, sessions, done, plan, range, profile.startDate, today]);

  const painPoints = data.filter((d) => d.pain !== null || d.after !== null).length;
  const interval = data.length > 14 ? Math.ceil(data.length / 7) - 1 : 0;
  const axis = { tick: { fontSize: 11.5, fill: C.inkSoft, fontFamily: FONT }, axisLine: false, tickLine: false };
  const tooltip = { contentStyle: { fontFamily: FONT, fontSize: 12, borderRadius: 12, border: `1px solid ${C.line}` }, labelFormatter: (_, p) => (p?.[0] ? formatDay(p[0].payload.key, { day: "numeric", month: "long" }) : "") };

  return (
    <section className="panel area-params">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Мои показатели</h2>
          <div className="panel-sub">Боль, реакция на нагрузку и выполнение плана</div>
        </div>
        <button className="round-btn" onClick={onAddPain} aria-label="Отметить боль">
          <Plus size={20} />
        </button>
      </div>

      <div className="between" style={{ flexWrap: "wrap", marginBottom: 14 }}>
        <div className="chips" style={{ paddingBottom: 0 }}>
          {[
            { v: "pain", l: "Боль · после ЛФК" },
            { v: "adherence", l: "Выполнение" },
            { v: "sessions", l: "Тренировки" },
          ].map((t) => (
            <button key={t.v} className={`tab-pill ${tab === t.v ? "active" : ""}`} onClick={() => setTab(t.v)}>
              {t.l}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Период">
            <option value="7">7 дней</option>
            <option value="30">30 дней</option>
            <option value="all">Всё время</option>
          </select>
          <button className="round-btn" onClick={onMore} aria-label="Подробнее в разделе Прогресс">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div style={{ height: 230, position: "relative" }}>
        {tab === "pain" && painPoints < 2 ? (
          <div className="empty" style={{ height: "100%", display: "grid", placeItems: "center", background: "#f7f9f8", borderRadius: 16 }}>
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📈</div>
              График появится после двух отметок боли.
              <br />
              <button className="btn btn-primary sm" style={{ marginTop: 12 }} onClick={onAddPain}>
                Отметить боль сейчас
              </button>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {tab === "sessions" ? (
              <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#EEF2F0" vertical={false} />
                <XAxis dataKey="label" interval={interval} {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip {...tooltip} formatter={(v) => [v, "Тренировок"]} cursor={{ fill: "rgba(0,0,0,.04)" }} />
                <Bar dataKey="sessions" fill={C.black} radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gPain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PAIN_BLUE} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={PAIN_BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AFTER_GREEN} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={AFTER_GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF2F0" vertical={false} />
                <XAxis dataKey="label" interval={interval} {...axis} />
                {tab === "pain" ? (
                  <>
                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} {...axis} />
                    <Tooltip {...tooltip} formatter={(v, n) => [`${v}/10`, n === "pain" ? "Боль за день" : "После ЛФК"]} />
                    <Area type="monotone" dataKey="pain" stroke={PAIN_BLUE} strokeWidth={2.5} fill="url(#gPain)" connectNulls dot={{ r: 3, fill: PAIN_BLUE }} />
                    <Area type="monotone" dataKey="after" stroke={AFTER_GREEN} strokeWidth={2.5} fill="url(#gGreen)" connectNulls dot={{ r: 3, fill: AFTER_GREEN }} />
                  </>
                ) : (
                  <>
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" {...axis} />
                    <Tooltip {...tooltip} formatter={(v) => [`${v}%`, "Выполнено"]} />
                    <Area type="monotone" dataKey="adherence" stroke={AFTER_GREEN} strokeWidth={2.5} fill="url(#gGreen)" connectNulls dot={{ r: 3, fill: AFTER_GREEN }} />
                  </>
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="row" style={{ gap: 18, marginTop: 12, fontSize: 13.5, fontWeight: 600 }}>
        {tab === "pain" && (
          <>
            <span className="row" style={{ gap: 6 }}><Dot color={PAIN_BLUE} /> Боль за день</span>
            <span className="row" style={{ gap: 6 }}><Dot color={AFTER_GREEN} /> После упражнений</span>
          </>
        )}
        {tab === "adherence" && <span className="row" style={{ gap: 6 }}><Dot color={AFTER_GREEN} /> % упражнений плана за день</span>}
        {tab === "sessions" && <span className="row" style={{ gap: 6 }}><Dot color={C.black} /> Завершённые тренировки</span>}
      </div>
    </section>
  );
}

function Dot({ color }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />;
}

// ─── Календарь ───────────────────────────────────────────────────────────────

function MonthCalendar({ done, events, onOpen }) {
  const today = dateKey();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7; // понедельник — первый
    const start = new Date(first);
    start.setDate(1 - offset);
    const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const total = Math.ceil((offset + lastOfMonth.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth(), weekend: i % 7 >= 5 };
    });
  }, [month]);

  const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const selEvents = events.filter((e) => e.date === selected).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const selExercises = Object.entries(done[selected] || {}).filter(([id, v]) => v === true && !id.includes(":")).length;

  return (
    <section className="panel tinted-green area-calendar">
      <h2 className="panel-title" style={{ marginBottom: 14 }}>Календарь</h2>
      <div className="between" style={{ marginBottom: 12 }}>
        <div>
          <div className="panel-sub" style={{ marginTop: 0 }}>Сегодня</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
            {formatDay(today, { day: "numeric", month: "long" })}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="round-btn" style={{ background: "#fff" }} onClick={() => shift(-1)} aria-label="Предыдущий месяц">
            <ChevronLeft size={18} />
          </button>
          <button className="round-btn" style={{ background: "#fff" }} onClick={() => shift(1)} aria-label="Следующий месяц">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="small" style={{ fontWeight: 700, textTransform: "capitalize", marginBottom: 2 }}>
        {month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
      </div>
      <div className="cal-grid">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((c) => {
          const dots = (isDayActive(done, c.key) ? 1 : 0) + (eventDays.has(c.key) ? 1 : 0);
          const cls = ["cal-day", !c.inMonth && "outside", c.weekend && "weekend", c.key === today && "today", c.key === selected && c.key !== today && "selected"].filter(Boolean).join(" ");
          return (
            <button key={c.key} className={cls} onClick={() => setSelected(c.key)} aria-label={formatDay(c.key, { day: "numeric", month: "long" })} aria-pressed={c.key === selected}>
              {c.day}
              <span className="cal-dots">{Array.from({ length: dots }).map((_, i) => <span key={i} />)}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12, background: "rgba(255,255,255,.7)", borderRadius: 14, padding: "10px 12px", fontSize: 13 }}>
        <div className="between">
          <strong>{selected === today ? "Сегодня" : formatDay(selected, { weekday: "short", day: "numeric", month: "long" })}</strong>
          <button className="btn btn-ghost sm" style={{ padding: 0 }} onClick={onOpen}>Все события →</button>
        </div>
        {selExercises > 0 && <div className="small row" style={{ gap: 6, marginTop: 4 }}><Dumbbell size={12} /> Выполнено упражнений: {selExercises}</div>}
        {selEvents.map((e) => (
          <div key={e.id} className="small row" style={{ gap: 6, marginTop: 4 }}>
            {e.type === "doctor" ? <Stethoscope size={12} /> : e.type === "med" ? <PillIcon size={12} /> : <Dumbbell size={12} />}
            {e.time && <span className="mono">{e.time}</span>} {e.title}
          </div>
        ))}
        {!selExercises && !selEvents.length && <div className="small" style={{ marginTop: 4 }}>Нет событий</div>}
      </div>
    </section>
  );
}

// ─── Мои упражнения ──────────────────────────────────────────────────────────

function ExercisesCard({ plan, todayDone, onStart, onBrowse, highPain }) {
  const [videoEx, setVideoEx] = useState(null);
  const list = plan.map((id) => EXERCISES.find((e) => e.id === id)).filter(Boolean);
  const doneCount = list.filter((e) => todayDone[e.id]).length;
  const next = list.find((e) => !todayDone[e.id]);

  return (
    <section className="panel area-exercises">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Мои упражнения</h2>
          <div className="panel-sub">План на сегодня по вашей фазе</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="tab-pill" style={{ cursor: "default" }}>Сегодня · {doneCount}/{list.length}</span>
          <button className="round-btn" onClick={onBrowse} aria-label="Все упражнения">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {highPain && (
        <div className="alert critical">
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div><strong>Сегодня лучше отдохнуть</strong>Боль 7+ — упражнения не выполняются. Если боль не стихает в покое, свяжитесь с врачом.</div>
        </div>
      )}

      {list.map((ex, i) => {
        const done = !!todayDone[ex.id];
        return (
          <div key={ex.id} className={`item ${TINTS[i % 2 === 0 ? 0 : 1]} ${done ? "done" : ""}`}>
            <button className="thumb" style={{ border: "none", padding: 0 }} onClick={() => !done && !highPain && onStart(ex.id)} aria-label={`Начать: ${ex.name}`}>
              <JointAnimation width={58} animate={!done} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-title">{ex.name}</div>
              <div className="item-meta">
                {ex.sets} × {ex.reps} повт. · {ex.workSec} сек
              </div>
              <div className="item-sub">Цель: {ex.targetRom} · {ex.difficulty.toLowerCase()}</div>
            </div>
            {done ? (
              <span className="counter full" aria-label="Выполнено"><Check size={16} strokeWidth={3} /></span>
            ) : (
              <button className="icon-btn" style={{ alignSelf: "flex-start" }} onClick={() => setVideoEx(ex)} aria-label="Разбор техники">
                <MoreVertical size={18} />
              </button>
            )}
          </div>
        );
      })}

      <button className="btn-dark-lg" style={{ marginTop: 6 }} onClick={() => next && onStart(next.id)} disabled={!next || highPain}>
        {next ? <><Play size={17} fill="#fff" /> {doneCount ? "Продолжить тренировку" : "Начать тренировку"}</> : <><Check size={18} /> Все упражнения на сегодня выполнены</>}
      </button>

      <VideoHubModal exercise={videoEx} onClose={() => setVideoEx(null)} onStart={onStart} />
    </section>
  );
}

// ─── Мой режим ───────────────────────────────────────────────────────────────

function CareCard({ phase, todayDone, onCareStep, onToggle, medEvents, onAdd }) {
  const routine = CARE_ROUTINE[phase] || CARE_ROUTINE["Ранняя"];
  return (
    <section className="panel area-care">
      <div className="panel-head" style={{ marginBottom: 14 }}>
        <div>
          <h2 className="panel-title">Мой режим</h2>
          <div className="panel-sub">Восстановление и назначения на сегодня</div>
        </div>
      </div>

      {medEvents.map((ev) => {
        const on = !!todayDone[`ev:${ev.id}`];
        return (
          <div key={ev.id} className={`item blue ${on ? "done" : ""}`}>
            <span className="pill-icon"><PillIcon size={22} color={C.black} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-title">{ev.title}</div>
              <div className="item-sub" style={{ fontSize: 13.5 }}>{ev.time ? `в ${ev.time}` : "сегодня"} · по назначению врача</div>
            </div>
            <button className={`counter ${on ? "full" : ""}`} onClick={() => onToggle(`ev:${ev.id}`)} aria-pressed={on} aria-label="Отметить приём">
              {on ? <Check size={16} strokeWidth={3} /> : "0/1"}
            </button>
          </div>
        );
      })}

      {routine.map((r) => {
        const Icon = CARE_ICONS[r.icon] || HeartPulse;
        const count = Number(todayDone[`care:${r.id}`]) || 0;
        const full = count >= r.target;
        return (
          <div key={r.id} className={`item ${r.tint}`}>
            <span className="pill-icon"><Icon size={22} color={C.black} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-title">{r.title}</div>
              <div className="item-sub" style={{ fontSize: 13.5 }}>{r.freq}</div>
            </div>
            <button
              className={`counter ${full ? "full" : ""}`}
              onClick={() => onCareStep(r.id, full ? 0 : count + 1)}
              aria-label={`${r.title}: выполнено ${count} из ${r.target}. Нажмите, чтобы отметить`}
            >
              {full ? <Check size={16} strokeWidth={3} /> : `${count}/${r.target}`}
            </button>
          </div>
        );
      })}

      <button className="btn-light-lg" onClick={onAdd}>
        <Plus size={18} /> Новое напоминание
      </button>
    </section>
  );
}

// ─── Карточка фазы (sidebar / мобильная главная) ─────────────────────────────

export function PhaseCard({ profile, onEdit }) {
  const info = PHASE_INFO[profile.phase];
  return (
    <div className="phase-card">
      <div style={{ position: "absolute", right: 10, bottom: 8, opacity: 0.9 }}>
        <BodyMap part={profile.part} size={96} figure="rgba(18,26,24,.16)" />
      </div>
      <p className="phase-card-title">
        {profile.phase} фаза:
        <br />
        {profile.part.toLowerCase()}
      </p>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, maxWidth: "68%" }}>{info?.goal}</div>
      <div style={{ margin: "10px 0 8px", maxWidth: "74%" }}>
        <JourneyStepper phase={profile.phase} />
      </div>
      <button className="btn btn-ghost sm" style={{ color: C.black, padding: 0, textDecoration: "underline" }} onClick={onEdit}>
        Изменить этап
      </button>
    </div>
  );
}

// ─── Главная ─────────────────────────────────────────────────────────────────

export function HomeScreen({
  profile, plan, done, todayDone, onToggle, onCareStep, onStart, streak, adherence,
  todayPain, onLogPain, events, sessions, painLog, onNavigate, onShowSos, onEditProfile,
}) {
  const today = dateKey();
  const [painOpen, setPainOpen] = useState(false);
  const [painDraft, setPainDraft] = useState(todayPain?.pain ?? profile.pain ?? 3);
  const dayNumber = daysBetween(profile.injuryDate || profile.startDate || today, today) + 1;
  const medEvents = events.filter((e) => e.date === today && e.type === "med");
  const highPain = !!todayPain && todayPain.pain >= 7;
  const painChipTone = todayPain ? painTone(todayPain.pain) : null;

  const openPain = () => {
    setPainDraft(todayPain?.pain ?? profile.pain ?? 3);
    setPainOpen(true);
  };

  return (
    <div className="dash">
      <div className="dash-greeting area-greet">
        <div>
          <div className="panel-sub" style={{ marginTop: 0 }}>
            {profile.injuryDate ? `День ${dayNumber} после травмы` : `День ${dayNumber} с Ainala`} · {profile.part}, {profile.phase?.toLowerCase()} фаза
          </div>
          <h1 className="h1" style={{ fontSize: 28, marginTop: 2 }}>
            {greeting()}, {profile.name}
          </h1>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="stat-chip" style={{ color: C.coral }}><Flame size={15} /> {streak ? `Серия ${streak}` : "Начните серию"}</span>
          <span className="stat-chip">План 7 дн. · {adherence}%</span>
          <button
            className="stat-chip"
            onClick={openPain}
            style={painChipTone ? { background: { green: "#DFF3E8", amber: "#FDF1D6", red: "#F9E0DA" }[painChipTone] } : { background: C.black, color: "#fff" }}
          >
            {todayPain ? `Боль сегодня ${todayPain.pain}/10` : "+ Отметить боль"}
          </button>
          <button className="stat-chip desktop-only" style={{ color: C.red, background: "#F9E0DA" }} onClick={onShowSos}>
            <ShieldAlert size={15} /> SOS
          </button>
        </div>
      </div>

      <div className="mobile-only">
        <PhaseCard profile={profile} onEdit={onEditProfile} />
      </div>

      <ExercisesCard plan={plan} todayDone={todayDone} onStart={onStart} onBrowse={() => onNavigate("exercises")} highPain={highPain} />
      <CareCard phase={profile.phase} todayDone={todayDone} onCareStep={onCareStep} onToggle={onToggle} medEvents={medEvents} onAdd={() => onNavigate("calendar")} />
      <ParametersCard profile={profile} painLog={painLog} sessions={sessions} done={done} plan={plan} onAddPain={openPain} onMore={() => onNavigate("progress")} />
      <MonthCalendar done={done} events={events} onOpen={() => onNavigate("calendar")} />

      <Modal open={painOpen} onClose={() => setPainOpen(false)} title="Боль сегодня">
        <ModalHeader title="Как вы сегодня?" onClose={() => setPainOpen(false)} />
        <PainSlider value={painDraft} onChange={setPainDraft} label="Боль сейчас" />
        <PainAdvice value={painDraft} />
        <button
          className="btn btn-primary block"
          style={{ marginTop: 16 }}
          onClick={() => {
            onLogPain(painDraft);
            setPainOpen(false);
          }}
        >
          Сохранить
        </button>
      </Modal>
    </div>
  );
}
