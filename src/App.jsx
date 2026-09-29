import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Home, Dumbbell, TrendingUp, MessageCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Play, Pause, SkipForward, Check, Flame, Calendar as CalendarIcon, User, BookOpen,
  Stethoscope, Users, Send, Award, Camera, Pill as PillIcon, X, Share2, Video, Edit3,
  ShieldAlert, PhoneCall, Moon, Utensils, Heart, AlertTriangle,
} from "lucide-react";
import { C, FONT, DISPLAY, MONO } from "./theme/tokens";
import {
  EXERCISES, INITIAL_LOG, CALENDAR_EVENTS, COMMUNITY_POSTS,
  SHORT_ARTICLES, LONG_ARTICLES, RED_FLAGS, RECOVERY_CARE_CHECKLIST, BODY_PARTS, PHASES,
} from "./data/mockData";
import { sanitizeText, loadPersistedState, savePersistedState, exportGdprDataSnapshot } from "./utils/security";
import { analyzeInjuryDescription, generateClinicalAiReply } from "./services/aiService";

// ─── SHARED UI ──────────────────────────────────────────────────────────────

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: C.line, fg: C.inkSoft },
    amber: { bg: C.amberSoft, fg: C.amberDark },
    pine: { bg: C.pineLight, fg: C.pine },
    rose: { bg: C.roseSoft, fg: C.rose },
    warning: { bg: C.warningSoft, fg: C.warning },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: t.bg, color: t.fg, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.02em", padding: "4px 10px", borderRadius: 999,
      lineHeight: 1.2, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: 16, marginBottom: 10, ...style,
    }}>{children}</div>
  );
}

function InputRow({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px",
          fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function ScreenTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "2px 0 16px" }}>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 24, color: C.ink, fontWeight: 600, margin: 0 }}>{children}</h1>
      {right}
    </div>
  );
}

function RecoveryRing({ percent, size = 164, centerValue, centerLabel = "СЕГОДНЯ", strokeColor = C.amber, isMono = false }) {
  const safe = Math.max(0, Math.min(100, percent || 0));
  const stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r, offset = c - (safe / 100) * c;
  const main = centerValue !== undefined ? centerValue : `${safe}%`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={strokeColor} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x="50%" y="47%" textAnchor="middle" fontSize={isMono ? "34" : "28"}
        fontFamily={isMono ? MONO : DISPLAY} fill={C.ink} fontWeight="600">{main}</text>
      <text x="50%" y="64%" textAnchor="middle" fontSize="10.5"
        fontFamily={FONT} fill={C.inkSoft} fontWeight="600" letterSpacing="0.06em">{centerLabel}</text>
    </svg>
  );
}

// ─── MODAL (нативный <dialog> с light-dismiss fallback) ──────────────────────

