import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Сборка в один docs/index.html (JS и CSS встроены): его отдаёт GitHub Pages (через редирект
// из корневого index.html) и его можно открыть двойным кликом без сервера —
// браузеры блокируют отдельные module-скрипты по протоколу file://.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
});
