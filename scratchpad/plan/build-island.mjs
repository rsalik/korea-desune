// Build option-island.json (Seoul · Jeju · Busan). Reuses classic's Seoul days 17-19, Busan pieces and stays.
// Run after build-classic.mjs.
import fs from "node:fs";
import { computeBudget, fillTotals, checkNights, item, meal } from "./lib.mjs";

const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const classic = read("./option-classic.json");
const clone = (o) => JSON.parse(JSON.stringify(o));
const dayOf = (date) => clone(classic.days.find((d) => d.date === date));
const stayOf = (stop) => clone(classic.stays.find((s) => s.stop === stop));
const retime = (it, time, end) => ({ ...it, time, end });

const JEJU_AIRPORT = { lat: 33.5104, lon: 126.4914 };

const d20 = {
  date: "2026-10-20", dow: "Tue", base: "Jeju",
  title: "Fly to the volcano island: sea cliffs, a carbonated soak, silver grass at sunset",
  summary: "A one-hour flight from Gimpo, a rental car, and west Jeju: the layered sea cliffs at Yongmeori under Sanbangsan's lava dome, a soak in Sanbangsan's carbonated hot spring, then up Saebyeol Oreum, a volcanic cone covered in silver grass, for sunset.",
  autumn_note: "Silver grass (eoksae) on Jeju's oreum is at its prime mid-October to early November. Tangerines are still greenish. Sunset about 17:56.",
  items: [
    item("07:30", "08:20", "transport", "Subway to Gimpo Airport", null, "Line 5 from Jongno 3-ga runs straight to Gimpo Airport, about 45 minutes with no transfer (₩1,550). Taxi with bags: about ₩35,000 for the car.", { lat: 37.5587, lon: 126.7945 }),
    item("09:30", "10:45", "transport", "Flight Gimpo → Jeju", null, "About 110 flights a day. Domestic check-in closes 30-40 min before departure; passport as ID.", { cost_krw_pp: 70000, booking: "Korean Air, Asiana, Jeju Air or Jin Air sites; book now (Sports Festival week)", ...JEJU_AIRPORT }),
    item("11:00", "11:45", "transport", "Pick up the rental car", null, "Shuttle from the airport to the rental-car house. Bring your passport, US license and the physical AAA International Driving Permit. Take full-coverage insurance.", { cost_krw_pp: 120000, cost_note: "3 days incl. insurance and fuel, split 3 ways (estimate)", ...JEJU_AIRPORT }),
    item("12:00", "13:00", "food", "Gogi-guksu lunch in Jeju City", null, "Jeju's pork-broth noodle soup with thick slices of pork, 10 minutes from the airport.", { lat: 33.508, lon: 126.5325 }),
    item("13:00", "14:00", "transport", "Drive to Sanbangsan", null, "About an hour southwest across the island.", { lat: 33.2314, lon: 126.3142 }),
    item("14:00", "15:30", "sight", "Yongmeori coast and Sanbangsan", "sanbangsan-yongmeori", "A walk at the foot of sandstone cliffs layered like a dragon's head, below the bell-shaped lava dome of Sanbangsan. Yongmeori opens only when tide and waves allow (last entry 16:30); check the sign at the gate.", { cost_krw_pp: 2500 }),
    item("15:40", "16:50", "spa", "Sanbangsan Carbonated Hot Spring", "sanbangsan-hot-spring", "Cool carbonated spring water indoors and warm outdoor pools facing Sanbangsan. Swimsuits for the outdoor section.", { cost_krw_pp: 19000, cost_note: "indoor ₩14,000 + outdoor ₩5,000" }),
    item("17:10", "18:10", "walk", "Saebyeol Oreum silver grass at sunset", "saebyeol-oreum", "A steep 20-30 minute climb up a grass-covered volcanic cone; at the top the silver grass glows against the sunset over the western sea. Windy: bring a layer."),
    item("18:15", "19:00", "transport", "Drive to Seogwipo", null, "About 40 minutes to the hotel area.", { lat: 33.2485, lon: 126.5593 }),
    item("19:00", "20:30", "food", "Galchi dinner at Negeori Sikdang", null, "Hairtail braised in spicy sauce or grilled whole: Seogwipo's signature.", { lat: 33.2485, lon: 126.5593 }),
  ],
  food: [
    meal("lunch", "Jamae Guksu", "자매국수", "jamae-guksu", 12000, "Gogi-guksu with a rich pork broth; a local favorite near the airport."),
    meal("dinner", "Negeori Sikdang", "네거리식당", "negeori-sikdang", 25000, "Galchi jorim (braised hairtail) for the table."),
  ],
  rainy_swap: "Yongmeori closes in big waves anyway. In rain, spend longer in the hot spring and swap Saebyeol for ARTE Museum Jeju (indoor media art, about ₩18,000) on the way back.",
  stay_stop: "jeju",
};