function Modal({ open, onClose, children, sheet = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose_ = () => onClose?.();
    const onBackdrop = (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (!(r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right)) d.close();
    };
    d.addEventListener("close", onClose_);
    if (!("closedBy" in HTMLDialogElement.prototype)) d.addEventListener("click", onBackdrop);
    return () => {
      d.removeEventListener("close", onClose_);
      d.removeEventListener("click", onBackdrop);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <dialog ref={ref} closedby="any" className={sheet ? "ainala-sheet" : "ainala-dialog"}>
      <div style={{
        background: C.paper, borderRadius: sheet ? "20px 20px 0 0" : 20,
        padding: sheet ? "14px 18px 26px" : 20, border: `1px solid ${C.line}`,
        maxHeight: "86vh", overflowY: "auto", boxShadow: "0 18px 42px rgba(22,36,30,.22)",
      }}>{children}</div>
    </dialog>
  );
}

// ─── RED FLAGS MODAL ──────────────────────────────────────────────────────────

function RedFlagsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={22} color={C.rose} />
          <h2 style={{ fontFamily: DISPLAY, fontSize: 19, color: C.ink, margin: 0, fontWeight: 600 }}>Красные флаги</h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={C.inkSoft} /></button>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: "0 0 14px" }}>
        При любом из этих симптомов — <strong>немедленно прекратите упражнения</strong>.
      </p>
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.rose, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        🚨 Скорая помощь (103 / 112)
      </div>
      {RED_FLAGS.critical.map(item => (
        <div key={item.id} style={{ background: C.roseSoft, border: "1px solid #E7B8AE", borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.rose }}>{item.title}</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{item.desc}</div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.rose, marginTop: 6 }}>→ {item.action}</div>
        </div>
      ))}
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.amberDark, margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        ⚠️ Срочно к врачу (в ближайшие 24 ч)
      </div>
      {RED_FLAGS.urgent.map(item => (
        <div key={item.id} style={{ background: C.amberSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.amberDark }}>{item.title}</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{item.desc}</div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.amberDark, marginTop: 6 }}>→ {item.action}</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <a href="tel:112" style={{
          flex: 1, background: C.rose, color: "#fff", textDecoration: "none", borderRadius: 12,
          padding: "12px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}><PhoneCall size={15} /> Вызов 112 / 103</a>
        <button onClick={onClose} style={{
          flex: 1, background: C.bg, color: C.ink, border: `1px solid ${C.line}`,
          borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
        }}>Понятно</button>
      </div>
    </Modal>
  );
}

// ─── PREMIUM MODAL ────────────────────────────────────────────────────────────

function PremiumModal({ open, onClose, onSubscribe }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, fontWeight: 600, margin: "0 0 8px" }}>Ainala Premium</h1>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: "0 0 16px" }}>
          Получите доступ к ИИ-помощнику, полным статьям и субтитрам (CC) к упражнениям
        </p>
        <div style={{ background: C.bg, borderRadius: 14, padding: 14, marginBottom: 16, textAlign: "left" }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>Включено в Premium:</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.7 }}>
            ✓ ИИ-помощник (клинические ответы)<br/>
            ✓ Субтитры (CC) и голосовой тренер<br/>
            ✓ Все статьи библиотеки<br/>
            ✓ Экспорт отчёта в PDF для врача<br/>
            ✓ Без рекламы
          </div>
        </div>
        <button onClick={onSubscribe} style={{
          width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12,
          padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8,
        }}>Подписка — 99 ₽/мес</button>
        <button onClick={onClose} style={{
          width: "100%", background: C.paper, border: `1px solid ${C.line}`, color: C.ink,
          borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>Пропустить</button>
      </div>
    </Modal>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (!email.trim() || !password.trim()) { setError("Введите почту и пароль"); return; }
    if (!email.includes("@")) { setError("Проверьте формат почты"); return; }
    setError(""); onLogin();
  };
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🩺</div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 28, color: C.ink, fontWeight: 600, margin: 0 }}>Ainala</h1>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, marginTop: 4 }}>Ваш спутник безопасного восстановления</div>
      </div>
      <Card>
        <InputRow label="Почта" value={email} onChange={setEmail} placeholder="you@example.com" />
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>Пароль</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ fontFamily: FONT, fontSize: 12, color: C.rose, marginBottom: 8 }}>{error}</div>}
        <button onClick={submit} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 6 }}>
          Войти
        </button>
      </Card>
      <div style={{ textAlign: "center", fontFamily: FONT, fontSize: 12.5, color: C.pine, marginTop: 8, cursor: "pointer" }}>
        Ещё нет аккаунта? Зарегистрироваться
      </div>
      <div style={{ marginTop: 36, paddingTop: 18, borderTop: `1px solid ${C.line}`, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, marginBottom: 8 }}>Следите за нами:</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {[{ href: "https://t.me/ainalamedicine", e: "✈️" }, { href: "https://www.tiktok.com/@ainalamedicine", e: "🎵" }, { href: "https://instagram.com", e: "📸" }].map(s => (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: "50%", background: C.amberSoft, textDecoration: "none", fontSize: 16 }}>{s.e}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [healthChoice, setHealthChoice] = useState(null);
  const [manualProfile, setManualProfile] = useState({ age: "", weight: "", height: "", allergies: "", backstory: "" });
  const [calendarConnected, setCalendarConnected] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(null);
  const [units, setUnits] = useState("metric");
  const [description, setDescription] = useState("");
  const [part, setPart] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [phase, setPhase] = useState(null);
  const [pain, setPain] = useState(5);
  const [activityLevel, setActivityLevel] = useState("moderate");

  const analyze = async () => {
    if (!description.trim()) return;
    setAnalyzing(true); setAiError(false); setExplanation(null);
    const result = await analyzeInjuryDescription(description);
    setAnalyzing(false);
    if (result?.part) { setPart(result.part); setExplanation(result.explanation || null); }
    else setAiError(true);
  };

  const ChoiceBtn = ({ value, label, icon: Icon, onPick }) => (
    <button onClick={() => onPick(value)} style={{
      textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12,
      padding: "14px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink,
      cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 10, width: "100%",
    }}>
      {Icon && <Icon size={17} color={C.pine} />}{label}
    </button>
  );

  const steps = [
    {
      title: "Подключить Здоровье?",
      hint: "Apple Health / Google Fit позволит получить возраст, вес и рост автоматически.",
      render: () => (
        <>
          <ChoiceBtn value="connected" label="Подключить Apple Health / Google Fit" icon={Stethoscope} onPick={v => { setHealthChoice(v); setStep(1); }} />
          <ChoiceBtn value="manual" label="Ввести данные вручную" icon={Edit3} onPick={v => { setHealthChoice(v); setStep(1); }} />
        </>
      ),
    },
    {
      title: healthChoice === "manual" ? "Расскажите о себе" : "Данные получены",
      hint: healthChoice === "manual" ? "Возраст, вес, рост, аллергии и контекст помогут точнее настроить план." : "Соединение с Health установлено.",
      render: () => healthChoice !== "manual" ? (
        <div>
          <div style={{ background: C.pineLight, border: `1px solid ${C.pineBorder}`, borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: FONT, fontSize: 13, color: C.pine }}>
            Подключено. Возраст, вес и рост получены автоматически.
          </div>
          <button onClick={() => setStep(2)} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Продолжить</button>
        </div>
      ) : (
        <div>
          <InputRow label="Возраст" value={manualProfile.age} onChange={v => setManualProfile({ ...manualProfile, age: v })} placeholder="34" />
          <InputRow label={`Вес (${units === "metric" ? "кг" : "фунты"})`} value={manualProfile.weight} onChange={v => setManualProfile({ ...manualProfile, weight: v })} placeholder="70" />
          <InputRow label={`Рост (${units === "metric" ? "см" : "футы"})`} value={manualProfile.height} onChange={v => setManualProfile({ ...manualProfile, height: v })} placeholder="175" />
          <InputRow label="Аллергии" value={manualProfile.allergies} onChange={v => setManualProfile({ ...manualProfile, allergies: v })} placeholder="Нет / перечислите" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>Краткая история</div>
            <textarea value={manualProfile.backstory} onChange={e => setManualProfile({ ...manualProfile, backstory: e.target.value })} rows={3}
              placeholder="Например: занимаюсь бегом, травма 2 года назад…"
              style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => setStep(2)} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Продолжить</button>
        </div>
      ),
    },
    {
      title: "Подключить календарь?",
      hint: "Автоматические напоминания об упражнениях, лекарствах и визитах к врачу.",
      render: () => (
        <>
          <ChoiceBtn value={true} label="Подключить календарь" icon={CalendarIcon} onPick={v => { setCalendarConnected(v); setStep(3); }} />
          <ChoiceBtn value={false} label="Пропустить" icon={null} onPick={v => { setCalendarConnected(v); setStep(3); }} />
        </>
      ),
    },
    {
      title: "Включить уведомления?",
      hint: "Напоминания об упражнениях и приёме лекарств через пуш-уведомления.",
      render: () => (
        <>
          <ChoiceBtn value={true} label="Включить уведомления" icon={MessageCircle} onPick={v => { setNotificationsEnabled(v); setStep(4); }} />
          <ChoiceBtn value={false} label="Пропустить" icon={null} onPick={v => { setNotificationsEnabled(v); setStep(4); }} />
        </>
      ),
    },
    {
      title: "Единицы измерения",
      hint: "Можно изменить позже в профиле.",
      render: () => (
        <>
          <ChoiceBtn value="metric" label="Метрические (кг, см)" icon={null} onPick={v => { setUnits(v); setStep(5); }} />
          <ChoiceBtn value="imperial" label="Имперские (фунты, футы/дюймы)" icon={null} onPick={v => { setUnits(v); setStep(5); }} />
        </>
      ),
    },
    {
      title: "Опишите травму или операцию",
      hint: "Например: «разрыв ПКС, операция 3 недели назад» — категория подберётся автоматически.",
      render: () => (
        <div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Например: перенесла операцию на плече полтора месяца назад, есть скованность…"
            style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 12 }} />
          {!part && !aiError && (
            <button onClick={analyze} disabled={!description.trim() || analyzing}
              style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!description.trim() || analyzing) ? 0.6 : 1 }}>
              {analyzing ? "Определяю…" : "Определить категорию"}
            </button>
          )}
          {aiError && (
            <div>
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.rose, marginBottom: 10, lineHeight: 1.5 }}>
                Не удалось распознать категорию. Попробуйте описать точнее — укажите сустав или часть тела.
              </div>
              <button onClick={() => setAiError(false)} style={{ width: "100%", background: C.paper, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Изменить описание
              </button>
            </div>
          )}
          {part && !aiError && (
            <div>
              <div style={{ background: C.pineLight, border: `1px solid ${C.pineBorder}`, borderRadius: 12, padding: 13, marginBottom: 12 }}>
                <div style={{ fontFamily: FONT, fontSize: 12, color: C.pine, fontWeight: 700, marginBottom: 3 }}>Категория: {part}</div>
                {explanation && <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.pine, lineHeight: 1.4 }}>{explanation}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setPart(null); setExplanation(null); }} style={{ flex: 1, background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
                  Это неверно
                </button>
                <button onClick={() => setStep(6)} style={{ flex: 1.4, background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Продолжить
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Этап восстановления",
      hint: "Эту информацию обычно указывает врач или физиотерапевт при выписке.",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PHASES.map(p => (
            <button key={p} onClick={() => { setPhase(p); setStep(7); }}
              style={{ textAlign: "left", background: phase === p ? C.pineLight : C.paper, border: `1px solid ${phase === p ? C.pine : C.line}`, borderRadius: 12, padding: "14px 16px", fontFamily: FONT, fontSize: 14.5, fontWeight: 600, color: C.ink, cursor: "pointer" }}>
              {p} фаза
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Текущий уровень боли",
      hint: "Используется для подбора начальной сложности плана.",
      render: () => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <input type="range" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} style={{ flex: 1, accentColor: C.pine }} />
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: pain >= 7 ? C.roseSoft : pain >= 4 ? C.amberSoft : C.pineLight, color: pain >= 7 ? C.rose : pain >= 4 ? C.amberDark : C.pine, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 15 }}>{pain}</div>
          </div>
          <button onClick={() => setStep(8)} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Продолжить</button>
        </div>
      ),
    },
    {
      title: "Уровень активности",
      hint: "Помогает скорректировать интенсивность упражнений под вас.",
      render: () => (
        <div>
          {[{ id: "low", label: "Щадящий", desc: "Лёгкая бытовая активность, минимум нагрузки" }, { id: "moderate", label: "Умеренный", desc: "Прогулки, повседневная работа" }, { id: "active", label: "Активный", desc: "Возврат в спорт или физически активная работа" }].map(a => (
            <button key={a.id} onClick={() => setActivityLevel(a.id)}
              style={{ width: "100%", textAlign: "left", background: activityLevel === a.id ? C.pineLight : C.paper, border: `1px solid ${activityLevel === a.id ? C.pine : C.line}`, borderRadius: 12, padding: "13px 15px", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, cursor: "pointer", marginBottom: 8 }}>
              {a.label}
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, fontWeight: 400, marginTop: 2 }}>{a.desc}</div>
            </button>
          ))}
          <button onClick={() => onComplete({ part, phase, pain, description: sanitizeText(description), units, healthChoice, manualProfile, calendarConnected, notificationsEnabled, activityLevel })}
            style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
            Сформировать план
          </button>
        </div>
      ),
    },
  ];

  const s = steps[step];
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", background: C.bg, padding: "28px 20px" }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 22, flexWrap: "nowrap" }}>
        {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? C.pine : C.line, transition: "background 0.3s" }} />)}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Шаг {step + 1} из {steps.length}</div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, fontWeight: 600, margin: "0 0 8px" }}>{s.title}</h1>
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 22 }}>{s.hint}</p>
      {s.render()}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function HomeScreen({ todayItems, toggleDone, streak, onStartGuided, onShowSos }) {
  const doneCount = todayItems.filter(i => i.done).length;
  const percent = Math.round((doneCount / todayItems.length) * 100) || 0;
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft }}>День 12 восстановления</div>
        <button onClick={onShowSos} style={{ display: "flex", alignItems: "center", gap: 5, background: C.roseSoft, border: `1px solid #E7B8AE`, borderRadius: 20, padding: "5px 11px", fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: C.rose, cursor: "pointer" }}>
          <ShieldAlert size={13} /> SOS
        </button>
      </div>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink, margin: "2px 0 0", fontWeight: 600 }}>Доброе утро, Сэм</h1>

      <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <RecoveryRing percent={percent} size={148} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink, marginBottom: 8 }}>{doneCount} из {todayItems.length} задач</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.amber, fontFamily: FONT, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            <Flame size={16} strokeWidth={2.4} />{streak} дней подряд
          </div>
          <Pill tone="pine">Колено · ранняя фаза</Pill>
        </div>
      </Card>

      <h2 style={{ fontFamily: DISPLAY, fontSize: 17, color: C.ink, margin: "22px 0 10px", fontWeight: 600 }}>Задачи на сегодня</h2>
      {todayItems.map(item => (
        <div key={item.id} onClick={() => toggleDone(item.id)}
          style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", opacity: item.done ? 0.6 : 1 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${item.done ? C.pineSoft : C.line}`, background: item.done ? C.pineSoft : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {item.done && <Check size={15} color="#fff" strokeWidth={3} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: C.ink, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{item.meta}</div>
          </div>
          {item.type === "exercise" && !item.done && (
            <button onClick={e => { e.stopPropagation(); onStartGuided(item.exerciseId); }}
              style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <Play size={12} fill="#fff" /> Начать
            </button>
          )}
        </div>
      ))}

      <div style={{ background: "#EAF2F7", border: `1px solid ${C.amberSoft}`, borderRadius: 14, padding: 14, marginTop: 8, display: "flex", gap: 12 }}>
        <CalendarIcon size={18} color={C.amberDark} style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#234A63", lineHeight: 1.5 }}>
          <strong>Приём у др. Окафор</strong> через 5 дней. Продолжайте вести дневник симптомов.
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISES ────────────────────────────────────────────────────────────────

