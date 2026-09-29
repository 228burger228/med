import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, PhoneCall, ShieldAlert, Volume2, VolumeX, Subtitles } from "lucide-react";
import { C, FONT, DISPLAY, MONO } from "../../theme/tokens";
import { RED_FLAGS } from "../../data/mockData";

/**
 * Модальное окно на базе нативного <dialog closedby="any"> с fallback'ом light-dismiss
 */
export function AccessibleModal({ open, onClose, title, sheet = false, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (open) onClose?.();
    };

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        dialog.close();
      }
    };

    dialog.addEventListener("close", handleClose);
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-label={title || "Диалоговое окно"}
      className={sheet ? "ainala-sheet" : "ainala-dialog"}
    >
      <div
        style={{
          background: C.paper,
          borderRadius: sheet ? "20px 20px 0 0" : 20,
          padding: sheet ? "14px 18px 26px" : 20,
          border: `1px solid ${C.line}`,
          maxHeight: "86vh",
          overflowY: "auto",
          boxShadow: "0 18px 42px rgba(22, 36, 30, 0.22)",
        }}
      >
        {children}
      </div>
    </dialog>
  );
}

/**
 * ИСПРАВЛЕННЫЙ RecoveryRing:
 * Больше нет наложения процентов и секунд в режиме тренировки!
 * Поддерживает кастомные centerValue / centerLabel.
 */
