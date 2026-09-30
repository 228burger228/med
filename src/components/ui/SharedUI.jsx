import React, { useEffect, useRef } from "react";
import { X, PhoneCall, ShieldAlert, AlertTriangle, Check } from "lucide-react";
import { C, TONES, DISPLAY, FONT, MONO } from "../../theme/tokens";
import { RED_FLAGS, PHASES } from "../../data/mockData";
import { painTone } from "../../utils/stats";

// ─── Модальное окно на нативном <dialog> ─────────────────────────────────────

export function Modal({ open, onClose, title, sheet = false, children }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handleClose = () => onCloseRef.current?.();
    // Закрытие по клику на фон (в т.ч. в браузерах без closedby="any")
    const handleClick = (e) => {
      if (e.target === d) d.close();
    };
    d.addEventListener("close", handleClose);
    d.addEventListener("click", handleClick);
    return () => {
      d.removeEventListener("close", handleClose);
      d.removeEventListener("click", handleClick);
    };
  }, [open]);

  if (!open) return null;
  return (
    <dialog ref={ref} aria-label={title} className={sheet ? "ainala-sheet" : "ainala-dialog"}>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

export function ModalHeader({ icon, title, onClose }) {
  return (
    <div className="between" style={{ marginBottom: 12 }}>
      <div className="row" style={{ gap: 8 }}>
        {icon}
        <h2 style={{ fontFamily: DISPLAY, fontSize: 19, margin: 0, fontWeight: 600 }}>{title}</h2>
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
        <X size={20} />
      </button>
    </div>
  );
}

// ─── Базовые элементы ────────────────────────────────────────────────────────

export function Pill({ children, tone = "neutral", style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
        padding: "4px 10px",
        borderRadius: 999,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Card({ children, style, onClick, tinted = false, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`card ${tinted ? "tinted" : ""} ${className}`}
      style={onClick ? { width: "100%", textAlign: "left", display: "block", ...style } : style}
    >
      {children}
    </Tag>
  );
}

export function ScreenTitle({ children, right, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="between">
        <h1 className="h1">{children}</h1>
        {right}
      </div>
      {subtitle && <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field" style={{ display: "block" }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function InputRow({ label, value, onChange, placeholder, type = "text", inputMode, ...rest }) {
  return (
    <Field label={label}>
      <input
        className="input"
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
      />
    </Field>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={value === o.value}
            className={value === o.value ? "active" : ""}
            onClick={() => onChange(o.value)}
          >
            {Icon && <Icon size={14} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Боль ────────────────────────────────────────────────────────────────────

const PAIN_WORDS = ["Нет боли", "Едва заметная", "Слабая", "Лёгкая", "Умеренная", "Заметная", "Сильная", "Очень сильная", "Выраженная", "Тяжёлая", "Нестерпимая"];

export function PainBadge({ value }) {
  const t = TONES[painTone(value)];
  return (
    <div className="pain-badge" style={{ background: t.bg, color: t.fg }}>
      {value}
    </div>
  );
}

export function PainSlider({ value, onChange, label = "Уровень боли" }) {
  return (
    <div>
      <div className="between" style={{ marginBottom: 10 }}>
        <div>
          <div className="field-label" style={{ marginBottom: 0 }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{PAIN_WORDS[value]}</div>
        </div>
        <PainBadge value={value} />
      </div>
      <input
        className="pain-range"
        type="range"
        min="0"
        max="10"
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="between small" style={{ marginTop: 6, fontSize: 11 }}>
        <span>0 — нет</span>
        <span>5</span>
        <span>10 — максимум</span>
      </div>
    </div>
  );
}

export function PainAdvice({ value }) {
  if (value >= 7)
    return (
      <div className="alert critical" style={{ marginTop: 12, marginBottom: 0 }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Сегодня без упражнений</strong>
          Боль 7+ — повод остановить тренировки и связаться с врачом, особенно если она не стихает в покое.
        </div>
      </div>
    );
  if (value >= 4)
    return (
      <div className="alert urgent" style={{ marginTop: 12, marginBottom: 0 }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Жёлтая зона</strong>
          Уменьшите амплитуду и число повторений. Если боль не проходит за час — сделайте перерыв.
        </div>
      </div>
    );
  return null;
}

// ─── Предупреждение о «красном флаге» ─────────────────────────────────────────

export function RedFlagAlert({ flag, onShowSos }) {
  if (!flag) return null;
  return (
    <div className={`alert ${flag.level === "critical" ? "critical" : "urgent"}`} role="alert">
      <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <strong>{flag.title}</strong>
        {flag.message}
        {flag.level === "critical" && (
          <div className="row" style={{ marginTop: 10, gap: 8, flexWrap: "wrap" }}>
            <a href="tel:112" className="btn btn-danger sm">
              <PhoneCall size={14} /> Позвонить 112
            </a>
            {onShowSos && (
              <button className="btn btn-secondary sm" onClick={onShowSos}>
                Все опасные симптомы
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Кольцо прогресса ────────────────────────────────────────────────────────

export function RecoveryRing({ percent, size = 140, centerValue, centerLabel = "СЕГОДНЯ", strokeColor = C.teal, isMono = false }) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (safe / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} role="img" aria-label={`${safe}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="49%" textAnchor="middle" fontSize={isMono ? 36 : size * 0.2} fontFamily={isMono ? MONO : DISPLAY} fill={C.ink} fontWeight="600">
        {centerValue !== undefined ? centerValue : `${safe}%`}
      </text>
      <text x="50%" y="65%" textAnchor="middle" fontSize="10" fontFamily={FONT} fill={C.inkSoft} fontWeight="700" letterSpacing="0.08em">
        {centerLabel}
      </text>
    </svg>
  );
}

// ─── Схема тела с отметкой травмы ────────────────────────────────────────────

const BODY_SPOTS = {
  "Колено": [60, 140],
  "Плечо": [67, 43],
  "Спина": [50, 82],
  "Перелом руки": [79, 102],
  "Голеностоп": [60, 181],
};

export function BodyMap({ part, size = 96, figure = "#CADBD3" }) {
  const spot = BODY_SPOTS[part];
  const limb = { stroke: figure, strokeWidth: 10, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <svg width={size * 0.55} height={size} viewBox="0 0 100 196" role="img" aria-label={part ? `Область: ${part}` : "Схема тела"}>
      <circle cx="50" cy="18" r="12" fill={figure} />
      <rect x="33" y="35" width="34" height="58" rx="13" fill={figure} />
      <polyline points="36,42 25,76 21,108" {...limb} />
      <polyline points="64,42 75,76 79,108" {...limb} />
      <polyline points="42,90 40,140 40,184" {...limb} />
      <polyline points="58,90 60,140 60,184" {...limb} />
      {spot && (
        <>
          <circle className="body-map-pulse" cx={spot[0]} cy={spot[1]} r="13" fill={C.coral} opacity="0.3" />
          <circle cx={spot[0]} cy={spot[1]} r="6" fill={C.coral} stroke="#fff" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

// ─── Этапы восстановления ────────────────────────────────────────────────────

export function JourneyStepper({ phase }) {
  const idx = PHASES.indexOf(phase);
  return (
    <div className="journey">
      {PHASES.map((p, i) => (
        <div key={p} className={`journey-step ${i < idx ? "done" : i === idx ? "current" : ""}`}>
          <div className="journey-dot">{i < idx && <Check size={12} strokeWidth={3} />}</div>
          {p}
        </div>
      ))}
    </div>
  );
}

// ─── Памятка «Красные флаги» ──────────────────────────────────────────────────

export function RedFlagsModal({ open, onClose }) {
  const block = (item, tone) => (
    <div
      key={item.id}
      style={{
        background: tone === "red" ? C.redSoft : C.amberSoft,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, color: tone === "red" ? C.red : "#8A5A00" }}>{item.title}</div>
      <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{item.desc}</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: tone === "red" ? C.red : "#8A5A00" }}>→ {item.action}</div>
    </div>
  );
  return (
    <Modal open={open} onClose={onClose} title="Красные флаги">
      <ModalHeader icon={<ShieldAlert size={22} color={C.red} />} title="Когда срочно нужен врач" onClose={onClose} />
      <p className="muted" style={{ margin: "0 0 14px" }}>
        При любом из этих симптомов <strong>немедленно прекратите упражнения</strong>.
      </p>
      <div className="eyebrow" style={{ color: C.red, marginBottom: 8 }}>Скорая помощь — 103 / 112</div>
      {RED_FLAGS.critical.map((i) => block(i, "red"))}
      <div className="eyebrow" style={{ color: "#8A5A00", margin: "14px 0 8px" }}>К врачу в течение суток</div>
      {RED_FLAGS.urgent.map((i) => block(i, "amber"))}
      <div className="row" style={{ marginTop: 14 }}>
        <a href="tel:112" className="btn btn-danger" style={{ flex: 1 }}>
          <PhoneCall size={15} /> Вызвать 112
        </a>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
          Понятно
        </button>
      </div>
    </Modal>
  );
}