function ExercisesScreen({ onSelect, injuryPart }) {
  const filtered = EXERCISES.filter(e => e.part === injuryPart);
  const [videoEx, setVideoEx] = useState(null);
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle>Упражнения</ScreenTitle>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginBottom: 16 }}>Подобрано для категории «{injuryPart}»</div>
      {filtered.map(ex => (
        <div key={ex.id} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <div onClick={() => onSelect(ex.id)} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: C.pineLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Play size={18} color={C.pine} fill={C.pine} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: C.ink }}>{ex.name}</div>
                <Pill tone={ex.difficulty === "Лёгкая" ? "pine" : "amber"}>{ex.difficulty}</Pill>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{ex.sets} × {ex.reps} повт. · {ex.phase} фаза</div>
              {ex.targetRom && <div style={{ fontFamily: FONT, fontSize: 12, color: C.amberDark, marginTop: 3 }}>Цель: {ex.targetRom}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button onClick={() => onSelect(ex.id)}
              style={{ flex: 1, background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Play size={13} fill="#fff" /> Начать
            </button>
            <a href={ex.videoUrl} target="_blank" rel="noreferrer"
              style={{ flex: 1, background: C.amberSoft, color: C.amberDark, border: "none", borderRadius: 10, padding: "9px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
              <Video size={13} /> Смотреть
            </a>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT, fontSize: 13, color: C.inkSoft }}>
          Упражнения для «{injuryPart}» пока не добавлены.
        </div>
      )}
    </div>
  );
}

