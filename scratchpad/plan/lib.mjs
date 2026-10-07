// Shared helpers for the option builders: tier fallback and budget math (see brief.md, "Budget math").
export const FX = 1340;
export const TIERS = ["value", "sweet", "splurge"];

// A stop may offer fewer than 3 tiers; use the nearest cheaper tier, then the nearest dearer one.
export function pickChoice(stop, tier) {
  const order = { value: ["value", "sweet", "splurge"], sweet: ["sweet", "value", "splurge"], splurge: ["splurge", "sweet", "value"] }[tier];
  for (const t of order) {
    const c = stop.choices.find((x) => x.tier === t);
    if (c) return c;
  }
  throw new Error(`stop ${stop.stop} has no choices`);
}

// Fill total_krw on every choice: nights x price, unless a total is given explicitly.
export function fillTotals(stays) {
  for (const s of stays) for (const c of s.choices) if (!c.total_krw) c.total_krw = Math.round(c.price_krw_per_night * s.nights);
  return stays;
}

// Lodging totals: core = 8 nights Oct 17-24; the Oct 16 night at an includes_oct16 stop is split out.
export function computeBudget({ stays, transport, activities, localTransitPP, notes }) {
  const transportPP = transport.filter((t) => t.counted !== false).reduce((s, t) => s + (t.cost_krw_pp || 0), 0);
  const activitiesPP = activities.reduce((s, a) => s + a.cost_krw_pp, 0);
  const lodging = {}, oct16 = {}, pp = {}, pp16 = {};
  for (const t of TIERS) {
    let total = 0, extra = 0;
    for (const s of stays) {
      const c = pickChoice(s, t);
      if (s.includes_oct16) {
        const e = c.oct16_krw ?? c.price_krw_per_night;
        extra += e;
        total += c.total_krw - e;
      } else total += c.total_krw;
    }
    lodging[t] = Math.round(total);
    oct16[t] = Math.round(extra);
    const base = total / 3 + transportPP + localTransitPP + activitiesPP;
    pp[t] = Math.round(base / FX);
    pp16[t] = Math.round((base + extra / 3) / FX);
  }
  transport.forEach((t) => delete t.counted);
  return {
    fx: FX,
    lodging_krw_total: lodging,
    oct16_extra_krw: oct16,
    transport_krw_pp: transportPP,
    local_transit_krw_pp: localTransitPP,
    activities_krw_pp: activitiesPP,
    per_person_usd: pp,
    per_person_usd_with_oct16: pp16,
    notes,
  };
}

export function checkNights(stays) {
  const core = stays.reduce((s, x) => s + x.nights - (x.includes_oct16 ? 1 : 0), 0);
  if (core !== 8) throw new Error(`core nights = ${core}, expected 8`);
}

// Day-plan helpers: item/food constructors, and coordinates filled from the catalog when a catalog id is given.
import fs from "node:fs";
const CATALOG = JSON.parse(fs.readFileSync(new URL("./catalog.json", import.meta.url), "utf8"));

export function item(time, end, kind, title, place_id, detail, extra = {}) {
  const o = { time, end, kind, title, place_id: place_id || null, detail, cost_krw_pp: 0, ...extra };
  if (o.lat == null && place_id) {
    const p = CATALOG.places[place_id] || CATALOG.lodging[place_id];
    if (!p) throw new Error(`unknown place_id ${place_id}`);
    if (p.lat != null) Object.assign(o, { lat: p.lat, lon: p.lon });
  }
  return o;
}

export function meal(meal, name, name_ko, food_id, price_krw_pp, note, extra = {}) {
  const o = { meal, name, name_ko, food_id: food_id || null, price_krw_pp, note, ...extra };
  if (food_id) {
    const f = CATALOG.food[food_id];
    if (!f) throw new Error(`unknown food_id ${food_id}`);
    if (o.lat == null && f.lat != null) Object.assign(o, { lat: f.lat, lon: f.lon });
  }
  return o;
}
