const STORAGE_PREFIX = "ainala_v2_";

/**
 * Очистка пользовательского ввода от потенциальных XSS-векторов и управляющих символов
 */
export function sanitizeText(input, maxLength = 1000) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, (ch) => (ch === "<" ? "‹" : "›"))
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, maxLength);
}

/**
 * Проверка описания симптомов на наличие «Красных флагов» (экстренных состояний)
 */
export function detectRedFlagsInText(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.toLowerCase();

  if (
    t.includes("задыха") ||
    t.includes("одышк") ||
    t.includes("боль в груд") ||
    t.includes("тромб") ||
    (t.includes("отек") && t.includes("икр")) ||
    (t.includes("отёк") && t.includes("икр"))
  ) {
    return {
      level: "critical",
      title: "Внимание: возможный сосудистый/тромбоэмболический риск",
      message:
        "Описанные симптомы (одышка, боль в груди или резкий отёк икры) требуют немедленной оценки врачом. Не выполняйте упражнения и обратитесь в скорую помощь (103 / 112).",
    };
  }

  if (
    t.includes("онемел") ||
    t.includes("не чувствую пальц") ||
    t.includes("посинел") ||
    t.includes("холодные пальц") ||
    t.includes("паралич")
  ) {
    return {
      level: "critical",
      title: "Внимание: признак сосудисто-неврологического дефицита",
      message:
        "Онемение, похолодание или изменение цвета пальцев может указывать на сдавление сосудов или нервов. Ослабьте повязку/ортез и срочно свяжитесь с врачом.",
    };
  }

  if (
    t.includes("гной") ||
    t.includes("разошелся шов") ||
    t.includes("разошёлся шов") ||
    t.includes("температура 38") ||
    t.includes("температура 39") ||
    t.includes("жар ")
  ) {
    return {
      level: "urgent",
      title: "Требуется осмотр врача (признаки воспаления)",
      message:
        "Повышение температуры тела или выделения из области шва — повод приостановить тренировки и обратиться к лечащему хирургу/травматологу.",
    };
  }

  return null;
}

/**
 * Безопасное чтение и запись состояния в localStorage с изоляцией ключей
 */
export function loadPersistedState(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function savePersistedState(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Игнорируем переполнение квоты (например, при больших фото)
  }
}

export function wipeAllPersistedData() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // ignore
  }
}

export function exportGdprDataSnapshot(stateObj) {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "Ainala MVP 0.2.0",
    complianceStandard: "HIPAA / GDPR / 152-FZ Patient Portability Format",
    data: stateObj,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ainala-patient-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