// ─── GUIDED SESSION ───────────────────────────────────────────────────────────

function GuidedSession({ exercise, onExit, isPremium }) {
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(exercise.workSec);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(isPremium);

  const totalPhaseSec = phase === "work" ? exercise.workSec : exercise.restSec;
  const ringPercent = Math.round(((totalPhaseSec - secondsLeft) / totalPhaseSec) * 100);

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setElapsed(0);
          if (phase === "work") {
            if (setIndex + 1 >= exercise.sets) { setDone(true); return 0; }
            setPhase("rest"); return exercise.restSec;
          } else { setSetIndex(i => i + 1); setPhase("work"); return exercise.workSec; }
        }
        setElapsed(e => e + 1);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase, setIndex, done, exercise]);

  const activeSubtitle = phase === "rest"
    ? "Отдых: расслабьте рабочую группу мышц, дышите глубоко и ровно."
    : exercise.subtitles?.find(s => elapsed >= s.from && elapsed <= s.to)?.text || exercise.instructions;

  return (
    <div style={{ minHeight: "100%", background: C.bg }}>
      {/* Видео-плеер (биомеханический) */}
      <div style={{ width: "100%", background: "linear-gradient(145deg, #16241E 0%, #1F4A3C 100%)", padding: "18px 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ background: "rgba(255,255,255,0.14)", color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
            {exercise.part} · {exercise.targetRom || "Контроль амплитуды"}
          </span>
          {isPremium && (
            <button onClick={() => setCcEnabled(v => !v)} style={{ background: ccEnabled ? C.amber : "rgba(255,255,255,0.18)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              CC {ccEnabled ? "ВКЛ" : "ВЫКЛ"}
            </button>
          )}
        </div>
        {/* SVG-анимация сустава */}
        <div style={{ display: "flex", justifyContent: "center", height: 120 }}>
          <svg width="240" height="116" viewBox="0 0 240 116">
            <line x1="20" y1="100" x2="220" y2="100" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <circle cx="120" cy="68" r="36" fill="none" stroke="rgba(111,163,199,0.25)" strokeDasharray="3 3" />
            <line x1="65" y1="68" x2="120" y2="68" stroke="#DCEAF3" strokeWidth="10" strokeLinecap="round" />
            <g className={phase === "work" ? "exercise-anim-limb" : ""}>
              <line x1="120" y1="68" x2="182" y2="92" stroke="#6FA3C7" strokeWidth="9" strokeLinecap="round" />
              <circle cx="184" cy="93" r="6" fill="#DCEAF3" />
            </g>
            <circle cx="120" cy="68" r="8" fill="#C1543F" stroke="#fff" strokeWidth="2.5" />
            <text x="120" y="22" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="11" fontFamily={FONT}>
              {phase === "work" ? "Плавно, без рывков — 2 сек вверх / 2 сек вниз" : "Восстановите дыхание — отдых"}
            </text>
          </svg>
        </div>
        {ccEnabled && (
          <div style={{ background: "rgba(0,0,0,0.65)", borderRadius: 10, padding: "8px 12px", fontSize: 12.5, lineHeight: 1.45, textAlign: "center", color: "#F4F6F4", border: "1px solid rgba(255,255,255,0.14)", marginTop: 6 }}>
            <span style={{ color: C.amber, fontWeight: 700, marginRight: 6 }}>[CC]</span>{activeSubtitle}
          </div>
        )}
      </div>

      <div style={{ padding: "18px 18px 40px" }}>
        <button onClick={onExit} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, color: C.inkSoft, fontFamily: FONT, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18 }}>
          <ChevronLeft size={16} /> Выйти из тренировки
        </button>

        {!done ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <Pill tone={phase === "work" ? "pine" : "amber"}>{phase === "work" ? "Выполняйте движение" : "Отдых"}</Pill>
            </div>
            <h1 style={{ fontFamily: DISPLAY, textAlign: "center", fontSize: 22, color: C.ink, margin: "8px 0 4px", fontWeight: 600 }}>{exercise.name}</h1>
            <div style={{ textAlign: "center", fontFamily: FONT, fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>
              Подход {setIndex + 1} из {exercise.sets} · {exercise.reps} повторений
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              {/* ИСПРАВЛЕНО: centerValue передаётся явно, текст не накладывается */}
              <RecoveryRing
                percent={ringPercent}
                size={180}
                strokeColor={phase === "work" ? C.pine : C.amber}
                centerValue={String(secondsLeft)}
                centerLabel="СЕКУНД"
                isMono={true}
              />
            </div>
            <Card>
              <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>{exercise.instructions}</div>
              {exercise.biomechanicsTip && (
                <div style={{ marginTop: 8, background: C.amberSoft, borderRadius: 8, padding: "8px 10px", fontFamily: FONT, fontSize: 12.5, color: C.amberDark, lineHeight: 1.5 }}>
                  💡 {exercise.biomechanicsTip}
                </div>
              )}
              <div style={{ marginTop: 8, color: C.rose, fontSize: 12.5, fontFamily: FONT }}>⚠ {exercise.caution}</div>
            </Card>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {running ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
                {running ? "Пауза" : "Продолжить"}
              </button>
              <button onClick={() => {
                if (phase === "work") { if (setIndex + 1 >= exercise.sets) { setDone(true); } else { setPhase("rest"); setSecondsLeft(exercise.restSec); setElapsed(0); } }
                else { setSetIndex(i => i + 1); setPhase("work"); setSecondsLeft(exercise.workSec); setElapsed(0); }
              }} style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                <SkipForward size={16} /> Далее
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🌿</div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, fontWeight: 600 }}>Тренировка завершена!</h1>
            <p style={{ fontFamily: FONT, fontSize: 14, color: C.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
              Отличная работа. Упражнение отмечено выполненным.<br/>
              <span style={{ color: C.amber, fontWeight: 600 }}>+1 к стрику 🔥</span>
            </p>
            <button onClick={onExit} style={{ marginTop: 20, background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "12px 26px", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Вернуться на главную
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

function ProgressScreen({ log, streak, adherence, pain, setPain, onLogPain }) {
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryEntry, setDiaryEntry] = useState("");
  const [diaryLog, setDiaryLog] = useState([]);
  const badges = [
    { icon: "🔥", label: "6 дней подряд", earned: true },
    { icon: "🦵", label: "10 упражнений", earned: true },
    { icon: "📉", label: "Боль ↓ на 3 балла", earned: true },
    { icon: "🏅", label: "Первый месяц", earned: false },
    { icon: "💧", label: "7 дней подряд питьевой режим", earned: false },
    { icon: "🥗", label: "Белок каждый день (7 дней)", earned: false },
  ];
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle>Прогресс</ScreenTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.pine, fontWeight: 600 }}>{adherence}%</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>Выполнение, 7 дней</div>
        </Card>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.amber, fontWeight: 600 }}>{streak}</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>Дней подряд 🔥</div>
        </Card>
      </div>

      <h2 style={{ fontFamily: DISPLAY, fontSize: 16, color: C.ink, margin: "18px 0 10px", fontWeight: 600 }}>Боль и подвижность</h2>
      <Card style={{ padding: "14px 8px 4px" }}>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={log}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} width={22} />
            <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 8, border: `1px solid ${C.line}` }} />
            <Line type="monotone" dataKey="pain" stroke={C.rose} strokeWidth={2.5} dot={{ r: 3 }} name="Боль" />
            <Line type="monotone" dataKey="mobility" stroke={C.pineSoft} strokeWidth={2.5} dot={{ r: 3 }} name="Подвижность" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", paddingBottom: 8, fontFamily: FONT, fontSize: 12, color: C.inkSoft }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.rose, display: "inline-block" }} />Боль</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.pineSoft, display: "inline-block" }} />Подвижность</span>
        </div>
      </Card>

      <h2 style={{ fontFamily: DISPLAY, fontSize: 16, color: C.ink, margin: "18px 0 10px", fontWeight: 600 }}>Оценить боль сейчас</h2>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} style={{ flex: 1, accentColor: C.pine }} />
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: pain >= 7 ? C.roseSoft : pain >= 4 ? C.amberSoft : C.pineLight, color: pain >= 7 ? C.rose : pain >= 4 ? C.amberDark : C.pine, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 14 }}>{pain}</div>
        </div>
        {pain >= 8 && (
          <div style={{ marginTop: 10, background: C.roseSoft, borderRadius: 12, padding: 12, fontFamily: FONT, fontSize: 12.5, color: C.rose, lineHeight: 1.5 }}>
            🚨 Такой уровень боли требует осмотра врача. Не продолжайте упражнения.
          </div>
        )}
        <button onClick={onLogPain} style={{ marginTop: 12, width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Сохранить запись</button>
      </Card>

      {/* Дневник симптомов */}
      <h2 style={{ fontFamily: DISPLAY, fontSize: 16, color: C.ink, margin: "18px 0 10px", fontWeight: 600 }}>Дневник симптомов</h2>
      <Card>
        <textarea value={diaryEntry} onChange={e => setDiaryEntry(e.target.value)} placeholder="Как вы себя чувствовали сегодня? Отёк, скованность, настроение…" rows={3}
          style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontFamily: FONT, fontSize: 13, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
        <button onClick={() => { if (diaryEntry.trim()) { setDiaryLog(l => [{ id: Date.now(), date: new Date().toLocaleDateString("ru"), text: sanitizeText(diaryEntry, 500) }, ...l]); setDiaryEntry(""); } }}
          style={{ marginTop: 8, width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Добавить запись
        </button>
        {diaryLog.slice(0, 3).map(e => (
          <div key={e.id} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, marginBottom: 3 }}>{e.date}</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{e.text}</div>
          </div>
        ))}
      </Card>

      <h2 style={{ fontFamily: DISPLAY, fontSize: 16, color: C.ink, margin: "18px 0 10px", fontWeight: 600 }}>Достижения</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {badges.map((b, i) => (
          <div key={i} style={{ background: b.earned ? C.pineLight : C.paper, border: `1px solid ${b.earned ? C.pineBorder : C.line}`, borderRadius: 14, padding: 14, opacity: b.earned ? 1 : 0.55, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{b.icon}</div>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 6 }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* Чек-лист сна и питания */}
      <h2 style={{ fontFamily: DISPLAY, fontSize: 16, color: C.ink, margin: "18px 0 10px", fontWeight: 600 }}>Чек-лист восстановления</h2>
      {RECOVERY_CARE_CHECKLIST.map(item => {
        const Icon = item.category === "Сон" ? Moon : item.category === "Питание" ? Utensils : Heart;
        return (
          <Card key={item.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: item.category === "Сон" ? C.amberSoft : C.pineLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={17} color={item.category === "Сон" ? C.amberDark : C.pine} />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{item.title}</div>
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginTop: 3, lineHeight: 1.45 }}>{item.subtitle}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── AI ASSISTANT ──────────────────────────────────────────────────────────────

function AiAssistantScreen({ isPremium, onShowPremiumModal, injuryProfile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Привет! Я помогу с общими вопросами о реабилитации — объясню термины, дам рекомендации по сну и питанию, предупрежу об опасных симптомах. При серьёзных симптомах всегда обращайтесь к врачу." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  if (!isPremium) {
    return (
      <div style={{ padding: "20px 18px 24px" }}>
        <ScreenTitle>ИИ-помощник</ScreenTitle>
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 18, color: C.ink, fontWeight: 600, margin: "0 0 8px" }}>Только для Premium</h2>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, margin: "0 0 20px" }}>ИИ-ассистент с клиническими ответами и детектором опасных симптомов.</p>
          <button onClick={onShowPremiumModal} style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Перейти на Premium
          </button>
        </div>
      </div>
    );
  }

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: sanitizeText(input.trim(), 600) };
    setMessages(m => [...m, userMsg]);
    setInput(""); setLoading(true);
    const reply = await generateClinicalAiReply(userMsg.text, injuryProfile);
    setMessages(m => [...m, { role: "assistant", text: reply }]);
    setLoading(false);
  };

  const suggestions = ["Что такое амплитуда движения (ROM)?", "Нормально ли, что колено щёлкает?", "Как питание влияет на заживление?", "Что делать при отёке после упражнения?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 18px 8px" }}><ScreenTitle>ИИ-помощник</ScreenTitle></div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{ maxWidth: "82%", background: m.role === "user" ? C.pine : C.paper, color: m.role === "user" ? "#fff" : C.ink, border: m.role === "user" ? "none" : `1px solid ${C.line}`, borderRadius: 14, padding: "10px 13px", fontFamily: FONT, fontSize: 13.5, lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 13px", fontFamily: FONT, fontSize: 13, color: C.inkSoft }}>Печатает…</div>
          </div>
        )}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)} style={{ textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px", fontFamily: FONT, fontSize: 13, color: C.pine, cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `1px solid ${C.line}`, background: C.paper }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Задайте вопрос…" style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px", fontFamily: FONT, fontSize: 13.5, outline: "none" }} />
        <button onClick={send} disabled={loading} style={{ background: C.pine, border: "none", borderRadius: 12, width: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

function CalendarScreen() {
  const iconFor = {
    exercise: <Dumbbell size={15} color={C.pine} />,
    med: <PillIcon size={15} color={C.amber} />,
    doctor: <Stethoscope size={15} color={C.rose} />,
  };
  const [events, setEvents] = useState(CALENDAR_EVENTS);
  const [doctorAccess, setDoctorAccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", type: "exercise" });

  const addReminder = () => {
    if (!form.title.trim() || !form.date.trim()) return;
    setEvents(ev => [...ev, { id: `c${Date.now()}`, date: sanitizeText(form.date.trim(), 30), time: sanitizeText(form.time.trim(), 10) || "—", type: form.type, title: sanitizeText(form.title.trim(), 100) }]);
    setForm({ title: "", date: "", time: "", type: "exercise" });
    setShowForm(false);
  };
  const groups = events.reduce((acc, e) => { (acc[e.date] = acc[e.date] || []).push(e); return acc; }, {});

  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle right={
        <button onClick={() => setShowForm(v => !v)} style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          + Напоминание
        </button>
      }>Календарь</ScreenTitle>

      {showForm && (
        <Card>
          <InputRow label="Название" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Например: приём витаминов" />
          <InputRow label="Дата" value={form.date} onChange={v => setForm({ ...form, date: v })} placeholder="26 авг" />
          <InputRow label="Время" value={form.time} onChange={v => setForm({ ...form, time: v })} placeholder="09:00" />
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[{ v: "exercise", l: "Упражнение" }, { v: "med", l: "Лекарство" }, { v: "doctor", l: "Врач" }].map(o => (
              <button key={o.v} onClick={() => setForm({ ...form, type: o.v })}
                style={{ flex: 1, background: form.type === o.v ? C.pine : C.bg, color: form.type === o.v ? "#fff" : C.inkSoft, border: `1px solid ${form.type === o.v ? C.pine : C.line}`, borderRadius: 10, padding: "8px 4px", fontFamily: FONT, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {o.l}
              </button>
            ))}
          </div>
          <button onClick={addReminder} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Добавить</button>
        </Card>
      )}

      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Stethoscope size={18} color={C.pine} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: C.ink }}>Разрешить врачу добавлять напоминания</div>
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>Врач сможет назначать упражнения и визиты</div>
        </div>
        <button onClick={() => setDoctorAccess(v => !v)} style={{ width: 44, height: 24, borderRadius: 999, background: doctorAccess ? C.pine : C.line, border: "none", cursor: "pointer", position: "relative", flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: doctorAccess ? 22 : 3, transition: "left 0.2s" }} />
        </button>
      </Card>

      {Object.entries(groups).map(([date, evs]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>{date}</div>
          {evs.map(e => (
            <Card key={e.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{iconFor[e.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.ink }}>{e.title}</div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{e.time}</div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

function ProfileScreen({ injuryProfile, onExportData }) {
  const mp = injuryProfile?.manualProfile;
  const usingManual = injuryProfile?.healthChoice === "manual";
  const [units, setUnits] = useState(injuryProfile?.units || "metric");
  const Field = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink }}>{value}</span>
    </div>
  );
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle>Профиль</ScreenTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.pineLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={26} color={C.pine} />
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>Сэм</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft }}>{usingManual ? "Данные введены вручную" : "Данные из Health"}</div>
        </div>
      </div>
      <Card>
        <Field label="Травма / сустав" value={injuryProfile?.part || "—"} />
        <Field label="Фаза" value={injuryProfile?.phase || "—"} />
        <Field label="Уровень боли при регистрации" value={`${injuryProfile?.pain ?? "—"} / 10`} />
        <Field label="Активность" value={injuryProfile?.activityLevel || "умеренная"} />
        {usingManual && mp?.age && <Field label="Возраст" value={mp.age} />}
        {usingManual && mp?.weight && <Field label="Вес" value={`${mp.weight} ${units === "metric" ? "кг" : "фунт."}`} />}
        {usingManual && mp?.height && <Field label="Рост" value={`${mp.height} ${units === "metric" ? "см" : "дюйм."}`} />}
        {usingManual && mp?.allergies && <Field label="Аллергии" value={mp.allergies} />}
      </Card>
      {usingManual && mp?.backstory && (
        <Card>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 4 }}>Контекст</div>
          <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{mp.backstory}</div>
        </Card>
      )}
      <h2 style={{ fontFamily: DISPLAY, fontSize: 15, color: C.ink, margin: "16px 0 10px", fontWeight: 600 }}>Настройки</h2>
      <Card>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink, marginBottom: 10 }}>Единицы измерения</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: "metric", l: "Метрические" }, { v: "imperial", l: "Имперские" }].map(o => (
            <button key={o.v} onClick={() => setUnits(o.v)} style={{ flex: 1, background: units === o.v ? C.pine : C.bg, color: units === o.v ? "#fff" : C.inkSoft, border: `1px solid ${units === o.v ? C.pine : C.line}`, borderRadius: 10, padding: "9px 0", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {o.l}
            </button>
          ))}
        </div>
      </Card>
      <button onClick={onExportData} style={{ width: "100%", background: C.amberSoft, color: C.amberDark, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Share2 size={16} /> Экспорт данных (GDPR / 152-ФЗ)
      </button>
    </div>
  );
}

// ─── LIBRARY ──────────────────────────────────────────────────────────────────

function LibraryScreen({ submissions, onSubmit }) {
  const [tab, setTab] = useState("short");
  const [openId, setOpenId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", link: "" });
  const submit = () => {
    if (!form.title.trim()) return;
    onSubmit({ title: sanitizeText(form.title.trim(), 200), body: sanitizeText(form.body.trim(), 2000), link: form.link.trim() });
    setForm({ title: "", body: "", link: "" }); setShowForm(false);
  };
  const mine = submissions.filter(s => s.status === "pending");
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle right={
        <button onClick={() => setShowForm(v => !v)} style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>+ Предложить</button>
      }>Библиотека</ScreenTitle>

      {showForm && (
        <Card>
          <InputRow label="Заголовок" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Название статьи" />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>Текст (необязательно)</div>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
              style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px", fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
          <InputRow label="Ссылка на источник" value={form.link} onChange={v => setForm({ ...form, link: v })} placeholder="https://…" />
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.inkSoft, marginBottom: 10 }}>Модераторы проверят материал перед публикацией.</div>
          <button onClick={submit} style={{ width: "100%", background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Отправить</button>
        </Card>
      )}

      {mine.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12.5, color: C.inkSoft, marginBottom: 8 }}>Ваши материалы</div>
          {mine.map(u => (
            <Card key={u.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{u.title}</div>
                <Pill tone="amber">На модерации</Pill>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ v: "short", l: "Вопрос-ответ" }, { v: "long", l: "Статьи" }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{ flex: 1, background: tab === t.v ? C.pine : C.paper, color: tab === t.v ? "#fff" : C.inkSoft, border: `1px solid ${tab === t.v ? C.pine : C.line}`, borderRadius: 10, padding: "9px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "short" && SHORT_ARTICLES.map(a => (
        <Card key={a.id} onClick={() => setOpenId(openId === a.id ? null : a.id)} style={{ cursor: "pointer" }}>
          <Pill tone="amber">{a.category}</Pill>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: C.ink, marginTop: 8 }}>{a.q}</div>
          {openId === a.id && <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.55 }}>{a.a}</div>}
        </Card>
      ))}

      {tab === "long" && LONG_ARTICLES.map(a => (
        <Card key={a.id} onClick={() => setOpenId(openId === a.id ? null : a.id)} style={{ cursor: "pointer" }}>
          <Pill tone="pine">{a.category}</Pill>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: C.ink, marginTop: 8 }}>{a.title}</div>
          {openId === a.id && <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.55 }}>{a.body}</div>}
        </Card>
      ))}
    </div>
  );
}

