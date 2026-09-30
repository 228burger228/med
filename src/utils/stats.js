import { EXERCISES, PHASES } from "../data/mockData";

// ─── Даты (локальный календарный день, без UTC-сдвигов) ───────────────────────

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function daysBetween(fromKey, toKey) {
  return Math.round((parseKey(toKey) - parseKey(fromKey)) / 86400000);
}

export function formatDay(key, opts = { day: "numeric", month: "short" }) {
  return parseKey(key).toLocaleDateString("ru-RU", opts);
}

export function pluralDays(n) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b === 1) return "день";
  if (b >= 2 && b <= 4) return "дня";
  return "дней";
}

// ─── План упражнений ─────────────────────────────────────────────────────────

/** Упражнения текущей фазы + более ранних (как разминка), максимум 3. */
export function buildPlan(profile) {
  if (!profile?.part) return [];
  const phaseIdx = Math.max(0, PHASES.indexOf(profile.phase));
  const forPart = EXERCISES.filter((e) => e.part === profile.part);
  const current = forPart.filter((e) => PHASES.indexOf(e.phase) === phaseIdx);
  const earlier = forPart
    .filter((e) => PHASES.indexOf(e.phase) < phaseIdx)
    .sort((a, b) => PHASES.indexOf(b.phase) - PHASES.indexOf(a.phase));
  let plan = [...current, ...earlier].slice(0, 3);
  if (!plan.length) plan = forPart.slice(0, 2);
  return plan.map((e) => e.id);
}

// ─── Статистика ──────────────────────────────────────────────────────────────

/** День активен, если выполнено хотя бы одно упражнение (напоминания «ev:» и режим «care:» не считаются). */
export function isDayActive(done, key) {
  const day = done?.[key];
  return !!day && Object.entries(day).some(([id, v]) => v === true && !id.includes(":"));
}

export function computeBestStreak(done) {
  const days = Object.keys(done || {}).filter((k) => isDayActive(done, k)).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** Серия дней подряд с хотя бы одной выполненной тренировкой (сегодня можно ещё не успеть). */
export function computeStreak(done, today = dateKey()) {
  let key = isDayActive(done, today) ? today : addDays(today, -1);
  let n = 0;
  while (isDayActive(done, key)) {
    n += 1;
    key = addDays(key, -1);
  }
  return n;
}

/** Доля выполненных упражнений плана за последние до 7 дней с начала реабилитации. */
export function computeAdherence(done, plan, startKey, today = dateKey()) {
  if (!plan.length) return 0;
  const days = Math.max(1, Math.min(7, daysBetween(startKey || today, today) + 1));
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const day = done?.[addDays(today, -i)] || {};
    completed += plan.filter((id) => day[id]).length;
  }
  return Math.round((completed / (plan.length * days)) * 100);
}

export function painTrend(painLog) {
  if (!painLog?.length) return null;
  const sorted = [...painLog].sort((a, b) => a.date.localeCompare(b.date));
  return { first: sorted[0].pain, last: sorted[sorted.length - 1].pain, count: sorted.length };
}

// ─── Единицы ─────────────────────────────────────────────────────────────────

export function weightKg(profile) {
  const w = parseFloat(String(profile?.weight || "").replace(",", "."));
  if (!Number.isFinite(w) || w <= 0) return null;
  return profile?.units === "imperial" ? Math.round(w * 0.4536) : Math.round(w);
}

export function painTone(p) {
  if (p >= 7) return "red";
  if (p >= 4) return "amber";
  return "green";
}
