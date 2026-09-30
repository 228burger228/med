import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// 1. Записываем исходный index.html для сборщика Vite
const viteIndexHtml = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>Ainala — Ваш спутник безопасной реабилитации</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

fs.writeFileSync(path.resolve("index.html"), viteIndexHtml, "utf-8");

// 2. Запускаем сборку Vite
console.log("Running vite build...");
execSync("npx vite build", { stdio: "inherit" });

// 3. Собираем автономный index.html (работает и на GitHub Pages из корня main, и при двойном клике локально!)
const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");
let html = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

const files = fs.readdirSync(assetsDir);
const cssFile = files.find((f) => f.endsWith(".css"));
const jsFile = files.find((f) => f.endsWith(".js"));

const cssContent = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), "utf-8") : "";
const jsContent = jsFile ? fs.readFileSync(path.join(assetsDir, jsFile), "utf-8") : "";

html = html.replace(
  /<link rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/,
  () => `<style>\n${cssContent}\n</style>`
);
html = html.replace(
  /<script type="module"[^>]*src="[^"]*\.js"[^>]*><\/script>/,
  () => `<script type="module">\n${jsContent}\n</script>`
);

// Сохраняем в dist/index.html, в корневой index.html и в docs/index.html (для любого режима GitHub Pages)
fs.writeFileSync(path.join(distDir, "index.html"), html, "utf-8");
fs.writeFileSync(path.resolve("index.html"), html, "utf-8");

const docsDir = path.resolve("docs");
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, "index.html"), html, "utf-8");

console.log("Standalone index.html (root, dist/, docs/) built successfully!");