// ─── DOCTOR ───────────────────────────────────────────────────────────────────

function DoctorScreen() {
  const [shared, setShared] = useState(false);
  const [editing, setEditing] = useState(false);
  const [doctor, setDoctor] = useState({ name: "др. Окафор", specialty: "Ортопед-травматолог", phone: "", email: "" });
  const [draft, setDraft] = useState(doctor);
  const save = () => { setDoctor(draft); setEditing(false); };
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle>Врач</ScreenTitle>
      <Card>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: C.ink, marginBottom: 4 }}>Отчёт за неделю</div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>Выполнение: 86% · Боль: 6→3 · Подвижность: +3 балла · Пропущено: 1 сессия</div>
      </Card>
      <Card>
        {!editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Stethoscope size={20} color={C.pine} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{doctor.name}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft }}>{doctor.specialty}</div>
              {(doctor.phone || doctor.email) && <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{[doctor.phone, doctor.email].filter(Boolean).join(" · ")}</div>}
            </div>
            <button onClick={() => { setDraft(doctor); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.pine, display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 12.5, fontWeight: 600 }}>
              <Edit3 size={14} /> Изменить
            </button>
          </div>
        ) : (
          <>
            <InputRow label="Имя врача" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} placeholder="др. Иванова" />
            <InputRow label="Специализация" value={draft.specialty} onChange={v => setDraft({ ...draft, specialty: v })} placeholder="Физиотерапевт" />
            <InputRow label="Телефон" value={draft.phone} onChange={v => setDraft({ ...draft, phone: v })} placeholder="+7 900 000-00-00" />
            <InputRow label="Email" value={draft.email} onChange={v => setDraft({ ...draft, email: v })} placeholder="doctor@clinic.ru" />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} style={{ flex: 1, background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Сохранить</button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, background: C.bg, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Отмена</button>
            </div>
          </>
        )}
      </Card>
      <button onClick={() => setShared(true)} disabled={!doctor.phone && !doctor.email}
        style={{ width: "100%", background: (!doctor.phone && !doctor.email) ? C.line : C.pine, color: (!doctor.phone && !doctor.email) ? C.inkSoft : "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: (!doctor.phone && !doctor.email) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Share2 size={16} /> Поделиться отчётом
      </button>
      {(!doctor.phone && !doctor.email) && <div style={{ marginTop: 8, textAlign: "center", fontFamily: FONT, fontSize: 12, color: C.inkSoft }}>Добавьте контакт врача, чтобы отправить отчёт</div>}
      {shared && <div style={{ marginTop: 12, textAlign: "center", fontFamily: FONT, fontSize: 12.5, color: C.pine }}>Отчёт отправлен на {doctor.email || doctor.phone} ✓</div>}
    </div>
  );
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────

function CommunityScreen({ injuryProfile, posts, onSubmit }) {
  const [draft, setDraft] = useState("");
  const approved = posts.filter(p => p.status === "approved");
  const ownPending = posts.filter(p => p.status === "pending" && p.author === "Вы");
  const publish = () => {
    if (!draft.trim()) return;
    const tag = injuryProfile ? `${injuryProfile.part} · ${(injuryProfile.phase || "").toLowerCase()} фаза` : "Участник";
    onSubmit({ author: "Вы", tag, text: sanitizeText(draft.trim(), 600) });
    setDraft("");
  };
  return (
    <div style={{ padding: "20px 18px 24px" }}>
      <ScreenTitle>Сообщество</ScreenTitle>
      <Card>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Поделитесь прогрессом или задайте вопрос…" rows={3}
          style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", fontFamily: FONT, fontSize: 13.5, color: C.ink, outline: "none", resize: "none", boxSizing: "border-box" }} />
        <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.inkSoft, margin: "6px 0 8px" }}>Посты проверяются модераторами перед публикацией.</div>
        <button onClick={publish} style={{ background: C.pine, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: "pointer", float: "right" }}>Опубликовать</button>
        <div style={{ clear: "both" }} />
      </Card>
      {ownPending.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.ink }}>Вы</div>
            <Pill tone="amber">На модерации</Pill>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{p.text}</div>
        </Card>
      ))}
      {approved.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{p.author}</div>
            <Pill>{p.tag}</Pill>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{p.text}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, color: C.inkSoft, fontFamily: FONT, fontSize: 12 }}>♡ {p.likes}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── MORE SHEET ───────────────────────────────────────────────────────────────

