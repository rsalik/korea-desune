// Sanity checks for the option files: dates, times, coordinates, stay references, schema enums.
import fs from "node:fs";
const ids = ["classic", "foliage", "grandloop", "island"];
const KINDS = new Set(["transport", "sight", "walk", "food", "stay", "night", "rest", "spa", "shop"]);
const MEALS = new Set(["breakfast", "lunch", "dinner", "snack", "drinks"]);
const DATES = ["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"];
const DOW = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let problems = 0;
const bad = (o, msg) => { problems++; console.log(`[${o}] ${msg}`); };
const inKorea = (lat, lon) => lat > 33 && lat < 38.7 && lon > 124.5 && lon < 131;
for (const id of ids) {
  const o = JSON.parse(fs.readFileSync(`option-${id}.json`, "utf8"));
  const stops = new Set(o.stays.map((s) => s.stop));
  if (o.days.length !== 9) bad(id, `days = ${o.days.length}`);
  o.days.forEach((d, i) => {
    if (d.date !== DATES[i]) bad(id, `day ${i} date ${d.date}`);
    if (d.dow !== DOW[i]) bad(id, `${d.date} dow ${d.dow}`);
    if (!stops.has(d.stay_stop)) bad(id, `${d.date} stay_stop ${d.stay_stop} not in stays`);
    let prev = "00:00";
    for (const it of d.items) {
      if (!KINDS.has(it.kind)) bad(id, `${d.date} kind ${it.kind}`);
      if (it.time < prev) bad(id, `${d.date} ${it.time} ${it.title}: out of order (prev ${prev})`);
      if (it.end && it.end < it.time) bad(id, `${d.date} ${it.time}-${it.end} ${it.title}: ends before start`);
      prev = it.time;
      if (it.lat != null && !inKorea(it.lat, it.lon)) bad(id, `${d.date} ${it.title}: coords ${it.lat},${it.lon}`);
      if (it.lat == null && it.kind !== "rest") bad(id, `${d.date} ${it.time} ${it.title}: no coords`);
    }
    for (const f of d.food || []) {
      if (!MEALS.has(f.meal)) bad(id, `${d.date} meal ${f.meal}`);
      if (f.lat != null && !inKorea(f.lat, f.lon)) bad(id, `${d.date} food ${f.name} coords`);
    }
  });
  // Stays must chain without gaps: Oct 16/17 -> Oct 25
  const sorted = [...o.stays].sort((a, b) => a.check_in.localeCompare(b.check_in));
  for (let i = 1; i < sorted.length; i++) if (sorted[i].check_in !== sorted[i - 1].check_out) bad(id, `stay gap ${sorted[i - 1].stop} -> ${sorted[i].stop}`);
  if (sorted.at(-1).check_out !== "2026-10-25") bad(id, `last checkout ${sorted.at(-1).check_out}`);
  for (const m of o.japan_matches) if (!DATES.includes(m.date)) bad(id, `japan match date ${m.date}`);
  for (const t of o.transport) if (!DATES.includes(t.date)) bad(id, `transport date ${t.date}`);
  console.log(`${id}: ${o.days.reduce((s, d) => s + d.items.length, 0)} items, ${o.stays.length} stays, ${o.transport.length} legs, $${o.budget.per_person_usd.value}-${o.budget.per_person_usd.splurge}`);
}
console.log(problems ? `${problems} problems` : "all checks passed");