const d21 = {
  date: "2026-10-21", dow: "Wed", base: "Jeju",
  title: "Hallasan's alpine plateau, then the south-coast cliffs and falls",
  summary: "A morning hike up Hallasan's Yeongsil trail past a crown of rock pinnacles to the high plateau, then the south coast: Jusangjeolli's hexagonal basalt columns, Olle trail 7 along the cliffs to Oedolgae, and Seogwipo's market for dinner.",
  autumn_note: "Hallasan's upper slopes show early color (its peak is about Nov 6-13); the plateau is golden with dwarf bamboo and grass. It is 8-10°C colder up top.",
  items: [
    item("07:30", "08:10", "transport", "Drive to the Yeongsil trailhead", null, "The upper car park is small and fills early; arrive by about 08:00.", { lat: 33.3481, lon: 126.4964 }),
    item("08:15", "12:00", "walk", "Hallasan Yeongsil trail to Witse-oreum", "hallasan-yeongsil-trail", "The most scenic route on Hallasan: steep stairs past the Yeongsil Giam pinnacles and the Byeongpungbawi cliff, then a flat boardwalk across the alpine plateau to the Witse-oreum shelter. About 3.7 km each way. No booking needed (summit routes need one; this isn't a summit route).", { tip: "Not hikers? Spend the morning at Camellia Hill or the O'sulloc tea fields instead." }),
    item("12:30", "13:30", "food", "Lunch in Jungmun", null, "Abalone porridge or seafood ramyeon near the resort area.", { lat: 33.2502, lon: 126.4125 }),
    item("13:45", "14:30", "sight", "Jusangjeolli cliffs", "jusangjeolli-daepo", "Hexagonal basalt columns where lava met the sea, with waves crashing up the pillars.", { cost_krw_pp: 2000 }),
    item("15:00", "16:45", "walk", "Olle trail 7: Oedolgae cliffs", "olle-route-7-oedolgae", "The most loved section of Jeju's coastal trail: pine-topped cliffs, a 20 m sea stack (Oedolgae) and views to the offshore islets."),
    item("17:00", "18:15", "walk", "Saeyeon Bridge and Cheonjiyeon Falls", "cheonjiyeon-saeyeongyo", "The sail-shaped footbridge to Saeseom islet at sunset, then the waterfall in its lit gorge after dark.", { cost_krw_pp: 2000 }),
    item("18:30", "20:00", "food", "Seogwipo Maeil Olle Market", "seogwipo-maeil-olle-market", "Graze: sashimi platters, black-pork skewers, tangerine juice, and hotteok."),
  ],
  food: [
    meal("lunch", "Abalone porridge in Jungmun", "중문 전복죽", null, 15000, "Green-tinted porridge cooked with abalone innards; a Jeju staple.", { lat: 33.2502, lon: 126.4125 }),
    meal("dinner", "Seogwipo Maeil Olle Market grazing", "서귀포매일올레시장", null, 20000, "Buy a takeaway sashimi box and black-pork skewers; eat in the market's seating areas.", { lat: 33.2502, lon: 126.5636 }),
  ],
  rainy_swap: "Hallasan trails close in heavy rain or strong wind. Swap the hike for the Jeju Stone Park or ARTE Museum, and keep the coast for the afternoon if it clears.",
  stay_stop: "jeju",
};

