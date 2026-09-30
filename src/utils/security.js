const STORAGE_PREFIX = "ainala_v3_";

/**
 * Нормализация пользовательского текста: убираем управляющие символы и ограничиваем длину.
 * HTML-экранирование не нужно — React экранирует весь выводимый текст сам.
 */
export function sanitizeText(input, maxLength = 1000) {
  if (typeof input !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

/** Разрешаем только http(s)-ссылки (защита от javascript:/data: URL). */
export function safeUrl(input) {
  try {
    const u = new URL(String(input).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

// ─── «Красные флаги» ─────────────────────────────────────────────────────────

const L = "(?<![а-яa-z])"; // начало слова (кириллица не поддерживается \b)

const RED_FLAG_RULES = [
  {
    level: "critical",
    title: "Возможный тромбоз или тромбоэмболия",
    message:
      "Одышка, боль в груди или резкий отёк икры требуют немедленной оценки врачом. Прекратите упражнения и вызовите скорую помощь (103 / 112).",
    patterns: [
      `${L}задыха`, `${L}одышк`, `${L}нехватк\\S* воздуха`, `${L}не могу дышать`,
      `${L}бол\\S* в груд`, `${L}давит в груд`, `${L}тромб`,
      `${L}отек\\S*[^.!?]{0,30}${L}(икр|голен)`, `${L}(икр|голен)\\S*[^.!?]{0,30}${L}отек`,
    ],
  },
  {
    level: "critical",
    title: "Признак нарушения кровообращения или иннервации",
    message:
      "Онемение, похолодание, побледнение или посинение пальцев могут означать сдавление сосудов или нервов. Ослабьте повязку/ортез и срочно свяжитесь с врачом.",
    patterns: [
      `${L}онемел`, `${L}немеют`, `${L}не чувствую пальц`, `${L}посинел`, `${L}синеют`,
      `${L}холодн\\S* пальц`, `${L}пальц\\S* холодн`, `${L}паралич`, `${L}не могу пошевелить`,
    ],
  },
  {
    level: "urgent",
    title: "Возможные признаки инфекции",
    message:
      "Температура 38 °C и выше, гной или расхождение шва — повод приостановить тренировки и в течение суток связаться с хирургом/травматологом.",
    patterns: [
      `${L}гно[йия]`, `${L}разош\\S* шов`, `${L}шов разош`,
      `${L}(температур\\S*|t|т)\\s*(под|около|выше|уже|до)?\\s*(3[89]|4[0-2])([.,]\\d)?(?!\\d)`,
      `${L}жар(?![а-я])`, `${L}лихорад`, `${L}озноб`,
    ],
  },
];

const NEGATION = /(?<![а-я])(нет|без|не было|отсутству\S*)\s+(\S+\s+)?$/;

/** Ищет опасные симптомы, игнорируя явные отрицания («нет одышки», «без отёка»). */
export function detectRedFlagsInText(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.toLowerCase().replace(/ё/g, "е");
  for (const rule of RED_FLAG_RULES) {
    for (const p of rule.patterns) {
      const re = new RegExp(p, "g");
      let m;
      while ((m = re.exec(t))) {
        const before = t.slice(Math.max(0, m.index - 24), m.index);
        if (!NEGATION.test(before)) {
          return { level: rule.level, title: rule.title, message: rule.message };
        }
      }
    }
  }
  return null;
}

// ─── Локальное хранилище ─────────────────────────────────────────────────────

export function loadPersistedState(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Возвращает false, если запись не удалась (например, переполнена квота). */
export function savePersistedState(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function wipeAllPersistedData() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
    });
  } catch {
    // ignore
  }
}

export function exportDataSnapshot(stateObj) {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "Ainala 0.3.0",
    note: "Данные хранились только на этом устройстве (localStorage браузера).",
    data: stateObj,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ainala-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Отзываем ссылку с задержкой, иначе Safari/Firefox могут прервать загрузку
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
