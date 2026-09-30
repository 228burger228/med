import React, { useState } from "react";
import { Play, Video, ExternalLink, Subtitles, AlertTriangle, Star } from "lucide-react";
import { C } from "../theme/tokens";
import { EXERCISES, BODY_PARTS, PHASES } from "../data/mockData";
import { Pill, ScreenTitle, Modal, ModalHeader } from "../components/ui/SharedUI";
import { JointAnimation } from "../components/JointAnimation";

export function ExercisesScreen({ profile, plan, onStart }) {
  const [category, setCategory] = useState(profile?.part || "Все");
  const [videoEx, setVideoEx] = useState(null);
  const phaseIdx = PHASES.indexOf(profile?.phase);

  const filtered = (category === "Все" ? EXERCISES : EXERCISES.filter((e) => e.part === category))
    .slice()
    .sort((a, b) => Number(plan.includes(b.id)) - Number(plan.includes(a.id)));

  return (
    <div className="screen">
      <ScreenTitle subtitle="Пошаговые разборы техники с субтитрами и таймером">Упражнения</ScreenTitle>
      <div className="chips" style={{ marginBottom: 14 }}>
        {["Все", ...BODY_PARTS].map((cat) => (
          <button key={cat} className={`chip ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.map((ex) => {
        const inPlan = plan.includes(ex.id);
        const tooEarly = ex.part === profile?.part && PHASES.indexOf(ex.phase) > phaseIdx;
        return (
          <div key={ex.id} className="card" style={inPlan ? { borderColor: C.tealBorder } : undefined}>
            <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <div className="icon-tile" style={{ background: inPlan ? C.teal : C.tealSoft, width: 48, height: 48 }}>
                <Play size={18} color={inPlan ? "#fff" : C.teal} fill={inPlan ? "#fff" : C.teal} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{ex.name}</div>
                <div className="small" style={{ marginTop: 4 }}>
                  {ex.part} · {ex.sets} × {ex.reps} повт. · {ex.phase.toLowerCase()} фаза
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {inPlan && <Pill tone="teal"><Star size={11} /> В вашем плане</Pill>}
                  <Pill tone={ex.difficulty === "Лёгкая" ? "green" : "amber"}>{ex.difficulty}</Pill>
                  {ex.targetRom && <Pill tone="sky">{ex.targetRom}</Pill>}
                </div>
              </div>
            </div>
            {tooEarly && (
              <div className="alert urgent" style={{ margin: "12px 0 0", padding: "8px 12px", fontSize: 12 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                Для более поздней фазы — только с разрешения врача.
              </div>
            )}
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn btn-primary sm" style={{ flex: 1 }} onClick={() => onStart(ex.id)}>
                <Play size={13} fill="#fff" /> Тренировка
              </button>
              <button className="btn btn-soft sm" style={{ flex: 1 }} onClick={() => setVideoEx(ex)}>
                <Video size={14} /> Разбор техники
              </button>
            </div>
          </div>
        );
      })}

      <VideoHubModal exercise={videoEx} onClose={() => setVideoEx(null)} onStart={onStart} />
    </div>
  );
}

export function VideoHubModal({ exercise, onClose, onStart }) {
  const [ccOn, setCcOn] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const steps = exercise?.subtitles?.length ? exercise.subtitles : [{ from: 0, to: 5, text: exercise?.instructions }];

  const close = () => {
    setStepIdx(0);
    onClose();
  };

  return (
    <Modal open={!!exercise} onClose={close} title={exercise?.name}>
      {exercise && (
        <>
          <ModalHeader title={exercise.name} onClose={close} />
          <div className="player" style={{ borderRadius: 16, margin: "0 0 14px" }}>
            <div className="between" style={{ marginBottom: 6 }}>
              <span className="player-pill">{exercise.part} · {exercise.phase.toLowerCase()} фаза</span>
              <button className={`player-pill ${ccOn ? "on" : ""}`} onClick={() => setCcOn((v) => !v)} aria-pressed={ccOn}>
                <Subtitles size={13} /> CC
              </button>
            </div>
            <JointAnimation />
            {ccOn && <div className="cc">{steps[stepIdx]?.text}</div>}
          </div>

          <div className="eyebrow" style={{ marginBottom: 8 }}>Техника по шагам</div>
          {steps.map((s, i) => (
            <button key={i} className={`option ${stepIdx === i ? "active" : ""}`} style={{ padding: "9px 12px", marginBottom: 6 }} onClick={() => setStepIdx(i)}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: C.teal }}>
                0:{String(s.from).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 12.5 }}>{s.text}</span>
            </button>
          ))}

          {exercise.biomechanicsTip && (
            <div className="alert info" style={{ marginTop: 8 }}>💡 {exercise.biomechanicsTip}</div>
          )}
          <div className="alert urgent">⚠ {exercise.caution}</div>

          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1.3 }} onClick={() => { close(); onStart(exercise.id); }}>
              <Play size={14} fill="#fff" /> С таймером
            </button>
            <a className="btn btn-secondary" style={{ flex: 1 }} href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
              YouTube <ExternalLink size={13} />
            </a>
          </div>
          <p className="small" style={{ marginTop: 10, textAlign: "center" }}>
            YouTube откроет поиск видео — выбирайте ролики от врачей и физиотерапевтов.
          </p>
        </>
      )}
    </Modal>
  );
}