const d22 = {
  date: "2026-10-22", dow: "Thu", base: "Jeju",
  title: "Sunrise Peak, a morning on Udo, and a rolling crater at dusk",
  summary: "Climb Seongsan Ilchulbong, the tuff-cone crater rising from the sea, then a 15-minute ferry to Udo for a loop by e-bike past white-sand beaches. Abalone lunch on the east coast, the ancient nutmeg forest at Bijarim, and Yongnuni Oreum's soft green-gold ridges for sunset.",
  autumn_note: "Yongnuni's silver grass and the low autumn light make the crater ridges glow. Sunrise about 06:39 (optional), sunset about 17:54.",
  items: [
    item("07:00", "08:00", "transport", "Drive east to Seongsan", null, "About an hour from Seogwipo. For sunrise on the summit, leave at 05:20 instead.", { lat: 33.4585, lon: 126.942 }),
    item("08:00", "09:30", "sight", "Seongsan Ilchulbong (Sunrise Peak)", "seongsan-ilchulbong", "A 20-30 minute stair climb up a 5,000-year-old tuff cone to the rim of a crater 600 m across, with the sea on three sides.", { cost_krw_pp: 5000, tip: "The haenyeo (women divers) have historically performed at the beach below the peak's west side at 13:30 and 15:00; check on the day." }),
    item("09:45", "12:45", "sight", "Udo island", "udo-island", "Ferry from Seongsan port (15 min, every 30 min; the car stays behind). Rent e-bikes to loop the island: Hagosu-dong beach, Seobin white sand made of red algae, and peanut ice cream.", { cost_krw_pp: 21000, cost_note: "ferry ₩11,000 + e-bike about ₩10,000 (estimate)" }),
    item("13:15", "14:15", "food", "Abalone lunch on the east coast", null, "Abalone hot-pot rice at Myeongjin Jeonbok, run by a haenyeo family.", { lat: 33.5325, lon: 126.8501 }),
    item("14:40", "15:40", "walk", "Bijarim forest", "bijarim", "Thousands of 500-800-year-old nutmeg yews on a soft red-volcanic-scoria path.", { cost_krw_pp: 3000 }),
    item("16:30", "17:55", "walk", "Yongnuni Oreum at sunset", "yongnuni-oreum", "A gentle 30-minute climb to a triple crater rim of grass and silver grass, with Seongsan and the sea on the horizon."),
    item("18:00", "19:00", "transport", "Drive back to Seogwipo", null, "About 50 minutes.", { lat: 33.2485, lon: 126.5593 }),
    item("19:15", "20:45", "food", "Jeju black pork BBQ", null, "Thick-cut heukdwaeji grilled over charcoal, dipped in anchovy sauce.", { lat: 33.2502, lon: 126.5636 }),
  ],
  food: [
    meal("lunch", "Myeongjin Jeonbok", "명진전복", "myeongjin-jeonbok", 18000, "Jeonbok dolsotbap (abalone stone-pot rice); queue or use the waitlist tablet."),
    meal("dinner", "Jeju black pork BBQ (Seogwipo)", "서귀포 흑돼지", null, 30000, "Order ogyeopsal (skin-on belly) and moksal (neck)."),
  ],
  rainy_swap: "Udo ferries stop in strong wind. Instead: the Haenyeo Museum (open Thursdays), Bijarim, and Seongsan if the rain allows, then an early dinner.",
  stay_stop: "jeju",
};

