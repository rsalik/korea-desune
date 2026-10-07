// Build option-classic.json (Seoul · Gyeongju · Busan) and compute its budget from the stay and cost tables below.
import fs from "node:fs";

const FX = 1340;
const OUT = new URL("./option-classic.json", import.meta.url);

// Per-night prices for all 3 people, by tier. Seoul figures are the live Oct 16-21 totals divided by 5.
const SEOUL = { value: 295128, sweet: 347228, splurge: 422219 };
const GYEONGJU_TUE = { value: 170050, sweet: 215000, splurge: 291000 };
const RAGUNG_WED = { value: 200000, sweet: 225000, splurge: 295000 };
const BUSAN_THU = { value: 207000, sweet: 532400, splurge: 592900 };
const BUSAN_FRI_SAT_TOTAL = { value: 403434, sweet: 403434, splurge: 403434 };

const transport = [
  { date: "2026-10-17", from: "Incheon Airport T1", to: "4rest Stay / hotel in Jongno", mode: "taxi", dep: "06:40", arr: "07:45", duration: "~1h05", cost_krw_pp: 25000, booking: "Taxi rank outside arrivals (regular orange/white taxi), or Kakao T. Pay by card.", note: "About 70,000-80,000 KRW per car including ~7,000 tolls, split 3 ways. Door to door with luggage at dawn beats AREX + transfer. Budget option: AREX all-stop train 4,750 pp to Seoul Station then a short taxi." },
  { date: "2026-10-20", from: "Seoul Station", to: "Gyeongju Station (ex-Singyeongju)", mode: "KTX", dep: "09:33", arr: "11:49", duration: "2h16", cost_krw_pp: 44000, booking: "Korail+ app or korail.com (English). On sale now; book today. Train KTX-Sancheon 23 (Oct 7-13 timetable; confirm for Oct 20).", note: "Backups: KTX 121 08:12→10:58 or KTX 25 09:58→12:11 (44,500)." },
  { date: "2026-10-22", from: "Gyeongju Station", to: "Sinhaeundae Station (Busan)", mode: "ITX-Maeum", dep: "10:43", arr: "12:00", duration: "1h17", cost_krw_pp: 8700, booking: "Korail+ / korail.com. ITX-Maeum 1601 (Oct 7-13 timetable; confirm).", note: "Lands right on the Haeundae side, so no cross-city slog from Busan Station. Backups: ITX-Maeum 1841 12:03→13:21, KTX-Eum 707 14:16→15:10 (10,900), or KTX to Busan Station (10,100, 30 min) then a 30-min taxi." },
  { date: "2026-10-25", from: "Busan Station", to: "Seoul Station", mode: "KTX", dep: "13:03", arr: "15:47", duration: "2h44", cost_krw_pp: 54400, booking: "Korail+ / korail.com. KTX-Sancheon 38 (Oct 7-13 timetable; Sunday trains sell out, book now).", note: "Backups: KTX-Cheongryong 36 12:34→15:00, KTX 124 13:17→16:34." },
  { date: "2026-10-25", from: "Seoul Station", to: "Incheon Airport T1", mode: "AREX", dep: "16:10", arr: "16:53", duration: "43 min", cost_krw_pp: 13000, booking: "Machines/counter at Seoul Station B2 AREX concourse; Klook/Trip.com vouchers ~11,000.", note: "Air Premia can't use Seoul Station city check-in, so carry bags through. At T1 by ~17:00 for the 21:55 flight; check-in usually opens 3 h before. Confirm Air Premia's terminal (T1 assumed)." },
];

const activities_paid = [
  { date: "2026-10-17", what: "Haneul Park 'Maengkkongi' electric cart up the hill (optional; or climb 291 steps free)", cost_krw_pp: 3000 },
  { date: "2026-10-18", what: "Changdeokgung + Huwon (Secret Garden) guided tour", cost_krw_pp: 8000 },
  { date: "2026-10-18", what: "Changgyeonggung 'Mulbit Yeonhwa' night media-art show (includes admission)", cost_krw_pp: 1000 },
  { date: "2026-10-19", what: "Hanbok rental, basic 4 h (makes Gyeongbokgung free)", cost_krw_pp: 25000 },
  { date: "2026-10-20", what: "Daereungwon / Cheonmachong tomb", cost_krw_pp: 3000 },
  { date: "2026-10-20", what: "Donggung Palace & Wolji Pond at night", cost_krw_pp: 3000 },
  { date: "2026-10-22", what: "Blueline Park Sky Capsule, Cheongsapo → Mipo (55,000 per 3-person capsule)", cost_krw_pp: 18334 },
  { date: "2026-10-24", what: "Hurshimchung hot-spring bath (weekend rate)", cost_krw_pp: 18000 },
];

// Local subway/bus plus taxis split 3 ways, estimated leg by leg (see budget notes).
const LOCAL_TRANSIT_PP = 140000;

const transportPP = transport.reduce((sum, leg) => sum + leg.cost_krw_pp, 0);
const activitiesPP = activities_paid.reduce((sum, a) => sum + a.cost_krw_pp, 0);

function lodgingTotal(tier) {
  return SEOUL[tier] * 3 + GYEONGJU_TUE[tier] + RAGUNG_WED[tier] + BUSAN_THU[tier] + BUSAN_FRI_SAT_TOTAL[tier];
}

function perPersonUsd(lodging) {
  return Math.round((lodging / 3 + transportPP + LOCAL_TRANSIT_PP + activitiesPP) / FX);
}

const tiers = ["value", "sweet", "splurge"];
const lodging_krw_total = Object.fromEntries(tiers.map((t) => [t, lodgingTotal(t)]));
const oct16_extra_krw = { ...SEOUL };
const per_person_usd = Object.fromEntries(tiers.map((t) => [t, perPersonUsd(lodging_krw_total[t])]));
const per_person_usd_with_oct16 = Object.fromEntries(
  tiers.map((t) => [t, perPersonUsd(lodging_krw_total[t] + oct16_extra_krw[t])])
);

const days = JSON.parse(fs.readFileSync(new URL("./classic-days.json", import.meta.url), "utf8"));
const meta = JSON.parse(fs.readFileSync(new URL("./classic-meta.json", import.meta.url), "utf8"));

const option = {
  ...meta.head,
  days,
  stays: meta.stays,
  transport,
  activities_paid,
  budget: {
    fx: FX,
    lodging_krw_total,
    oct16_extra_krw,
    transport_krw_pp: transportPP,
    local_transit_krw_pp: LOCAL_TRANSIT_PP,
    activities_krw_pp: activitiesPP,
    per_person_usd,
    per_person_usd_with_oct16,
    notes: meta.budget_notes,
  },
  book_now: meta.book_now,
  watch_outs: meta.watch_outs,
};

fs.writeFileSync(OUT, JSON.stringify(option, null, 2));
console.log({ transportPP, activitiesPP, lodging_krw_total, per_person_usd, per_person_usd_with_oct16 });