function MoreSheet({ open, onClose, onNavigate }) {
  const items = [
    { key: "calendar", icon: CalendarIcon, label: "Календарь" },
    { key: "profile", icon: User, label: "Профиль" },
    { key: "library", icon: BookOpen, label: "Библиотека" },
    { key: "doctor", icon: Stethoscope, label: "Врач" },
    { key: "community", icon: Users, label: "Сообщество" },
  ];
  return (
    <Modal open={open} onClose={onClose} sheet>
      <div style={{ width: 36, height: 4, background: C.line, borderRadius: 999, margin: "0 auto 14px" }} />
      {items.map(it => (
        <button key={it.key} onClick={() => onNavigate(it.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", padding: "13px 4px", cursor: "pointer", borderBottom: `1px solid ${C.line}` }}>
          <it.icon size={19} color={C.pine} />
          <span style={{ fontFamily: FONT, fontSize: 15, color: C.ink, fontWeight: 600 }}>{it.label}</span>
          <ChevronRight size={16} color={C.inkSoft} style={{ marginLeft: "auto" }} />
        </button>
      ))}
    </Modal>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, padding: "8px 0", cursor: "pointer", color: active ? C.pine : "#9AA6A0" }}>
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildTodayItems(profile) {
  const matched = EXERCISES.filter(e => e.part === profile.part && e.phase === profile.phase);
  const pool = matched.length ? matched : EXERCISES.filter(e => e.part === profile.part);
  const chosen = (pool.length ? pool : EXERCISES).slice(0, 2);
  const items = chosen.map((ex, i) => ({ id: `t${i + 1}`, type: "exercise", exerciseId: ex.id, label: ex.name, meta: `${ex.sets} × ${ex.reps} повторений`, done: false }));
  items.push({ id: "t-med", type: "med", label: "Приём обезболивающего", meta: "13:00", done: false });
  return items;
}

const PRIMARY_TABS = ["home", "exercises", "progress", "ai"];

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => loadPersistedState("loggedIn", false));
  const [injuryProfile, setInjuryProfile] = useState(() => loadPersistedState("injuryProfile", null));
  const [isPremium, setIsPremium] = useState(() => loadPersistedState("isPremium", false));
  const [tab, setTab] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [guidedExerciseId, setGuidedExerciseId] = useState(null);
  const [streak] = useState(6);
  const [symptomLog, setSymptomLog] = useState(INITIAL_LOG);
  const [pain, setPain] = useState(3);
  const [todayItems, setTodayItems] = useState([]);
  const [communityPosts, setCommunityPosts] = useState(COMMUNITY_POSTS);
  const [librarySubmissions, setLibrarySubmissions] = useState([]);

  // Сохраняем ключевые данные в localStorage
  useEffect(() => { savePersistedState("loggedIn", loggedIn); }, [loggedIn]);
  useEffect(() => { savePersistedState("injuryProfile", injuryProfile); }, [injuryProfile]);
  useEffect(() => { savePersistedState("isPremium", isPremium); }, [isPremium]);

  const activeExercise = useMemo(() => EXERCISES.find(e => e.id === guidedExerciseId), [guidedExerciseId]);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  if (!injuryProfile) {
    return (
      <OnboardingScreen onComplete={profile => {
        setInjuryProfile(profile);
        setPain(profile.pain);
        setTodayItems(buildTodayItems(profile));
      }} />
    );
  }

  const toggleDone = id => setTodayItems(items => items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const finishGuided = () => {
    if (guidedExerciseId) setTodayItems(items => items.map(i => i.exerciseId === guidedExerciseId ? { ...i, done: true } : i));
    setGuidedExerciseId(null);
    setTab("home");
  };
  const logPain = () => setSymptomLog(log => { const next = [...log]; next[next.length - 1] = { ...next[next.length - 1], pain }; return next; });

  if (guidedExerciseId && activeExercise) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", background: C.bg }}>
        <GuidedSession exercise={activeExercise} onExit={finishGuided} isPremium={isPremium} />
      </div>
    );
  }

  const isMoreTab = !PRIMARY_TABS.includes(tab);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {tab === "home" && <HomeScreen todayItems={todayItems} toggleDone={toggleDone} streak={streak} onStartGuided={setGuidedExerciseId} onShowSos={() => setSosOpen(true)} />}
        {tab === "exercises" && <ExercisesScreen onSelect={id => { setGuidedExerciseId(id); }} injuryPart={injuryProfile.part} />}
        {tab === "progress" && <ProgressScreen log={symptomLog} streak={streak} adherence={86} pain={pain} setPain={setPain} onLogPain={logPain} />}
        {tab === "ai" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <AiAssistantScreen isPremium={isPremium} onShowPremiumModal={() => setPremiumOpen(true)} injuryProfile={injuryProfile} />
          </div>
        )}
        {tab === "calendar" && <CalendarScreen />}
        {tab === "profile" && <ProfileScreen injuryProfile={injuryProfile} onExportData={() => exportGdprDataSnapshot({ injuryProfile, symptomLog, streak })} />}
        {tab === "library" && <LibraryScreen submissions={librarySubmissions} onSubmit={item => setLibrarySubmissions(s => [{ id: `u${Date.now()}`, status: "pending", ...item }, ...s])} />}
        {tab === "doctor" && <DoctorScreen />}
        {tab === "community" && <CommunityScreen injuryProfile={injuryProfile} posts={communityPosts} onSubmit={item => setCommunityPosts(p => [{ id: `p${Date.now()}`, status: "pending", likes: 0, ...item }, ...p])} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ display: "flex", borderTop: `1px solid ${C.line}`, background: C.paper, position: "sticky", bottom: 0, flexShrink: 0 }}>
        <NavButton icon={Home} label="Главная" active={tab === "home"} onClick={() => setTab("home")} />
        <NavButton icon={Dumbbell} label="Упражнения" active={tab === "exercises"} onClick={() => setTab("exercises")} />
        <NavButton icon={TrendingUp} label="Прогресс" active={tab === "progress"} onClick={() => setTab("progress")} />
        <NavButton icon={MessageCircle} label="ИИ" active={tab === "ai"} onClick={() => setTab("ai")} />
        <NavButton icon={MoreHorizontal} label="Ещё" active={isMoreTab} onClick={() => setMoreOpen(true)} />
      </div>

      {/* Modals */}
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onNavigate={key => { setTab(key); setMoreOpen(false); }} />
      <RedFlagsModal open={sosOpen} onClose={() => setSosOpen(false)} />
      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} onSubscribe={() => { setIsPremium(true); setPremiumOpen(false); }} />
    </div>
  );
}
