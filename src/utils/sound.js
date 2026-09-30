// Процедурный генератор звуков на Web Audio API (в стиле heli-portfolio — без внешних MP3 файлов)
let audioCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSoftTick() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playPhaseSwitch(isWork) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  const freq = isWork ? 660 : 440;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(isWork ? 880 : 520, ctx.currentTime + 0.18);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.24);
}

export function playVictoryChord() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const start = ctx.currentTime + idx * 0.08;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.09, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.46);
  });
}
