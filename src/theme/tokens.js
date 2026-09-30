// Палитра «клиническая яркость»: насыщенный медицинский бирюзовый + iOS-синий,
// энергичный коралл, и светофор боли (зелёный / янтарный / красный).
// Значения продублированы в index.css (CSS-переменные).
export const C = {
  bg: "#EEF6F6",
  paper: "#FFFFFF",
  ink: "#0F2A2A",
  inkSoft: "#4B6462",
  muted: "#86A09D",
  line: "#D9E7E6",
  teal: "#0B8A8F",
  tealDark: "#066A70",
  tealSoft: "#DBF4F2",
  tealBorder: "#A6E1DC",
  coral: "#FF6B4A",
  coralSoft: "#FFE6DE",
  sky: "#0A7CFF",
  skySoft: "#E0EEFF",
  violet: "#7B61FF",
  violetSoft: "#ECE8FF",
  green: "#16B364",
  greenSoft: "#D9F7E6",
  amber: "#F2A007",
  amberSoft: "#FFF3D1",
  black: "#0E1B1A",
  red: "#E5484D",
  redSoft: "#FDE3E3",
};

export const TONES = {
  neutral: { bg: C.line, fg: C.inkSoft },
  teal: { bg: C.tealSoft, fg: C.teal },
  coral: { bg: C.coralSoft, fg: "#C2410C" },
  sky: { bg: C.skySoft, fg: "#0060D6" },
  green: { bg: C.greenSoft, fg: "#0E7A43" },
  amber: { bg: C.amberSoft, fg: "#8A5600" },
  violet: { bg: C.violetSoft, fg: "#5B3FE0" },
  red: { bg: C.redSoft, fg: C.red },
};

export const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const DISPLAY = FONT;
export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
