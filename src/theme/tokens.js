// Палитра «восстановление»: спокойный хвойно-бирюзовый, тёплый коралл для энергии,
// и светофор боли (зелёный / янтарный / красный). Значения продублированы в index.css.
export const C = {
  bg: "#F1F5F2",
  paper: "#FFFFFF",
  ink: "#15302B",
  inkSoft: "#56675F",
  muted: "#8A9A92",
  line: "#DCE5DF",
  teal: "#1F6B5C",
  tealDark: "#154A40",
  tealSoft: "#E1EFEA",
  tealBorder: "#BCD9CF",
  coral: "#E0795A",
  coralSoft: "#FBE9E1",
  sky: "#3F7EA6",
  skySoft: "#E3EEF5",
  green: "#2E9E6A",
  greenSoft: "#DFF3E8",
  amber: "#C98300",
  amberSoft: "#FDF1D6",
  black: "#121A18",
  red: "#C4452F",
  redSoft: "#F9E0DA",
};

export const TONES = {
  neutral: { bg: C.line, fg: C.inkSoft },
  teal: { bg: C.tealSoft, fg: C.teal },
  coral: { bg: C.coralSoft, fg: "#A94B2F" },
  sky: { bg: C.skySoft, fg: C.sky },
  green: { bg: C.greenSoft, fg: "#1E7A50" },
  amber: { bg: C.amberSoft, fg: "#8A5A00" },
  red: { bg: C.redSoft, fg: C.red },
};

export const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const DISPLAY = FONT;
export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
