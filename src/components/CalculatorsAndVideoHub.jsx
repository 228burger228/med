import React, { useState, useRef } from "react";
import {
  Calculator, Clock, Utensils, Activity, Video, X, Check, AlertTriangle,
  Camera, Sparkles, ExternalLink, Subtitles, ShieldCheck,
} from "lucide-react";
import { C, FONT, DISPLAY, MONO } from "../theme/tokens";
import { BODY_PARTS } from "../data/mockData";

// ─── 1. ВЕРХНЯЯ ПАНЕЛЬ ЭКСПРЕСС-СКРИНИНГА (в стиле heli-portfolio) ─────────────

export function ExpressDemoBar({
  injuryProfile,
  onQuickSwitchPart,
  isPremium,
  onTogglePremium,
  onOpenCalculators,
  onResetOnboarding,
}) {
  const currentPart = injuryProfile?.part || "Колено";

  return (
    <div
      style={{
        background: "rgba(22, 36, 30, 0.94)",
        backdropFilter: "blur(10px)",
        color: "#fff",
        padding: "8px 12px",
        fontSize: 11.5,
        fontFamily: FONT,
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 11 }}>
          <span className="pulse-dot" />
          <span>ДЕМО-СТЕНД</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={onOpenCalculators}
            style={{
              background: C.amber,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 10.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Calculator size={11} /> Калькуляторы
          </button>
          <button
            onClick={onTogglePremium}
            style={{
              background: isPremium ? "#20ba78" : "rgba(255,255,255,0.16)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 10.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isPremium ? "✨ PRO ВКЛ" : "PRO ВЫКЛ"}
          </button>
          <button
            onClick={onResetOnboarding}
            title="Пройти анкету заново"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "#DCEAF3",
              border: "none",
              borderRadius: 6,
              padding: "3px 7px",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Анкета ↺
          </button>
        </div>
      </div>

      {/* Быстрое переключение сустава в 1 клик */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
        {BODY_PARTS.map((part) => {
          const active = currentPart === part;
          return (
            <button
              key={part}
              onClick={() => onQuickSwitchPart(part)}
              style={{
                background: active ? C.pineSoft : "rgba(255,255,255,0.1)",
                color: active ? "#fff" : "rgba(255,255,255,0.75)",
                border: active ? "1px solid #6FA3C7" : "1px solid transparent",
                borderRadius: 999,
                padding: "3px 9px",
                fontSize: 10.5,
                fontWeight: active ? 700 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {part}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. ИНТЕРАКТИВНЫЕ МЕДИЦИНСКИЕ КАЛЬКУЛЯТОРЫ (в стиле ai-pricing-calculator) ─

const BASE_TIMELINES = {
  "Колено": { household: [2, 4], work: [4, 7], sport: [12, 20] },
  "Плечо": { household: [3, 5], work: [5, 8], sport: [14, 22] },
  "Спина": { household: [2, 3], work: [3, 6], sport: [10, 16] },
  "Перелом руки": { household: [4, 6], work: [6, 9], sport: [12, 18] },
  "Голеностоп": { household: [2, 3], work: [3, 5], sport: [8, 14] },
};

export function CalculatorsScreen({ injuryProfile }) {
  const [activeCalc, setActiveCalc] = useState("timeline"); // "timeline" | "nutrition" | "load"

  // State для калькулятора сроков
  const [part, setPart] = useState(injuryProfile?.part || "Колено");
  const [age, setAge] = useState(Number(injuryProfile?.manualProfile?.age) || 32);
  const [weeksPassed, setWeeksPassed] = useState(2);

  // State для калькулятора нутриентов
  const [weight, setWeight] = useState(Number(injuryProfile?.manualProfile?.weight) || 70);
  const [rehabStage, setRehabStage] = useState("early"); // "early" | "mid" | "late"

  // State для калькулятора нагрузки («Светофор боли»)
  const [painDuring, setPainDuring] = useState(3);
  const [morningReaction, setMorningReaction] = useState("none"); // "none" | "mild" | "swelling"

  // Математический расчёт сроков (диапазон вместо ложной точности)
  const ageFactor = age > 55 ? 1.28 : age > 40 ? 1.12 : 1.0;
  const base = BASE_TIMELINES[part] || BASE_TIMELINES["Колено"];
  const calcRange = (arr) => [
    Math.max(1, Math.round(arr[0] * ageFactor)),
    Math.max(2, Math.round(arr[1] * ageFactor)),
  ];
  const householdRange = calcRange(base.household);
  const workRange = calcRange(base.work);
  const sportRange = calcRange(base.sport);
  const totalProgressPct = Math.min(100, Math.round((weeksPassed / sportRange[1]) * 100));

  // Математический расчёт нутриентов для синтеза коллагена и мышц
  const proteinRatio = rehabStage === "early" ? 1.6 : rehabStage === "mid" ? 1.8 : 1.5;
  const proteinGrams = Math.round(weight * proteinRatio);
  const waterLiters = ((weight * 32) / 1000).toFixed(1);
  const collagenGrams = rehabStage === "early" ? 15 : 10;
  const vitaminCMg = 500;

  // Математический расчёт безопасной прогрессии нагрузки
  let loadVerdict = {
    tone: "pine",
    badge: "🟢 Зелёный коридор (+10–15% к объёму)",
    title: "Ткани адаптируются отлично",
    desc: "Вы можете добавить 1–2 повторения в каждом подходе или увеличить время удержания на 3 секунды.",
  };
  if (painDuring >= 6 || morningReaction === "swelling") {
    loadVerdict = {
      tone: "rose",
      badge: "🔴 Красный коридор (Снижение нагрузки на 50%)",
      title: "Признак перегрузки сустава",
      desc: "Сегодня замените силовые упражнения на мягкий лимфодренаж, возвышенное положение конечности и контроль отёка. При сохранении боли свяжитесь с врачом.",
    };
  } else if (painDuring >= 4 || morningReaction === "mild") {
    loadVerdict = {
      tone: "amber",
      badge: "🟡 Жёлтый коридор (Фиксация нагрузки)",
      title: "Удерживайте текущий рабочий объём",
      desc: "Не повышайте вес и количество повторений сегодня. Выполняйте движения в комфортной амплитуде без рывков.",
    };
  }

  return (
    <div style={{ padding: "20px 18px 28px" }}>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 24, color: C.ink, fontWeight: 600, margin: "2px 0 4px" }}>
        Калькуляторы
      </h1>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, marginBottom: 14 }}>
        Математический расчёт сроков, нутриентов и безопасной нагрузки (без галлюцинаций ИИ)
      </div>

      {/* Переключатель 3 калькуляторов */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "timeline", label: "Сроки и фазы", icon: Clock },
          { id: "nutrition", label: "Белок и вода", icon: Utensils },
          { id: "load", label: "Нагрузка", icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeCalc === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveCalc(t.id)}
              style={{
                flex: 1,
                background: active ? C.pine : C.paper,
                color: active ? "#fff" : C.inkSoft,
                border: `1px solid ${active ? C.pine : C.line}`,
                borderRadius: 11,
                padding: "9px 6px",
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* КАЛЬКУЛЯТОР 1: СРОКИ И ФАЗЫ */}
      {activeCalc === "timeline" && (
        <div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>Область реабилитации</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {BODY_PARTS.map((bp) => (
                <button
                  key={bp}
                  onClick={() => setPart(bp)}
                  style={{
                    background: part === bp ? C.pineLight : C.bg,
                    color: part === bp ? C.pine : C.inkSoft,
                    border: `1px solid ${part === bp ? C.pine : C.line}`,
                    borderRadius: 999,
                    padding: "5px 11px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {bp}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12.5, color: C.ink, marginBottom: 4 }}>
              <span>Возраст пациента</span>
              <strong style={{ fontFamily: MONO }}>{age} лет</strong>
            </div>
            <input
              type="range"
              min="16"
              max="80"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.pine, marginBottom: 14 }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12.5, color: C.ink, marginBottom: 4 }}>
              <span>Прошло после травмы / операции</span>
              <strong style={{ fontFamily: MONO }}>{weeksPassed} нед.</strong>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={weeksPassed}
              onChange={(e) => setWeeksPassed(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.pine }}
            />
          </div>

          {/* Карточки прогнозного диапазона */}
          <div style={{ background: C.pineLight, border: `1px solid ${C.pineBorder}`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.pine }}>
                ПРОГНОЗНЫЙ КОРИДОР ({part.toUpperCase()})
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.pine }}>
                Прогресс ~{totalProgressPct}%
              </span>
            </div>
            <div style={{ height: 8, background: "rgba(31,74,60,0.15)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: `${totalProgressPct}%`, height: "100%", background: C.pine, borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>

            {[
              { label: "🏠 Бытовая независимость (без боли в покое)", range: householdRange },
              { label: "💼 Возврат к работе и долгим прогулкам", range: workRange },
              { label: "🏃‍♂️ Полная нагрузка и возврат в спорт", range: sportRange },
            ].map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderTop: idx > 0 ? "1px solid rgba(31,74,60,0.14)" : "none",
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink }}>{row.label}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: weeksPassed >= row.range[0] ? C.pine : C.amberDark,
                    background: "#fff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.range[0]}–{row.range[1]} нед.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* КАЛЬКУЛЯТОР 2: НУТРИЕНТЫ И КОЛЛАГЕН */}
      {activeCalc === "nutrition" && (
        <div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12.5, color: C.ink, marginBottom: 4 }}>
              <span>Масса тела</span>
              <strong style={{ fontFamily: MONO }}>{weight} кг</strong>
            </div>
            <input
              type="range"
              min="40"
              max="130"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.pine, marginBottom: 14 }}
            />

            <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>Фаза заживления тканей</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { id: "early", label: "Ранняя (противоотёчная)" },
                { id: "mid", label: "Средняя (активный рост мышц)" },
                { id: "late", label: "Поздняя (укрепление)" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setRehabStage(st.id)}
                  style={{
                    flex: 1,
                    background: rehabStage === st.id ? C.pine : C.bg,
                    color: rehabStage === st.id ? "#fff" : C.inkSoft,
                    border: `1px solid ${rehabStage === st.id ? C.pine : C.line}`,
                    borderRadius: 10,
                    padding: "8px 6px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ background: C.pineLight, border: `1px solid ${C.pineBorder}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.pine }}>{proteinGrams} г/сут</div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 4 }}>Суточная норма белка</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                По ~{Math.round(proteinGrams / 4)} г в 4 приёма пищи
              </div>
            </div>
            <div style={{ background: C.amberSoft, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.amberDark }}>{waterLiters} л/сут</div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 4 }}>Чистая вода</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                Для синовиальной жидкости и снятия отёка
              </div>
            </div>
          </div>

          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>
              💊 Протокол перед ЛФК (за 45 минут до тренировки)
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
              <strong>{collagenGrams} г гидролизата коллагена (или желатина) + {vitaminCMg} мг Витамина C</strong>. По данным клинических исследований (Shaw et al.), этот приём за 45 минут до механической нагрузки удваивает синтез коллагена в восстанавливающихся связках и сухожилиях.
            </div>
          </div>
        </div>
      )}

      {/* КАЛЬКУЛЯТОР 3: НАГРУЗКА ПО СВЕТОФОРУ БОЛИ */}
      {activeCalc === "load" && (
        <div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 12.5, color: C.ink, marginBottom: 4 }}>
              <span>Боль во время вчерашней тренировки</span>
              <strong style={{ fontFamily: MONO }}>{painDuring} / 10</strong>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={painDuring}
              onChange={(e) => setPainDuring(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.pine, marginBottom: 14 }}
            />

            <div style={{ fontFamily: FONT, fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>
              Реакция сустава сегодня утром
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "none", label: "Сустав спокойный, отёка и утренней скованности нет" },
                { id: "mild", label: "Лёгкая скованность первые 15–20 минут, проходит после разминки" },
                { id: "swelling", label: "Отёк увеличился, сустав горячий или боль выше обычной" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMorningReaction(opt.id)}
                  style={{
                    textAlign: "left",
                    background: morningReaction === opt.id ? C.pineLight : C.bg,
                    color: C.ink,
                    border: `1px solid ${morningReaction === opt.id ? C.pine : C.line}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 12.5,
                    fontWeight: morningReaction === opt.id ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background:
                loadVerdict.tone === "rose"
                  ? C.roseSoft
                  : loadVerdict.tone === "amber"
                  ? C.amberSoft
                  : C.pineLight,
              border: `1px solid ${
                loadVerdict.tone === "rose" ? "#E7B8AE" : loadVerdict.tone === "amber" ? C.line : C.pineBorder
              }`,
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11.5,
                fontWeight: 700,
                color:
                  loadVerdict.tone === "rose"
                    ? C.rose
                    : loadVerdict.tone === "amber"
                    ? C.amberDark
                    : C.pine,
                marginBottom: 4,
              }}
            >
              {loadVerdict.badge}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
              {loadVerdict.title}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{loadVerdict.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3. ВСТРОЕННАЯ ВИДЕО-БАЗА РАЗБОРА УПРАЖНЕНИЯ (VIDEO HUB MODAL) ────────────

export function VideoHubModal({ exercise, onClose, onStartWorkout }) {
  const [ccOn, setCcOn] = useState(true);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  if (!exercise) return null;

  const steps = exercise.subtitles || [
    { from: 0, to: 5, text: exercise.instructions },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22, 36, 30, 0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: C.paper,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        {/* Шапка */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: C.ink }}>{exercise.name}</div>
            <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.inkSoft }}>
              Видео-база техники · {exercise.part} ({exercise.phase} фаза)
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={19} color={C.inkSoft} />
          </button>
        </div>

        {/* Интерактивный биомеханический экран с таймкодами и субтитрами CC */}
        <div style={{ background: "linear-gradient(145deg, #16241E 0%, #1F4A3C 100%)", padding: "16px 16px 14px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", padding: "3px 9px", borderRadius: 999 }}>
              Целевая амплитуда: {exercise.targetRom || "Контролируемая"}
            </span>
            <button
              onClick={() => setCcOn((v) => !v)}
              style={{
                background: ccOn ? C.amber : "rgba(255,255,255,0.16)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "4px 8px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              CC {ccOn ? "ВКЛ" : "ВЫКЛ"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", height: 116 }}>
            <svg width="230" height="110" viewBox="0 0 240 116">
              <line x1="20" y1="100" x2="220" y2="100" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <circle cx="120" cy="68" r="36" fill="none" stroke="rgba(111,163,199,0.3)" strokeDasharray="3 3" />
              <line x1="65" y1="68" x2="120" y2="68" stroke="#DCEAF3" strokeWidth="10" strokeLinecap="round" />
              <g className="exercise-anim-limb">
                <line x1="120" y1="68" x2="182" y2="92" stroke="#6FA3C7" strokeWidth="9" strokeLinecap="round" />
                <circle cx="184" cy="93" r="6" fill="#DCEAF3" />
              </g>
              <circle cx="120" cy="68" r="8" fill="#C1543F" stroke="#fff" strokeWidth="2.5" />
            </svg>
          </div>

          {ccOn && (
            <div style={{ background: "rgba(0,0,0,0.65)", borderRadius: 10, padding: "8px 11px", fontSize: 12, lineHeight: 1.45, textAlign: "center", marginTop: 4 }}>
              <span style={{ color: C.amber, fontWeight: 700, marginRight: 5 }}>[CC]</span>
              {steps[activeStepIdx]?.text || exercise.instructions}
            </div>
          )}
        </div>

        {/* Таймкоды фаз движения */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 8 }}>
            ПОШАГОВЫЙ РАЗБОР ТЕХНИКИ (НАЖМИТЕ НА ФАЗУ):
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStepIdx(idx)}
                style={{
                  textAlign: "left",
                  background: activeStepIdx === idx ? C.pineLight : C.bg,
                  border: `1px solid ${activeStepIdx === idx ? C.pine : C.line}`,
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontFamily: FONT,
                  fontSize: 12,
                  color: C.ink,
                  cursor: "pointer",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.pine, whiteSpace: "nowrap" }}>
                  00:{String(s.from).padStart(2, "0")}
                </span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                onClose();
                onStartWorkout(exercise.id);
              }}
              style={{
                flex: 1.3,
                background: C.pine,
                color: "#fff",
                border: "none",
                borderRadius: 11,
                padding: "11px 0",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ▶ Запустить с таймером
            </button>
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                background: C.bg,
                color: C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: 11,
                padding: "11px 0",
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 12.5,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              YouTube <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. ФОТО «ДО / ПОСЛЕ» (PHOTO TRACKER) ────────────────────────────────────

export function PhotoTrackerWidget() {
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [collages, setCollages] = useState([]);
  const beforeRef = useRef(null);
  const afterRef = useRef(null);

  const handleFile = (setter) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const saveCollage = () => {
    if (!before || !after) return;
    setCollages((prev) => [
      { id: Date.now(), before, after, date: new Date().toLocaleDateString("ru-RU") },
      ...prev,
    ]);
    setBefore(null);
    setAfter(null);
  };

  const Slot = ({ label, value, onPick }) => (
    <div
      onClick={onPick}
      style={{
        flex: 1,
        height: 96,
        borderRadius: 10,
        border: `1.5px dashed ${C.line}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: C.inkSoft,
        gap: 4,
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        background: C.bg,
      }}
    >
      {value ? (
        <>
          <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <span
            style={{
              position: "absolute",
              bottom: 4,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
            }}
          >
            {label}
          </span>
        </>
      ) : (
        <>
          <Camera size={18} color={C.pine} />
          <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600 }}>{label}</span>
        </>
      )}
    </div>
  );

  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
      <input ref={beforeRef} type="file" accept="image/*" onChange={handleFile(setBefore)} style={{ display: "none" }} />
      <input ref={afterRef} type="file" accept="image/*" onChange={handleFile(setAfter)} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 10 }}>
        <Slot label="Фото ДО" value={before} onPick={() => beforeRef.current?.click()} />
        <Slot label="Фото ПОСЛЕ" value={after} onPick={() => afterRef.current?.click()} />
      </div>
      <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, marginTop: 8 }}>
        🔒 Фотографии хранятся только локально на вашем устройстве и не отправляются в облако без вашего согласия.
      </div>
      <button
        onClick={saveCollage}
        disabled={!before || !after}
        style={{
          marginTop: 10,
          width: "100%",
          background: !before || !after ? C.line : C.pine,
          color: !before || !after ? C.inkSoft : "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 0",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 13,
          cursor: !before || !after ? "default" : "pointer",
        }}
      >
        Сохранить сравнение ({collages.length})
      </button>
      {collages.map((c) => (
        <div key={c.id} style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
          <div style={{ display: "flex", gap: 6, borderRadius: 10, overflow: "hidden" }}>
            <img src={c.before} alt="До" style={{ flex: 1, height: 100, objectFit: "cover", borderRadius: 8 }} />
            <img src={c.after} alt="После" style={{ flex: 1, height: 100, objectFit: "cover", borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: C.inkSoft, textAlign: "center", marginTop: 4 }}>
            Сравнение от {c.date}
          </div>
        </div>
      ))}
    </div>
  );
}
