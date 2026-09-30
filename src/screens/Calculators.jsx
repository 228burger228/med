import React, { useState } from "react";
import { Clock, Utensils, Activity, Info } from "lucide-react";
import { C } from "../theme/tokens";
import { BODY_PARTS } from "../data/mockData";
import { weightKg } from "../utils/stats";
import { Card, ScreenTitle, Segmented } from "../components/ui/SharedUI";

// Ориентировочные диапазоны (недели) для неосложнённого течения
const BASE_TIMELINES = {
  "Колено": { household: [2, 4], work: [4, 7], sport: [12, 20] },
  "Плечо": { household: [3, 5], work: [5, 8], sport: [14, 22] },
  "Спина": { household: [2, 3], work: [3, 6], sport: [10, 16] },
  "Перелом руки": { household: [4, 6], work: [6, 9], sport: [12, 18] },
  "Голеностоп": { household: [2, 3], work: [3, 5], sport: [8, 14] },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function Slider({ label, value, unit, min, max, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="between" style={{ fontSize: 13, marginBottom: 6 }}>
        <span>{label}</span>
        <strong className="mono">{value} {unit}</strong>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  );
}

function Disclaimer({ children }) {
  return (
    <div className="small row" style={{ gap: 6, alignItems: "flex-start", marginTop: 10 }}>
      <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{children}</span>
    </div>
  );
}

export function CalculatorsScreen({ profile }) {
  const [active, setActive] = useState("timeline");
  const [part, setPart] = useState(profile?.part || "Колено");
  const [age, setAge] = useState(clamp(Number(profile?.age) || 35, 16, 80));
  const [weeksPassed, setWeeksPassed] = useState(2);
  const [weight, setWeight] = useState(clamp(weightKg(profile) || 70, 40, 150));
  const [stage, setStage] = useState("early");
  const [painDuring, setPainDuring] = useState(3);
  const [morning, setMorning] = useState("none");

  // Сроки
  const ageFactor = age > 55 ? 1.28 : age > 40 ? 1.12 : 1.0;
  const base = BASE_TIMELINES[part];
  const range = (arr) => [Math.max(1, Math.round(arr[0] * ageFactor)), Math.max(2, Math.round(arr[1] * ageFactor))];
  const rows = [
    { label: "🏠 Бытовая самостоятельность", range: range(base.household) },
    { label: "💼 Работа и долгие прогулки", range: range(base.work) },
    { label: "🏃 Полная нагрузка и спорт", range: range(base.sport) },
  ];
  const progressPct = Math.min(100, Math.round((weeksPassed / rows[2].range[1]) * 100));

  // Питание
  const proteinRatio = stage === "early" ? 1.6 : stage === "mid" ? 1.8 : 1.5;
  const proteinGrams = Math.round(weight * proteinRatio);
  const waterLiters = ((weight * 30) / 1000).toFixed(1);

  // Нагрузка
  let verdict = { tone: "green", badge: "🟢 Зелёная зона · можно +10%", title: "Ткани хорошо переносят нагрузку", desc: "Можно добавить 1–2 повторения в подходе или увеличить удержание на 2–3 секунды." };
  if (painDuring >= 6 || morning === "swelling") {
    verdict = { tone: "red", badge: "🔴 Красная зона · нагрузку вдвое меньше", title: "Признаки перегрузки", desc: "Сегодня — только мягкие движения, возвышенное положение и контроль отёка. Если боль или отёк сохраняются — свяжитесь с врачом." };
  } else if (painDuring >= 4 || morning === "mild") {
    verdict = { tone: "amber", badge: "🟡 Жёлтая зона · без увеличения", title: "Удерживайте текущий объём", desc: "Не повышайте вес и число повторений. Работайте в комфортной амплитуде без рывков." };
  }
  const vt = { green: [C.greenSoft, "#1E7A50"], amber: [C.amberSoft, "#8A5A00"], red: [C.redSoft, C.red] }[verdict.tone];

  return (
    <div className="screen">
      <ScreenTitle subtitle="Формулы на основе общих рекомендаций — ориентир, а не назначение">Калькуляторы</ScreenTitle>
      <div style={{ marginBottom: 14 }}>
        <Segmented
          value={active}
          onChange={setActive}
          options={[
            { value: "timeline", label: "Сроки", icon: Clock },
            { value: "nutrition", label: "Питание", icon: Utensils },
            { value: "load", label: "Нагрузка", icon: Activity },
          ]}
        />
      </div>

      {active === "timeline" && (
        <>
          <Card>
            <div className="field-label">Область</div>
            <div className="chips wrap" style={{ marginBottom: 14 }}>
              {BODY_PARTS.map((bp) => (
                <button key={bp} className={`chip ${part === bp ? "active" : ""}`} onClick={() => setPart(bp)}>{bp}</button>
              ))}
            </div>
            <Slider label="Возраст" value={age} unit="лет" min={16} max={80} onChange={setAge} />
            <Slider label="Прошло после травмы / операции" value={weeksPassed} unit="нед." min={0} max={26} onChange={setWeeksPassed} />
          </Card>
          <Card tinted>
            <div className="between" style={{ marginBottom: 8 }}>
              <span className="eyebrow" style={{ color: C.teal }}>Ориентир · {part}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>~{progressPct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(31,107,92,.15)", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: C.teal, borderRadius: 999, transition: "width .3s" }} />
            </div>
            {rows.map((row, i) => (
              <div key={row.label} className="between" style={{ padding: "9px 0", borderTop: i ? "1px solid rgba(31,107,92,.14)" : "none" }}>
                <span style={{ fontSize: 13 }}>{row.label}</span>
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, background: "#fff", padding: "3px 8px", borderRadius: 6, color: weeksPassed >= row.range[0] ? C.teal : C.inkSoft, whiteSpace: "nowrap" }}>
                  {row.range[0]}–{row.range[1]} нед.
                </span>
              </div>
            ))}
          </Card>
          <Disclaimer>Типичные диапазоны для неосложнённого течения. Реальные сроки зависят от вида операции, сопутствующих заболеваний и решений вашего врача.</Disclaimer>
        </>
      )}

      {active === "nutrition" && (
        <>
          <Card>
            <Slider label="Масса тела" value={weight} unit="кг" min={40} max={150} onChange={setWeight} />
            <div className="field-label">Фаза заживления</div>
            <Segmented
              value={stage}
              onChange={setStage}
              options={[
                { value: "early", label: "Ранняя" },
                { value: "mid", label: "Средняя" },
                { value: "late", label: "Поздняя" },
              ]}
            />
          </Card>
          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div className="stat" style={{ background: C.tealSoft, borderColor: C.tealBorder }}>
              <div className="stat-value mono" style={{ fontSize: 22, color: C.teal }}>{proteinGrams} г</div>
              <div className="stat-label"><strong>Белок в сутки</strong><br />≈{Math.round(proteinGrams / 4)} г × 4 приёма пищи</div>
            </div>
            <div className="stat" style={{ background: C.skySoft, borderColor: "#c6dbe9" }}>
              <div className="stat-value mono" style={{ fontSize: 22, color: C.sky }}>{waterLiters} л</div>
              <div className="stat-label"><strong>Жидкость в сутки</strong><br />≈30 мл на кг веса</div>
            </div>
          </div>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>🍊 Витамин C и коллаген</div>
            <div className="muted">
              Витамин C необходим для синтеза коллагена — ешьте овощи и фрукты каждый день. В небольшом исследовании (Shaw et al., 2017) приём ~15 г желатина с витамином C за час до нагрузки повышал маркеры синтеза коллагена; надёжных доказательств ускорения заживления пока недостаточно.
            </div>
          </Card>
          <Disclaimer>При болезнях почек, сердца, диабете или ограничении жидкости нормы белка и воды определяет врач. Добавки — только после консультации.</Disclaimer>
        </>
      )}

      {active === "load" && (
        <>
          <Card>
            <Slider label="Боль во время вчерашней тренировки" value={painDuring} unit="/ 10" min={0} max={10} onChange={setPainDuring} />
            <div className="field-label">Сустав сегодня утром</div>
            {[
              { id: "none", label: "Спокойный, без отёка и скованности" },
              { id: "mild", label: "Лёгкая скованность, проходит за 15–20 минут" },
              { id: "swelling", label: "Отёк больше, сустав горячий или боль выше обычной" },
            ].map((o) => (
              <button key={o.id} className={`option ${morning === o.id ? "active" : ""}`} style={{ fontSize: 13 }} onClick={() => setMorning(o.id)}>
                {o.label}
              </button>
            ))}
          </Card>
          <div className="card" style={{ background: vt[0], borderColor: "transparent", boxShadow: "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: vt[1], marginBottom: 4 }}>{verdict.badge}</div>
            <div className="h1" style={{ fontSize: 18, marginBottom: 6 }}>{verdict.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{verdict.desc}</div>
          </div>
          <Disclaimer>Основано на модели «светофора боли». Если врач дал другие ограничения — следуйте им.</Disclaimer>
        </>
      )}
    </div>
  );
}
