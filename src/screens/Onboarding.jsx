import React, { useState } from "react";
import { HeartPulse, Lock, ChevronLeft, Sparkles } from "lucide-react";
import { C } from "../theme/tokens";
import { BODY_PARTS, PHASES, PHASE_INFO, ACTIVITY_LEVELS } from "../data/mockData";
import { sanitizeText } from "../utils/security";
import { dateKey } from "../utils/stats";
import { analyzeInjuryDescription } from "../services/aiService";
import { InputRow, Field, BodyMap, PainSlider, PainAdvice, RedFlagAlert, Segmented } from "../components/ui/SharedUI";

const STEPS = ["Знакомство", "Травма", "Этап", "О вас", "Самочувствие"];

export function OnboardingScreen({ onComplete, onShowSos, onCancel, initial }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name || "");
  const [consent, setConsent] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description || "");
  const [part, setPart] = useState(initial?.part || null);
  const [explanation, setExplanation] = useState(null);
  const [redFlag, setRedFlag] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notRecognized, setNotRecognized] = useState(false);
  const [phase, setPhase] = useState(initial?.phase || null);
  const [injuryDate, setInjuryDate] = useState(initial?.injuryDate || "");
  const [about, setAbout] = useState({
    age: initial?.age || "",
    weight: initial?.weight || "",
    height: initial?.height || "",
    allergies: initial?.allergies || "",
    units: initial?.units || "metric",
  });
  const [pain, setPain] = useState(initial?.pain ?? 3);
  const [activityLevel, setActivityLevel] = useState(initial?.activityLevel || "moderate");

  const analyze = async () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    setNotRecognized(false);
    setExplanation(null);
    const result = await analyzeInjuryDescription(description);
    setAnalyzing(false);
    setRedFlag(result.redFlag || null);
    if (result.part) {
      setPart(result.part);
      setExplanation(result.explanation || null);
    } else {
      setNotRecognized(true);
    }
  };

  const finish = () => {
    const today = dateKey();
    onComplete({
      name: sanitizeText(name, 40) || "Пациент",
      part,
      phase,
      pain,
      activityLevel,
      description: sanitizeText(description, 600),
      injuryDate: injuryDate && injuryDate <= today ? injuryDate : "",
      startDate: initial?.startDate || today,
      age: sanitizeText(about.age, 3),
      weight: sanitizeText(about.weight, 6),
      height: sanitizeText(about.height, 6),
      allergies: sanitizeText(about.allergies, 200),
      units: about.units,
    });
  };

  const canNext = [consent && name.trim(), !!part, !!phase, true, true][step];

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 22 }}>
        <div className="between" style={{ marginBottom: 18 }}>
          {step > 0 ? (
            <button className="btn btn-ghost sm" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} /> Назад
            </button>
          ) : onCancel ? (
            <button className="btn btn-ghost sm" onClick={onCancel}>
              <ChevronLeft size={16} /> Отмена
            </button>
          ) : (
            <div className="brand">
              <span className="brand-mark"><HeartPulse size={17} /></span> Ainala
            </div>
          )}
          <span className="small">Шаг {step + 1} из {STEPS.length}</span>
        </div>
        <div className="row" style={{ gap: 5, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? C.teal : C.line, transition: "background .3s" }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={{ textAlign: "center", margin: "6px 0 22px" }}>
              <div style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, borderRadius: 24, background: C.tealSoft, marginBottom: 14 }}>
                <HeartPulse size={38} color={C.teal} />
              </div>
              <h1 className="h1" style={{ fontSize: 27 }}>Безопасное восстановление — шаг за шагом</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                План упражнений под вашу травму и этап, дневник боли и отчёт для врача.
              </p>
            </div>
            <InputRow label="Как к вам обращаться?" value={name} onChange={setName} placeholder="Имя" autoComplete="given-name" maxLength={40} />
            <div className="alert info">
              <Lock size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Данные остаются на этом устройстве</strong>
                Аккаунт не нужен: всё хранится в браузере. Экспорт и удаление — в профиле.
              </div>
            </div>
            <label className="row" style={{ alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.5, margin: "6px 0 18px", cursor: "pointer" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: C.teal }} />
              <span>
                Я понимаю, что Ainala — справочный помощник и <strong>не заменяет лечащего врача</strong>. Упражнения выполняю только с разрешения специалиста.
              </span>
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="h1">Что случилось?</h1>
            <p className="muted" style={{ margin: "6px 0 16px" }}>
              Опишите травму или операцию своими словами — мы подберём область. Или выберите её ниже.
            </p>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setNotRecognized(false);
              }}
              placeholder="Например: разрыв ПКС, операция 3 недели назад"
              maxLength={600}
            />
            <button className="btn btn-soft block" style={{ margin: "10px 0 14px" }} onClick={analyze} disabled={!description.trim() || analyzing}>
              <Sparkles size={15} /> {analyzing ? "Анализирую…" : "Определить по описанию"}
            </button>
            <RedFlagAlert flag={redFlag} onShowSos={onShowSos} />
            {explanation && <div className="alert info">{explanation}</div>}
            {notRecognized && (
              <div className="alert urgent">Не удалось определить область по описанию — выберите её вручную.</div>
            )}
            <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <BodyMap part={part} size={130} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {BODY_PARTS.map((bp) => (
                  <button key={bp} className={`chip ${part === bp ? "active" : ""}`} style={{ textAlign: "left" }} onClick={() => setPart(bp)}>
                    {bp}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="h1">Этап восстановления</h1>
            <p className="muted" style={{ margin: "6px 0 16px" }}>Обычно его указывает врач или физиотерапевт. Если сомневаетесь — выберите более раннюю фазу.</p>
            {PHASES.map((p) => (
              <button key={p} className={`option ${phase === p ? "active" : ""}`} onClick={() => setPhase(p)}>
                <div style={{ flex: 1 }}>
                  <div className="between">
                    <span className="option-title">{p} фаза</span>
                    <span className="small mono">{PHASE_INFO[p].weeks}</span>
                  </div>
                  <div className="option-desc">{PHASE_INFO[p].goal}</div>
                </div>
              </button>
            ))}
            <div style={{ marginTop: 10 }}>
              <InputRow label="Дата травмы или операции (необязательно)" type="date" value={injuryDate} onChange={setInjuryDate} max={dateKey()} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="h1">Немного о вас</h1>
            <p className="muted" style={{ margin: "6px 0 16px" }}>Необязательно — помогает точнее посчитать белок и воду в калькуляторах.</p>
            <Field label="Единицы измерения">
              <Segmented
                value={about.units}
                onChange={(v) => setAbout({ ...about, units: v })}
                options={[{ value: "metric", label: "кг, см" }, { value: "imperial", label: "фунты, дюймы" }]}
              />
            </Field>
            <div className="grid-2" style={{ gap: 8 }}>
              <InputRow label="Возраст" inputMode="numeric" value={about.age} onChange={(v) => setAbout({ ...about, age: v.replace(/\D/g, "") })} placeholder="34" maxLength={3} />
              <InputRow label={`Вес, ${about.units === "metric" ? "кг" : "фунты"}`} inputMode="decimal" value={about.weight} onChange={(v) => setAbout({ ...about, weight: v.replace(/[^\d.,]/g, "") })} placeholder={about.units === "metric" ? "70" : "155"} maxLength={6} />
            </div>
            <InputRow label={`Рост, ${about.units === "metric" ? "см" : "дюймы"}`} inputMode="decimal" value={about.height} onChange={(v) => setAbout({ ...about, height: v.replace(/[^\d.,]/g, "") })} placeholder={about.units === "metric" ? "175" : "69"} maxLength={6} />
            <InputRow label="Аллергии" value={about.allergies} onChange={(v) => setAbout({ ...about, allergies: v })} placeholder="Нет / перечислите" maxLength={200} />
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="h1">Как вы сейчас?</h1>
            <p className="muted" style={{ margin: "6px 0 16px" }}>Определяет стартовую нагрузку. Уровень боли можно отмечать каждый день.</p>
            <div className="card">
              <PainSlider value={pain} onChange={setPain} label="Боль в покое" />
              <PainAdvice value={pain} />
            </div>
            <div className="field-label" style={{ marginTop: 16 }}>Обычная активность</div>
            {ACTIVITY_LEVELS.map((a) => (
              <button key={a.id} className={`option ${activityLevel === a.id ? "active" : ""}`} onClick={() => setActivityLevel(a.id)}>
                <div>
                  <div className="option-title">{a.label}</div>
                  <div className="option-desc">{a.desc}</div>
                </div>
              </button>
            ))}
          </>
        )}

        <button
          className="btn btn-primary block"
          style={{ marginTop: 18 }}
          disabled={!canNext}
          onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
        >
          {step === STEPS.length - 1 ? (initial ? "Сохранить план" : "Составить мой план") : step === 3 ? "Продолжить" : "Далее"}
        </button>
        {step === 0 && !initial && (
          <button
            className="btn btn-ghost block sm"
            style={{ marginTop: 8 }}
            disabled={!consent}
            title={consent ? undefined : "Сначала подтвердите, что приложение не заменяет врача"}
            onClick={() =>
              onComplete({ name: "Гость", part: "Колено", phase: "Ранняя", pain: 3, activityLevel: "moderate", units: "metric", startDate: dateKey(), injuryDate: "", description: "", age: "", weight: "", height: "", allergies: "" })
            }
          >
            Быстрый старт: посмотреть на примере колена
          </button>
        )}
      </div>
    </div>
  );
}