const d23 = {
  date: "2026-10-23", dow: "Fri", base: "Busan",
  title: "Over the mountain to the airport, an omakase lunch, the Busan coast",
  summary: "A last drive across Hallasan's forested flank, an hour's flight to Busan, then the best of its east coast on a weekday: an omakase lunch in Haeundae, Haedong Yonggungsa on its sea rocks, and the pastel Sky Capsule along the old shore railway at golden hour.",
  autumn_note: "Today is 상강 (Sanggang), 'frost descent', the last solar term of autumn. Busan stays green; the draw is the clear sea air. Sunset about 17:46.",
  items: [
    item("07:30", "09:00", "transport", "Drive the 5.16 road to the airport", "saryeoni-forest", "Route 1131 climbs through Hallasan's forest past the Saryeoni cedar woods; stop for 20 minutes if there's time. Refuel before returning the car.", { lat: 33.4235, lon: 126.6333 }),
    item("09:00", "09:30", "transport", "Return the rental car", null, "Shuttle back to the terminal.", { ...JEJU_AIRPORT }),
    item("10:30", "11:25", "transport", "Flight Jeju → Busan", null, "Many daily flights (Korean Air, Jin Air, Jeju Air, Air Busan).", { cost_krw_pp: 60000, booking: "Airline sites; book now", lat: 35.1795, lon: 128.9382 }),
    item("11:45", "12:20", "transport", "Taxi to Gwangalli-Planet16, drop bags", "gwangalli-planet16", "About ₩30,000 for the car.", { cost_krw_pp: 10000 }),
    item("12:45", "14:15", "food", "Omakase lunch at Iwa, Haeundae", null, "Aged-fish sushi omakase at a Michelin-selected counter: the trip's sushi moment.", { booking: "Phone +82 10-8543-3356; ask your hotel to call. Book now.", lat: 35.1606, lon: 129.163 }),
    item("14:30", "15:30", "sight", "Haedong Yonggungsa seaside temple", "haedong-yonggungsa", "A temple built onto the sea rocks, reached down 108 steps, with waves breaking under the halls."),
    item("15:45", "16:25", "walk", "Cheongsapo twin lighthouses", "cheongsapo", "The red and white lighthouses on the breakwater, and the clear-floored Daritdol Skywalk."),
    item("16:30", "17:05", "sight", "Sky Capsule Cheongsapo → Mipo", "blueline-park-sky-capsule", "Your own pastel pod creeps along the old coastal railway above the shore for 30 minutes into Haeundae.", { cost_krw_pp: 18334, cost_note: "₩55,000 per 3-person capsule", booking: "Blueline Park site or Klook; weekdays are easier" }),
    item("17:10", "18:00", "walk", "Haeundae Beach at sunset", null, "Walk the length of the beach toward Dongbaek Island.", { lat: 35.1587, lon: 129.1604 }),
    item("18:15", "19:30", "food", "Light dinner in Haeundae", null, "Pufferfish soup at Geumsu Bokguk after the big lunch.", { lat: 35.1606, lon: 129.1616 }),
  ],
  food: [
    meal("lunch", "Iwa (sushi omakase)", "이와", "iwa-busan", 80000, "Aged-fish nigiri, lunch course; confirm the closed day when booking."),
    meal("dinner", "Geumsu Bokguk (Haeundae flagship)", "금수복국 해운대본점", "geumsu-bokguk", 18000, "Clear pufferfish soup, a Busan classic since 1970."),
  ],
  rainy_swap: "Flights rarely cancel in ordinary rain. In Busan the capsule runs in normal rain; in a storm swap it for Spa Land Centum and keep Haedong Yonggungsa if the sea is safe.",
  stay_stop: "busan",
};

// Sat 24: classic Friday's west-Busan morning + classic Saturday's hot spring, raw fish and drone show.
const c23 = dayOf("2026-10-23");
const c24 = dayOf("2026-10-24");
const d24 = {
  date: "2026-10-24", dow: "Sat", base: "Busan",
  title: "Painted hills, the fish market, a hot-spring soak, drones over the bridge",
  summary: "Gamcheon's pastel hillside early, lunch upstairs at Jagalchi on fish you pick yourselves, an afternoon in Korea's largest hot-spring bathhouse, then raw fish facing Gwangan Bridge and the Saturday drone show from the beach outside your hotel.",
  autumn_note: "Jeon-eo (gizzard shad) and galchi are the autumn picks at Jagalchi. Drone show theme Oct 24: 'Forest's Melody'.",
  items: [
    retime(c23.items.find((i) => i.place_id === "gamcheon-culture-village"), "09:00", "10:45"),
    retime(c23.items.find((i) => i.place_id === "jagalchi-market"), "11:00", "12:30"),
    retime(c23.items.find((i) => i.place_id === "biff-square-gukje-market"), "12:30", "13:15"),
    retime(c24.items.find((i) => i.place_id === "hurshimchung"), "14:00", "16:45"),
    c24.items.find((i) => i.place_id === "gwangalli-beach"),
    c24.items.find((i) => i.place_id === "gwangalli-drone-show"),
  ],
  food: [
    c23.food.find((f) => f.meal === "lunch"),
    meal("snack", "BIFF Square ssiat hotteok", "BIFF광장 씨앗호떡", "biff-ssiat-hotteok", 2500, "Fried pancake stuffed with brown sugar and seeds."),
    c24.food.find((f) => f.meal === "dinner"),
  ],
  rainy_swap: "Jagalchi and Gukje Market are covered and Hurshimchung is indoors. If the drone show is cancelled, watch the bridge lights from a Gwangalli bar.",
  stay_stop: "busan",
};
if (d24.items.some((i) => !i) || d24.food.some((f) => !f)) throw new Error("island Sat 24: a reused classic item is missing");