export function RecoveryRing({
  percent,
  size = 164,
  centerValue,
  centerLabel = "СЕГОДНЯ",
  strokeColor = C.amber,
  isMono = false,
}) {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (safePercent / 100) * c;
  const displayMain = centerValue !== undefined ? centerValue : `${safePercent}%`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
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
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontSize={isMono ? "34" : "28"}
        fontFamily={isMono ? MONO : DISPLAY}
        fill={C.ink}
        fontWeight="600"
      >
        {displayMain}
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        fontSize="10.5"
        fontFamily={FONT}
        fill={C.inkSoft}
        fontWeight="600"
        letterSpacing="0.06em"
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/**
 * ИСПРАВЛЕННЫЙ Pill:
 * Добавлен inline-flex и защита от некрасивого разрыва фона на узких экранах (как было на скриншоте)
 */
export function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: C.line, fg: C.inkSoft },
    amber: { bg: C.amberSoft, fg: C.amberDark },
    pine: { bg: C.pineLight, fg: C.pine },
    rose: { bg: C.roseSoft, fg: C.rose },
    warning: { bg: C.warningSoft, fg: C.warning },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        padding: "4px 10px",
        borderRadius: 999,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function ScreenTitle({ children, right, subtitle }) {
  return (
    <div style={{ margin: "2px 0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 24, color: C.ink, fontWeight: 600, margin: 0 }}>
          {children}
        </h1>
        {right}
      </div>
      {subtitle && (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

export function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function InputRow({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: "9px 12px",
          fontFamily: FONT,
          fontSize: 13.5,
          color: C.ink,
          outline: "none",
          boxSizing: "border-box",
          background: "#fff",
        }}
      />
    </div>
  );
}

/**
 * Интерактивный биомеханический плеер упражнения с переключателем субтитров (CC) и голосовой озвучкой (Web Speech API)
 */
export function BiomechanicalPlayer({
  exercise,
  elapsedSec = 0,
  phase = "work",
  ccEnabled,
  onToggleCc,
  voiceEnabled,
  onToggleVoice,
}) {
  const activeSubtitle =
    phase === "rest"
      ? "Пауза и восстановление дыхания: расслабьте рабочую группу мышц, сделайте глубокий вдох."
      : exercise.subtitles?.find((s) => elapsedSec >= s.from && elapsedSec <= s.to)?.text ||
        exercise.instructions;

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(145deg, #16241E 0%, #1F4A3C 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "18px 16px 14px",
        color: "#fff",
      }}
    >
      {/* Верхняя панель плеера: целевая амплитуда + кнопки CC и Озвучки */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              background: "rgba(255,255,255,0.14)",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {exercise.part} · {exercise.targetRom || "Контроль амплитуды"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={onToggleCc}
            title="Переключить субтитры (CC)"
            style={{
              background: ccEnabled ? C.amber : "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Subtitles size={14} /> CC {ccEnabled ? "ВКЛ" : "ВЫКЛ"}
          </button>
          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              title="Голосовой тренер"
              style={{
                background: voiceEnabled ? C.pineSoft : "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "5px 9px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Анимированная векторная схема биомеханики сустава */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 128 }}>
        <svg width="240" height="120" viewBox="0 0 240 120">
          {/* Сетка координат */}
          <line x1="20" y1="105" x2="220" y2="105" stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
          <circle cx="120" cy="72" r="38" fill="none" stroke="rgba(111,163,199,0.28)" strokeDasharray="3 3" />
          {/* Проксимальный сегмент */}
          <line x1="65" y1="72" x2="120" y2="72" stroke="#DCEAF3" strokeWidth="10" strokeLinecap="round" />
          {/* Дистальный подвижный сегмент */}
          <g className={phase === "work" ? "exercise-anim-limb" : ""} style={{ transformOrigin: "120px 72px" }}>
            <line x1="120" y1="72" x2="182" y2="96" stroke="#6FA3C7" strokeWidth="9" strokeLinecap="round" />
            <circle cx="184" cy="97" r="6" fill="#DCEAF3" />
          </g>
          {/* Ось сустава */}
          <circle cx="120" cy="72" r="8" fill="#C1543F" stroke="#fff" strokeWidth="2.5" />
          <text x="120" y="24" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11" fontFamily={FONT}>
            {phase === "work" ? "Плавное движение без рывков (2 сек вверх / 2 сек вниз)" : "Фаза отдыха — восстановите дыхание"}
          </text>
        </svg>
      </div>

      {/* Субтитры (CC) в реальном времени */}
      {ccEnabled && (
        <div
          style={{
            marginTop: 6,
            background: "rgba(0, 0, 0, 0.68)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12.5,
            lineHeight: 1.45,
            textAlign: "center",
            color: "#F4F6F4",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <span style={{ color: C.amber, fontWeight: 700, marginRight: 6 }}>[CC]</span>
          {activeSubtitle}
        </div>
      )}
    </div>
  );
}

/**
 * Экстренная памятка «Красные флаги: когда срочно обратиться к врачу»
 */
export function RedFlagsModal({ open, onClose }) {
  return (
    <AccessibleModal open={open} onClose={onClose} title="Экстренная памятка: Красные флаги">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={22} color={C.rose} />
          <h2 style={{ fontFamily: DISPLAY, fontSize: 19, color: C.ink, margin: 0, fontWeight: 600 }}>
            Когда срочно нужен врач
          </h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <X size={20} color={C.inkSoft} />
        </button>
      </div>

      <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: "0 0 14px" }}>
        Если во время реабилитации вы заметили хотя бы один из перечисленных ниже симптомов, <strong>немедленно прекратите упражнения</strong>.
      </p>

      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.rose, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        🚨 Неотложная помощь (103 / 112)
      </div>
      {RED_FLAGS.critical.map((item) => (
        <div
          key={item.id}
          style={{
            background: C.roseSoft,
            border: "1px solid #E7B8AE",
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.rose }}>{item.title}</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>
            {item.desc}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.rose, marginTop: 6 }}>
            → {item.action}
          </div>
        </div>
      ))}

      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.amberDark, margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        ⚠️ Срочная связь с лечащим врачом (за 12–24 ч)
      </div>
      {RED_FLAGS.urgent.map((item) => (
        <div
          key={item.id}
          style={{
            background: C.amberSoft,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.amberDark }}>{item.title}</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>
            {item.desc}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.amberDark, marginTop: 6 }}>
            → {item.action}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <a
          href="tel:112"
          style={{
            flex: 1,
            background: C.rose,
            color: "#fff",
            textDecoration: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <PhoneCall size={15} /> Вызов 112 / 103
        </a>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            background: C.bg,
            color: C.ink,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: "12px 0",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          Понятно
        </button>
      </div>
    </AccessibleModal>
  );
}
