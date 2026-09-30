import React, { useEffect, useReducer, useRef, useState } from "react";
import { Play, Pause, SkipForward, ChevronLeft, Subtitles, Volume2, VolumeX } from "lucide-react";
import { C } from "../theme/tokens";
import { playSoftTick, playPhaseSwitch, playVictoryChord } from "../utils/sound";
import { Pill, Card, RecoveryRing, PainSlider, PainAdvice } from "../components/ui/SharedUI";
import { JointAnimation } from "../components/JointAnimation";

// Чистый редьюсер: безопасен в StrictMode (никаких побочных эффектов внутри)
function advance(s, ex) {
  if (s.phase === "work") {
    if (s.setIndex + 1 >= ex.sets) return { ...s, done: true, secondsLeft: 0, elapsed: 0 };
    return { ...s, phase: "rest", secondsLeft: ex.restSec, elapsed: 0 };
  }
  return { ...s, phase: "work", setIndex: s.setIndex + 1, secondsLeft: ex.workSec, elapsed: 0 };
}

function reducer(s, action) {
  if (s.done) return s;
  switch (action.type) {
    case "tick":
      if (s.secondsLeft > 1) return { ...s, secondsLeft: s.secondsLeft - 1, elapsed: s.elapsed + 1 };
      return advance(s, action.exercise);
    case "skip":
      return advance(s, action.exercise);
    default:
      return s;
  }
}

export function GuidedSession({ exercise, onFinish, onExit }) {
  const [state, dispatch] = useReducer(reducer, { setIndex: 0, phase: "work", secondsLeft: exercise.workSec, elapsed: 0, done: false });
  const [running, setRunning] = useState(true);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [painAfter, setPainAfter] = useState(2);
  const { setIndex, phase, secondsLeft, elapsed, done } = state;

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => dispatch({ type: "tick", exercise }), 1000);
    return () => clearInterval(t);
  }, [running, done, exercise]);

  // Звуки — реакция на смену состояния, а не побочный эффект внутри setState
  const prevStage = useRef(`${phase}-${setIndex}-${done}`);
  useEffect(() => {
    const stage = `${phase}-${setIndex}-${done}`;
    if (stage === prevStage.current) return;
    prevStage.current = stage;
    if (!soundEnabled) return;
    if (done) playVictoryChord();
    else playPhaseSwitch(phase === "work");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, setIndex, done]);

  useEffect(() => {
    if (soundEnabled && running && !done && secondsLeft <= 3 && secondsLeft > 0) playSoftTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const totalPhaseSec = phase === "work" ? exercise.workSec : exercise.restSec;
  const ringPercent = Math.round(((totalPhaseSec - secondsLeft) / totalPhaseSec) * 100);
  const subtitle =
    phase === "rest"
      ? "Отдых: расслабьте мышцы, дышите глубоко и ровно."
      : exercise.subtitles?.find((s) => elapsed >= s.from && elapsed < s.to)?.text || exercise.instructions;

  return (
    <div className="app">
      <div className="player" style={{ paddingTop: 14 }}>
        <div className="between" style={{ marginBottom: 6 }}>
          <button className="player-pill" onClick={onExit}>
            <ChevronLeft size={14} /> Выйти
          </button>
          <div className="row" style={{ gap: 6 }}>
            <button className={`player-pill ${ccEnabled ? "on" : ""}`} onClick={() => setCcEnabled((v) => !v)} aria-pressed={ccEnabled} aria-label="Субтитры">
              <Subtitles size={14} /> CC
            </button>
            <button className="player-pill" onClick={() => setSoundEnabled((v) => !v)} aria-pressed={soundEnabled} aria-label="Звук">
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
        <JointAnimation
          animate={phase === "work" && running && !done}
          caption={done ? "Готово!" : phase === "work" ? "Плавно: 2 сек вверх · 2 сек вниз" : "Восстановите дыхание"}
        />
        {ccEnabled && !done && <div className="cc">{subtitle}</div>}
      </div>

      <div className="screen">
        {!done ? (
          <>
            <div style={{ textAlign: "center" }}>
              <Pill tone={phase === "work" ? "teal" : "coral"}>{phase === "work" ? "Выполняйте движение" : "Отдых"}</Pill>
              <h1 className="h1" style={{ fontSize: 22, margin: "10px 0 4px" }}>{exercise.name}</h1>
              <div className="muted">Подход {setIndex + 1} из {exercise.sets} · {exercise.reps} повторений</div>
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 6, margin: "12px 0" }}>
              {Array.from({ length: exercise.sets }).map((_, i) => (
                <span key={i} style={{ width: 28, height: 6, borderRadius: 99, background: i < setIndex ? C.teal : i === setIndex ? C.coral : C.line }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 18px" }}>
              <RecoveryRing percent={ringPercent} size={176} strokeColor={phase === "work" ? C.teal : C.coral} centerValue={String(secondsLeft)} centerLabel="СЕКУНД" isMono />
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setRunning((r) => !r)} style={{ minWidth: 140 }}>
                {running ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
                {running ? "Пауза" : "Продолжить"}
              </button>
              <button className="btn btn-secondary" onClick={() => dispatch({ type: "skip", exercise })}>
                <SkipForward size={16} /> Далее
              </button>
            </div>
            <Card>
              <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{exercise.instructions}</div>
              {exercise.biomechanicsTip && <div className="alert info" style={{ margin: "10px 0 0" }}>💡 {exercise.biomechanicsTip}</div>}
              <div className="alert urgent" style={{ margin: "8px 0 0" }}>⚠ {exercise.caution}</div>
            </Card>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "8px 0 14px" }}>
              <div style={{ fontSize: 40 }}>🌿</div>
              <h1 className="h1" style={{ fontSize: 23, marginTop: 6 }}>Тренировка завершена</h1>
              <p className="muted">Отличная работа! Как сустав после упражнения?</p>
            </div>
            <Card>
              <PainSlider value={painAfter} onChange={setPainAfter} label="Боль после упражнения" />
              <PainAdvice value={painAfter} />
            </Card>
            <button className="btn btn-primary block" onClick={() => onFinish({ painAfter })}>
              Сохранить и вернуться
            </button>
          </>
        )}
      </div>
    </div>
  );
}