const d25 = dayOf("2026-10-25");
d25.stay_stop = "busan";

const days = [dayOf("2026-10-17"), dayOf("2026-10-18"), dayOf("2026-10-19"), d20, d21, d22, d23, d24, d25];

const stays = fillTotals([
  stayOf("seoul-1"),
  {
    stop: "jeju", base: "Jeju", area: "Seogwipo / Jungmun (south coast)",
    check_in: "2026-10-20", check_out: "2026-10-23", nights: 3, includes_oct16: false,
    why_area: "The south coast is the middle of the island: about 40-60 minutes to the west, the east and the airport, and walking distance to the Olle trail and Seogwipo's market.",
    choices: [
      { tier: "value", lodging_id: "kensington-seogwipo", name: "Kensington Resort Seogwipo", room: "Condo-style family room with ondol floor bedding and a kitchen", price_krw_per_night: 150000, price_basis: "Estimate: HotelsCombined snapshot (Oct 2026) ₩99,451-140,738 for 2 guests; 3 adults in Sports Festival week likely about ₩150,000", availability: "unverified (not live-checked)", why: "Cheap, roomy and central, with an outdoor pool; older resort-condo feel." },
      { tier: "sweet", lodging_id: "grand-josun-jeju", name: "Grand Josun Jeju", room: "Deluxe with 2 queen beds", price_krw_per_night: 280000, price_basis: "Estimate: HotelsCombined snapshot from ₩213,041 (Deluxe, Oct 11-12); festival week likely higher", availability: "unverified (not live-checked)", why: "A polished Jungmun resort with indoor and outdoor pools and a sauna, rated 9.2." },
      { tier: "splurge", lodging_id: "podo-hotel", name: "Pinx Podo Hotel", room: "Korean-style family room: ondol floor bedding, rafters, hanji windows; natural hot-spring water in the bath", price_krw_per_night: 480000, price_basis: "Estimate: HotelsCombined snapshot ₩384,758-547,748 a night; a 3rd adult may cost extra", availability: "unverified (not live-checked)", why: "Itami Jun's building modeled on oreum and thatched houses, with 42°C hot-spring water in every room: Jeju's answer to the Izu ryokan. 20 min from Jungmun; needs the car." },
    ],
  },
  { ...stayOf("busan-2"), stop: "busan" },
]);
checkNights(stays);

