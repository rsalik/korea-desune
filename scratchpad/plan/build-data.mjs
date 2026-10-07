// Assemble site/data.js (window.TRIP) from the option files, the catalog and guide.json. See data-contract.md.
import fs from "node:fs";

const here = (p) => new URL(p, import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(here(p), "utf8"));
const catalog = read("./catalog.json");
const guideFile = read("./guide.json");

const ORDER = ["classic", "foliage", "grandloop", "island"];
const options = ORDER.filter((id) => fs.existsSync(here(`./option-${id}.json`))).map((id) => read(`./option-${id}.json`));

// Ids that plans or the guide point at must stay visible.
const referenced = new Set();
const walk = (o) => {
  if (Array.isArray(o)) return o.forEach(walk);
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      if ((k === "place_id" || k === "food_id" || k === "lodging_id") && v) referenced.add(v);
      if (k === "place_ids" && Array.isArray(v)) v.forEach((x) => referenced.add(x));
      walk(v);
    }
  }
};
walk(options);
const inPlans = new Set(referenced);
walk(guideFile);

// Near-duplicate catalog entries from overlapping research files; hidden from the "All places" grid unless a day plan uses them.
const ALIASES = new Set([
  "haeundae-blueline-park", "huinnyeoul-village", "gamcheon-village", "spaland-centum", "national-museum-korea",
  "seoul-haneul-park-eulalia", "haneul-park", "bukchon-hanok-village", "gyeongju-night-heritage", "woljeongsa-fir-forest",
  "nami-gapyeong-morning-calm", "jeju-saebyeol-oreum", "gyeongju-autumn-spots", "gwongeumseong-cable-car",
  "gangneung-anmok-gyeongpo", "seorak-waterpia-spa", "myeongdong-euljiro", "hongdae", "gyeongju-day-trip", "gyeongju-city-tour",
  "seoul-palaces-deoksugung-namsan",
]);

function zone(lat, lon) {
  if (lat == null || lon == null) return "Elsewhere";
  if (lat < 34) return "Jeju";
  if (lat > 34.9 && lat < 35.45 && lon > 128.8) return "Busan";
  if (lat > 35.6 && lat < 36.05 && lon > 129.0 && lon < 129.5) return "Gyeongju";
  if (lat > 37.35 && lat < 37.75 && lon > 126.7 && lon < 127.2) return "Seoul";
  if (lat > 37.3 && lon > 128.3) return "Gangwon coast";
  return "Elsewhere";
}

const str = (v) => (v == null ? null : Array.isArray(v) ? v.join(" ") : typeof v === "object" ? JSON.stringify(v) : String(v));

const places = {};
for (const p of Object.values(catalog.places)) {
  places[p.id] = {
    id: p.id, name: p.name, name_ko: p.name_ko || null, region: p.region || null, area: p.area || null,
    zone: zone(p.lat, p.lon), category: p.category || "experience", lat: p.lat ?? null, lon: p.lon ?? null,
    summary: str(p.summary), why: str(p.why), autumn_note: str(p.autumn_note), hours: str(p.hours), closed: str(p.closed),
    cost_krw: typeof p.cost_krw === "number" ? p.cost_krw : null, cost_note: str(p.cost_note), booking: str(p.booking),
    tips: Array.isArray(p.tips) ? p.tips : p.tips ? [String(p.tips)] : [],
    image: null, hidden: ALIASES.has(p.id) && !inPlans.has(p.id),
  };
}

const lodging = {};
for (const l of Object.values(catalog.lodging)) {
  lodging[l.id] = {
    id: l.id, name: l.name, name_ko: l.name_ko || null, city: l.city || null, area: l.area || null, type: l.type || null,
    lat: l.lat ?? null, lon: l.lon ?? null, room_for_3: str(l.room_for_3), highlights: str(l.highlights), drawbacks: str(l.drawbacks),
    booking: str(l.booking), image: null,
  };
}

const food = {};
for (const f of Object.values(catalog.food)) {
  food[f.id] = {
    id: f.id, name: f.name, name_ko: f.name_ko || null, city: f.city || null, area: f.area || null, type: f.type || null,
    price_krw_pp: typeof f.price_krw_pp === "number" ? f.price_krw_pp : null, price_note: str(f.price_note || f.price),
    booking: str(f.booking), why: str(f.why || f.note), lat: f.lat ?? null, lon: f.lon ?? null, image: null,
  };
}

// Report dangling references so plans never point at missing catalog entries.
const missing = [...referenced].filter((id) => !places[id] && !food[id] && !lodging[id]);
if (missing.length) console.warn("unresolved ids:", missing.join(", "));

const TRIP = {
  meta: {
    title: "Korea Autumn 2026", start: "2026-10-17", end: "2026-10-25", travelers: 3,
    fx: 1340, budget_usd_pp: 1000, checked: "2026-10-07",
    flights: [
      { dir: "out", from: "EWR", to: "ICN", airline: "Air Premia", dep: "2026-10-16T01:00", arr: "2026-10-17T05:15", note: "Nonstop, 15 h 15 m" },
      { dir: "back", from: "ICN", to: "EWR", airline: "Air Premia", dep: "2026-10-25T21:55", arr: "2026-10-25T22:30", note: "Nonstop, 13 h 35 m" },
    ],
    photos_note: "Photos could not be downloaded when this page was built, so places show drawn vignettes. Every place links to Naver and Google photo searches.",
  },
  options,
  places, lodging, food,
  images: {},
  foliage: guideFile.foliage,
  events: guideFile.events,
  guide: guideFile.guide,
};

fs.mkdirSync(here("../../site/"), { recursive: true });
const js = "window.TRIP = " + JSON.stringify(TRIP) + ";\n";
fs.writeFileSync(here("../../site/data.js"), js);
console.log("data.js", (js.length / 1024).toFixed(0) + " KB", "options:", options.map((o) => o.id).join(","),
  "places:", Object.keys(places).length, "visible:", Object.values(places).filter((p) => !p.hidden).length);
