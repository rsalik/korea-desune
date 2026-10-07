// Inline site/index.html's local scripts and viz.css into single-file pages:
//   dist/korea-autumn-2026.html  (artifact body: no doctype, the publish step adds the skeleton)
//   dist/index.html              (standalone: open it straight from disk; d3 and fonts still load from their CDNs)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const site = path.join(root, "site");
const dist = path.join(root, "dist");
fs.mkdirSync(dist, { recursive: true });

let html = fs.readFileSync(path.join(site, "index.html"), "utf8");
const read = (f) => fs.readFileSync(path.join(site, f), "utf8");

html = html.replace(/<link rel="stylesheet" href="([^"h][^"]*\.css)">/g, (_, f) => `<style>\n${read(f)}\n</style>`);
html = html.replace(/<script src="([^"h][^"]*\.js)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, "<\\/script")}\n</script>`);

const leftovers = [...html.matchAll(/(?:src|href)="(?!https?:|#|mailto:)([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
if (leftovers.length) throw new Error("local references left: " + leftovers.join(", "));

fs.writeFileSync(path.join(dist, "korea-autumn-2026.html"), html);
fs.writeFileSync(
  path.join(dist, "index.html"),
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n' + html + "\n</body>\n</html>\n",
);
console.log("dist/korea-autumn-2026.html", (html.length / 1024).toFixed(0) + " KB");