const transport = [
  { date: "2026-10-17", from: "Incheon Airport T1", to: "Jongno hotel", mode: "taxi", dep: "06:40", arr: "07:45", duration: "~1h05", cost_krw_pp: 25000, booking: "Taxi rank outside arrivals, or Kakao T", note: "About ₩70,000-80,000 for the car with tolls, split 3 ways." },
  { date: "2026-10-20", from: "Gimpo Airport (GMP)", to: "Jeju Airport (CJU)", mode: "flight", dep: "09:30", arr: "10:45", duration: "1h15", cost_krw_pp: 70000, booking: "Korean Air, Asiana, Jeju Air or Jin Air; book now (Sports Festival week, Oct 16-22)", note: "Line 5 from Jongno 3-ga reaches Gimpo in about 45 min. Low-cost carriers allow 15 kg checked; check your bag size." },
  { date: "2026-10-20", from: "Jeju Airport rental-car house", to: "Jeju Airport (return Fri 23)", mode: "car", dep: "11:00", arr: "09:30", duration: "3 days", cost_krw_pp: 120000, booking: "Lotte Rent-a-Car (English site) or SK Rent-a-Car; full-coverage insurance", note: "Estimate: about ₩300,000 for a compact SUV for 3 days with full insurance plus about ₩60,000 fuel, split 3 ways. Needs a physical International Driving Permit (AAA). No IDP: 8-hour taxi tours cost about ₩180,000 per car per day." },
  { date: "2026-10-23", from: "Jeju Airport (CJU)", to: "Busan Gimhae (PUS)", mode: "flight", dep: "10:30", arr: "11:25", duration: "55 min", cost_krw_pp: 60000, booking: "Korean Air, Jin Air, Jeju Air or Air Busan", note: "Fares from about ₩49,000; budget ₩50,000-90,000." },
  { date: "2026-10-23", from: "Busan Gimhae Airport", to: "Gwangalli-Planet16", mode: "taxi", dep: "11:45", arr: "12:20", duration: "35 min", cost_krw_pp: 10000, booking: "Taxi rank or Kakao T", note: "About ₩30,000 for the car." },
  { date: "2026-10-25", from: "Busan Station", to: "Seoul Station", mode: "KTX", dep: "13:03", arr: "15:47", duration: "2h44", cost_krw_pp: 54400, booking: "Korail+ / korail.com. Sunday trains sell out: book now.", note: "Backups: KTX 36 12:34 → 15:00, KTX 124 13:17 → 16:34." },
  { date: "2026-10-25", from: "Seoul Station", to: "Incheon Airport T1", mode: "AREX", dep: "16:10", arr: "16:53", duration: "43 min", cost_krw_pp: 13000, booking: "Seoul Station B2 AREX machines, or Klook/Trip.com vouchers (about ₩11,000)", note: "Air Premia can't use Seoul Station city check-in, so take your bags." },
];

const activities = [
  ...classic.activities_paid.filter((a) => a.date <= "2026-10-19"),
  { date: "2026-10-20", what: "Sanbangsan & Yongmeori coast", cost_krw_pp: 2500 },
  { date: "2026-10-20", what: "Sanbangsan Carbonated Hot Spring (indoor + outdoor)", cost_krw_pp: 19000 },
  { date: "2026-10-21", what: "Jusangjeolli cliffs", cost_krw_pp: 2000 },
  { date: "2026-10-21", what: "Cheonjiyeon Falls", cost_krw_pp: 2000 },
  { date: "2026-10-22", what: "Seongsan Ilchulbong", cost_krw_pp: 5000 },
  { date: "2026-10-22", what: "Udo ferry round trip + e-bike (estimate)", cost_krw_pp: 21000 },
  { date: "2026-10-22", what: "Bijarim forest", cost_krw_pp: 3000 },
  { date: "2026-10-23", what: "Blueline Park Sky Capsule, Cheongsapo → Mipo (₩55,000 per 3-person capsule)", cost_krw_pp: 18334 },
  { date: "2026-10-24", what: "Hurshimchung hot-spring bath (weekend rate)", cost_krw_pp: 18000 },
];

const budget = computeBudget({
  stays, transport, activities, localTransitPP: 95000,
  notes: [
    "Lodging is for 3 people sharing one room each night, 8 core nights Oct 17-24. The Oct 16 night is shown separately.",
    "Seoul and Busan prices are live checks from Oct 6 2026 (taxes included). Jeju prices are estimates from Oct 2026 price snapshots, not live availability: the Sports Festival (Oct 16-22) makes that week tight.",
    "Busan has no sweet tier: Planet16 is the only live Fri-Sat room on the drone-show beach. The splurge pick (Ananti Cove) puts the splurge total well over US$1,000.",
    "Intercity transport covers the airport taxi share, two domestic flights, the Jeju rental car with insurance and fuel (estimate), the Gimhae taxi, the Busan-Seoul KTX and the AREX.",
    "Local transit (about 95,000 per person) covers Seoul and Busan subway rides and taxis, split 3 ways, plus Jeju parking.",
    "Food is excluded. Typical spend is 50,000-80,000 per person per day, plus Iwa's omakase lunch (about 80,000).",
  ],
});

