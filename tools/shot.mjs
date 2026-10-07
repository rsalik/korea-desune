// Screenshot a page in site/ with Playwright: desktop + phone, light + dark; reports console errors and horizontal overflow.
// Usage: node tools/shot.mjs [page.html] [outDir] [--hash=foliage] [--full]
// cdnjs is unreachable from the build sandbox, so d3 requests are served from a local copy (D3_PATH env or the default below).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node22/lib/node_modules/playwright");

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; }));
const [page = "index.html", outDir = "/tmp/shots"] = args.filter((a) => !a.startsWith("--"));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../site");
const D3 = process.env.D3_PATH || "/tmp/claude-0/-home-user-korea-desune/ac38e876-0218-53c8-90f9-8471a9d36099/scratchpad/vendor/package/dist/d3.min.js";
fs.mkdirSync(outDir, { recursive: true });

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/${page}${flags.hash ? "#" + flags.hash : ""}`;

const browser = await chromium.launch();
const runs = [
  { name: "desktop-light", width: 1366, height: 900, scheme: "light" },
  { name: "desktop-dark", width: 1366, height: 900, scheme: "dark" },
  { name: "phone-light", width: 390, height: 844, scheme: "light" },
  { name: "phone-dark", width: 390, height: 844, scheme: "dark" },
];
for (const r of runs) {
  const ctx = await browser.newContext({ viewport: { width: r.width, height: r.height }, colorScheme: r.scheme, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  pg.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await pg.route("https://cdnjs.cloudflare.com/ajax/libs/d3/**", (route) => route.fulfill({ path: D3, contentType: "text/javascript" }));
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await pg.goto(base, { waitUntil: "load" });
  await pg.waitForTimeout(900);
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const file = path.join(outDir, `${r.name}.png`);
  await pg.screenshot({ path: file, fullPage: !!flags.full });
  console.log(`${r.name}: ${file}  overflow-x=${overflow}px  ${errors.length ? "\n  " + errors.join("\n  ") : "no console errors"}`);
  await ctx.close();
}
await browser.close();
server.close();