const option = {
  id: "island",
  name: "Seoul · Jeju · Busan",
  tagline: "Seoul's palaces, then a volcanic island of silver-grass craters, sea cliffs and divers' seafood, finishing on Busan's coast.",
  recommended: false,
  summary: "Three full Seoul days, then three on Jeju with a car: oreum craters covered in silver grass, Hallasan's alpine plateau, Olle-trail sea cliffs, Sunrise Peak and Udo. Busan gets a day and a half for its seaside temple, the sky capsule, the fish market and the drone show. It suits travelers who want open landscape and coast more than temples and tombs, and are happy to drive.",
  design_notes: [
    "Seoul days 17-19 are the classic option's (Gyeongbokgung on Monday because it closes on Tuesday).",
    "Jeju is one base on the south coast for three nights instead of hopping around the island; the east day (Seongsan, Udo) is the long drive.",
    "Tue 20 flies from Gimpo (Line 5 from Jongno, no transfer). Jeju → Busan on Fri 23 avoids backtracking to Seoul.",
    "Seongsan sunrise is optional (05:20 departure); the default plan climbs at 08:00 and reaches Udo before the tour groups.",
    "Busan Fri-Sat uses Gwangalli-Planet16 (2-night minimum, live-checked), which fits this route exactly. The omakase is Friday lunch at Iwa on the way in from the airport.",
    "Jeju hotels were not live-checked; prices are estimates. Check them first, because the National Sports Festival fills the island Oct 16-22.",
  ],
  route: [
    { base: "Seoul", nights: 3, from: "2026-10-17", to: "2026-10-20", lat: 37.5745, lon: 126.9925 },
    { base: "Jeju", nights: 3, from: "2026-10-20", to: "2026-10-23", lat: 33.2502, lon: 126.5636 },
    { base: "Busan", nights: 2, from: "2026-10-23", to: "2026-10-25", lat: 35.1545, lon: 129.1183 },
  ],
  pace: "balanced",
  hotel_changes: 2,
  scores: { culture: 3, history: 3, nature: 5, city: 4, food: 4, autumn: 4, ease: 3 },
  japan_matches: [
    { japan: "Kamakura", korea: "Busan's east coast on Friday: Haedong Yonggungsa on its sea rocks, Cheongsapo's lighthouses and the Sky Capsule on the old shore railway. Jeju adds Olle trail 7's sea cliffs and Seogwipo's small-town harbor.", date: "2026-10-23", honest_note: "Jeju is volcanic and rural, with no old temple town; the temple-by-the-sea moment comes in Busan." },
    { japan: "Shibuya", korea: "Saturday night in Mangwon and Hongdae, Monday in Euljiro's back-alley bars, Gwangjang Market, and the Gwangalli drone show on Saturday in Busan.", date: "2026-10-17", honest_note: "There's no scramble crossing; Myeongdong and Gangnam have the bigger-neon look if you want it." },
    { japan: "Izu ryokan", korea: "Sanbangsan's carbonated hot spring under the lava dome (Tue 20) and Hurshimchung in Busan (Sat 24). Splurge tier: the Pinx Podo Hotel, with hot-spring water in every room.", date: "2026-10-20", honest_note: "Below the splurge tier there's no ryokan-style night on this route; the soaks are public bathhouses." },
    { japan: "Sushi omakase", korea: "Iwa's aged-fish omakase lunch in Haeundae, plus haenyeo-caught abalone on Jeju and Jagalchi's pick-your-fish raw fish.", date: "2026-10-23", honest_note: "Iwa is Japanese-style sushi by Korean chefs; the Jeju seafood is homestyle, not a counter." },
  ],
  highlights: [
    "Three Seoul days: Secret Garden, Gyeongbokgung in hanbok, Haneul Park's silver grass",
    "Saebyeol Oreum's silver-grass ridge at sunset after a carbonated hot-spring soak",
    "Hallasan's Yeongsil trail to the alpine plateau, then Olle trail 7's sea cliffs",
    "Seongsan Ilchulbong and a morning by e-bike on Udo",
    "Iwa's omakase lunch, Haedong Yonggungsa and the Sky Capsule in Busan",
    "Jagalchi, Gamcheon, Hurshimchung and the Saturday drone show",
  ],
  tradeoffs: [
    "No peak foliage: Hallasan peaks in early November. Silver grass on the oreum is the autumn show.",
    "Jeju's National Sports Festival (Oct 16-22) overlaps your Jeju nights: hotels and cars are tight and pricier, and the Jeju prices here are estimates.",
    "Driving: a rental car needs a physical International Driving Permit from AAA before you fly (same day at an AAA office, about US$20). Without one, 8-hour taxi tours cost about ₩180,000 per car per day.",
    "Two domestic flights and more weather risk: Udo ferries, Yongmeori and Hallasan trails close in wind or rain.",
    "No Gyeongju: history is the Seoul palaces and the National Museum.",
  ],
  days,
  stays,
  transport,
  activities_paid: activities,
  budget,
  book_now: [
    { what: "Jeju hotel Oct 20-23 (Sports Festival week)", when: "now", how: "Agoda, Booking.com or the hotel sites; prefer free cancellation", priority: "critical" },
    { what: "International Driving Permit for the driver(s)", when: "this week, before you fly", how: "Any AAA office, same day: application, 2 passport photos, US license, about US$20", priority: "critical" },
    { what: "Jeju rental car Oct 20-23 with full-coverage insurance", when: "now", how: "Lotte Rent-a-Car (English site) or SK Rent-a-Car; Klook as fallback", priority: "critical" },
    { what: "Flights Gimpo → Jeju (Tue 20, about 09:30) and Jeju → Busan (Fri 23, about 10:30)", when: "now", how: "Airline sites (Korean Air, Jeju Air, Jin Air, Air Busan)", priority: "critical" },
    { what: "Seoul hotel Oct 16-20 (4rest Stay Jongno: 1 Deluxe Suite left)", when: "now", how: "Booking.com; the refundable rate cancels free until Oct 9", priority: "critical" },
    { what: "Gwangalli-Planet16 Fri-Sat Oct 23-25 (2-night minimum)", when: "now", how: "Booking.com; free cancellation before Oct 20", priority: "critical" },
    { what: "Huwon (Secret Garden) tickets for Sun Oct 18, 09:30-10:30 slot", when: "Mon Oct 12, 10:00 KST (Sun Oct 11, 21:00 New York time)", how: "Changdeokgung official reservation site; sells out in minutes", priority: "critical" },
    { what: "KTX Busan → Seoul, Sun Oct 25, 13:03", when: "now (Sunday trains sell out)", how: "Korail+ app or korail.com", priority: "high" },
    { what: "Iwa omakase lunch, Fri Oct 23 around 12:45", when: "now", how: "Phone +82 10-8543-3356 (open daily 11:30-22:00); ask your hotel to call, or check CatchTable Global", priority: "high" },
    { what: "Blueline Sky Capsule, Fri Oct 23, Cheongsapo → Mipo around 16:30", when: "a week ahead", how: "Blueline Park website or Klook (₩55,000 per capsule)", priority: "high" },
    { what: "Changgyeonggung Mulbit Yeonhwa, Sun Oct 18, 19:00 slot", when: "now", how: "Ticketlink or Creatrip (₩1,000 each)", priority: "normal" },
    { what: "Korea e-Arrival Card for all 3 travelers", when: "Oct 14-16 (within 3 days before landing)", how: "e-arrivalcard.go.kr only (free; US citizens are K-ETA-exempt through Dec 31 2026)", priority: "critical" },
  ],
  watch_outs: [
    "Without a physical IDP you can't rent a car on Jeju; a photo or a digital copy isn't accepted.",
    "Jeju weather: Udo ferries stop in strong wind, Yongmeori opens only when tide and waves allow, and Hallasan trails close in heavy rain. Have the indoor swaps ready.",
    "Seoul closures: Mon Oct 19 Changdeokgung, Changgyeonggung and Deoksugung; the plan puts Gyeongbokgung on Monday because it closes Tuesday.",
    "Low-cost domestic flights allow 15 kg checked; overweight fees are charged at the counter.",
    "The Gwangalli drone show is cancelled in rain or strong wind.",
    "Air Premia can't use Seoul Station city check-in; ride the AREX with your bags and reach T1 by about 17:00.",
  ],
};

fs.writeFileSync(new URL("./option-island.json", import.meta.url), JSON.stringify(option, null, 1));
console.log("island", budget.per_person_usd, budget.per_person_usd_with_oct16, { transport: budget.transport_krw_pp, activities: budget.activities_krw_pp, lodging: budget.lodging_krw_total });
