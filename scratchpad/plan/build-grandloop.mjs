// Build option-grandloop.json (Seoul · Seorak · Coast train · Gyeongju · Busan).
// Reuses Seoul days 17-18 and Sokcho day 19 from the foliage option, Busan days 23-25 and the Ragung/Busan stays from classic.
// Run after build-classic.mjs and build-foliage.mjs.
import fs from "node:fs";
import { computeBudget, fillTotals, checkNights, item, meal } from "./lib.mjs";

const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), "utf8"));
const classic = read("./option-classic.json");
const foliage = read("./option-foliage.json");
const clone = (o) => JSON.parse(JSON.stringify(o));
const dayOf = (opt, date) => clone(opt.days.find((d) => d.date === date));
const stayOf = (opt, stop) => clone(opt.stays.find((s) => s.stop === stop));

const SORANO = { lat: 38.1965, lon: 128.539 };
const RAGUNG = { lat: 35.8287, lon: 129.2853 };

// --- Seoul (foliage days 17-18) ---
const d17 = dayOf(foliage, "2026-10-17");
const d18 = dayOf(foliage, "2026-10-18");

// --- Mon 19: as foliage, but suitcases travel with you, and the evening is Cheoksan + crab so Tuesday can end at Waterpia ---
const d19 = dayOf(foliage, "2026-10-19");
d19.summary = "A Monday-morning bus across the Taebaek range (weekends can take twice as long), lunch in Abai Village, the hand-pulled raft across the harbor to Sokcho's market, then the Seorak gate, an outdoor hot-spring soak at Cheoksan and red snow crab by the harbor. Your bags travel with you from here on.";
d19.items[0].detail = "Bring everything: this loop doesn't come back to Seoul until the last afternoon. With three large suitcases, book a Kakao T 'Venti' or large taxi. Or subway: Line 5 to Dongdaemun History & Culture Park, then Line 2 to Gangbyeon, about 35 min.";
d19.items = d19.items.slice(0, 5).concat([
  item("14:45", "16:15", "rest", "Check in, slow afternoon", null, "The condo has a kitchen and a balcony toward the ridge. Rest after the early start.", { ...SORANO }),
  item("16:30", "18:00", "spa", "Cheoksan Hot Spring", "cheoksan-hot-spring", "A 53°C alkaline spring piped to single-sex baths with an outdoor pool in the pines: the most onsen-like soak in Gangwon. Nude, as in Japan; towels provided. 5 minutes by taxi from Sorano.", { cost_krw_pp: 11000 }),
  item("18:30", "20:00", "food", "Red snow crab at Dongmyeong Port", null, "Pick red snow crab (hongge) from the tanks; they steam it and finish with fried rice in the shell.", { lat: 38.2125, lon: 128.5985 }),
  item("20:00", "20:30", "walk", "Yeonggeumjeong rock pavilion", "yeonggeumjeong-lighthouse", "A footbridge pavilion over the surf rocks next to the crab restaurants, lit at night. Taxi back to Sorano after."),
]);
d19.food = [
  meal("lunch", "Dancheon Sikdang (Abai Village)", "단천식당", "dancheon-sikdang", 15000, "Ojingeo sundae and Abai sundae, the refugee village's own recipes."),
  meal("snack", "Manseok Dakgangjeong", "만석닭강정", "manseok-dakgangjeong", 8000, "Buy a box for Tuesday night too: it is famously good cold."),
  meal("dinner", "Red snow crab, Dongmyeong Port", "동명항 홍게", "dongmyeong-red-crab", 40000, "Autumn crab season; agree the price by weight before they cook it."),
];
d19.rainy_swap = "The bus and Abai Village work in drizzle (the raft runs in rain). Hot springs are even better in the rain.";

// --- Tue 20: Seorak morning, Naksansa at golden hour, Waterpia night spa ---
const d20 = {
  date: "2026-10-20", dow: "Tue", base: "Sokcho / Seoraksan",
  title: "Seoraksan at peak, then a sea-cliff temple at golden hour",
  summary: "The first cable car up to Gwongeumseong and the near-flat Biseondae valley under peak foliage, Sinheungsa's bronze Buddha, then down to the coast for Naksansa's cliff pavilions in late-afternoon light, and Waterpia's outdoor hot-spring pools to finish.",
  autumn_note: "Seoraksan's valleys are forecast at peak Oct 20-27 (Korea Forest Service whole-mountain peak: Oct 20). Sunset over the East Sea side is early (about 17:40), so Naksansa's light is best from 16:00.",
  items: [
    item("07:30", "07:45", "transport", "Taxi to Sogongwon (park entrance)", "seoraksan-sogongwon-sinheungsa", "Ask the front desk to book it the night before.", { cost_krw_pp: 3500, cost_note: "counted in local transit" }),
    item("07:50", "10:00", "sight", "Seorak cable car to Gwongeumseong", "seorak-cable-car", "Tickets are same-day only and printed with a boarding time, so be at the office as it opens (about 08:00-08:30; check sorakcablecar.co.kr). Walk 10 minutes from the top station to the bare-rock fortress summit with Ulsanbawi and the Dinosaur Ridge around you.", { cost_krw_pp: 16000, tip: "If your boarding time is hours away, walk to Biseondae first." }),
    item("10:15", "13:00", "walk", "Sogongwon → Biseondae valley walk", "biseondae-geumganggul", "A near-flat 3 km riverside path to Biseondae's sheer granite walls under the maples. Strong walkers can add the steep stairs to Geumganggul cave (about 1 h return)."),
    item("13:00", "13:45", "food", "Lunch at the Sogongwon restaurant row", null, "Mountain-vegetable bibimbap and potato pancakes by the park entrance.", { lat: 38.1735, lon: 128.4905 }),
    item("13:45", "14:20", "sight", "Sinheungsa and the bronze Buddha", "seoraksan-sogongwon-sinheungsa", "A temple founded in 652 at the trailhead, with a 14.6 m bronze 'Unification Buddha'."),
    item("14:30", "15:05", "transport", "Taxi to Naksansa", null, "About ₩25,000 for the car.", { cost_krw_pp: 8400, lat: 38.1246, lon: 128.6281 }),
    item("15:05", "17:15", "sight", "Naksansa: Uisangdae and Hongnyeonam", "naksansa", "A temple founded in 671 on a headland. Walk out to Uisangdae, a six-sided pavilion on a pine cliff over the sea, and down to Hongnyeonam, a hermitage built over a sea cave where a hole in the floor shows the waves. Much was rebuilt after a 2005 wildfire; the setting is the point."),
    item("17:20", "17:50", "transport", "Taxi back to Sorano", null, "About ₩25,000 for the car.", { cost_krw_pp: 8400, ...SORANO }),
    item("18:00", "20:30", "spa", "Seorak Waterpia night spa", "seorak-waterpia", "Outdoor hot-spring pools under the ridge after a long day on your feet. Swimsuits on. Night spa 18:00-20:30, last entry 20:00.", { cost_krw_pp: 27000, cost_note: "included in the sweet-tier ALL INCLUSIVE rate" }),
    item("20:40", "21:30", "food", "Dakgangjeong and beer in the condo", null, "Yesterday's market chicken, cold, with convenience-store beer.", { ...SORANO }),
  ],
  food: [
    meal("lunch", "Seorak-dong sanchae bibimbap", "설악동 산채비빔밥", null, 15000, "Mountain greens over rice, plus a pajeon to share.", { lat: 38.1735, lon: 128.4905 }),
    meal("dinner", "Manseok Dakgangjeong (bought Monday)", "만석닭강정", "manseok-dakgangjeong", 0, "Already paid for; add ramyeon from the convenience store."),
  ],
  rainy_swap: "Wind stops the cable car and cloud hides the ridges. If Tuesday is a washout, do Naksansa and Abai Village in the rain and keep Waterpia; Wednesday's early bus means Seorak can't move, so accept the loss or ride the cable car on Wednesday at opening and take the 14:56 coast train instead (then Gyeongju is night sights only).",
  stay_stop: "sokcho",
};

// --- Wed 21: bus to Gangneung, KTX-Eum down the coast, Gyeongju afternoon, Ragung night ---
const d21 = {
  date: "2026-10-21", dow: "Wed", base: "Gyeongju",
  title: "Down the new coast line to the Silla capital, a private hot-spring night",
  summary: "An early bus to Gangneung, then KTX-Eum 752 south on the new Donghae line with the East Sea out the left window. Bags to Ragung, an afternoon among Gyeongju's royal tombs and Gyochon's lanes, Wolji Pond as its pavilions light up, then your own outdoor hot-spring bath.",
  autumn_note: "Gyeongju's tomb mounds turn golden and the silver grass at Cheomseongdae is out; tree color is early (Gyeongju peaks in early Nov). Sunset about 17:45.",
  items: [
    item("07:00", "07:20", "transport", "Check out, taxi to Sokcho Intercity Bus Terminal", null, "Downtown terminal by the market (not the express terminal you arrived at).", { cost_krw_pp: 5000, cost_note: "counted in local transit", lat: 38.2097, lon: 128.5917 }),
    item("07:30", "08:30", "transport", "Intercity bus Sokcho → Gangneung", null, "Frequent coastal buses, about 1 hour.", { cost_krw_pp: 8400, booking: "Buy at the terminal or on the T-money Bus app", lat: 37.7647, lon: 128.8835 }),
    item("08:40", "09:00", "transport", "Taxi to Gangneung Station", null, "Short hop. Buy coffee and gimbap for the train.", { cost_krw_pp: 1500, cost_note: "counted in local transit", lat: 37.7642, lon: 128.8996 }),
    item("09:36", "12:30", "transport", "KTX-Eum 752 Gangneung → Gyeongju", null, "One of only three trains a day on the new Donghae coast line. Sit on the left (east) side: the sea runs alongside between Jeongdongjin and Samcheok.", { cost_krw_pp: 34300, booking: "Korail+ app or korail.com; book now (the 3-a-day trains sell out)", lat: 35.7983, lon: 129.1389 }),
    item("12:30", "13:00", "transport", "Taxi to Ragung, drop bags", "ragung", "About 25 minutes across town; Ragung holds bags before check-in.", { cost_krw_pp: 8400, cost_note: "counted in local transit" }),
    item("13:15", "14:00", "food", "Late lunch in Gyochon", "woljeonggyo-gyochon", "Egg-strand gimbap at Gyori Gimbap, by the Choi family house."),
    item("14:00", "15:30", "walk", "Gyochon, Woljeonggyo bridge and Gyerim grove", "woljeonggyo-gyochon", "The rebuilt Silla-era covered bridge over the river, the hanok lanes of the Choi clan's village, and the ancient woods of Gyerim."),
    item("15:30", "16:45", "sight", "Cheomseongdae and Daereungwon tombs", "daereungwon-cheonmachong", "Asia's oldest surviving observatory, then a walk among the 23 grassy royal mounds; Cheonmachong is the one you can enter, with replicas of the gold crown found inside.", { cost_krw_pp: 3000, cost_note: "admission may now be free; check at the gate" }),
    item("16:45", "17:15", "food", "Hwangnam bread and coffee on Hwangridan-gil", "hwangridan-gil", "Buy a box of Hwangnam-ppang for tomorrow's breakfast: Ragung serves none."),
    item("17:15", "18:30", "night", "Donggung Palace & Wolji Pond at dusk", "donggung-wolji", "The Silla crown prince's palace and pond; the pavilions light up around sunset and reflect perfectly in still water.", { cost_krw_pp: 3000 }),
    item("18:45", "19:45", "food", "Ssambap dinner", null, "Lettuce-wrap sets with 20-plus side dishes on the street south of Daereungwon.", { lat: 35.836, lon: 129.2125 }),
    item("20:00", "22:00", "spa", "Ragung: your own outdoor hot-spring bath", "ragung", "Check in to a hanok suite around a walled courtyard and soak in your private outdoor hot-spring tub under the night sky. This is the trip's Izu-ryokan night."),
  ],
  food: [
    meal("lunch", "Gyori Gimbap", "교리김밥", "gyori-gimbap", 6000, "Gimbap packed with thin-sliced egg; a Gyeongju classic."),
    meal("snack", "Hwangnam Bread (main shop)", "황남빵 본점", "hwangnam-bread", 5000, "Thin pastry, lots of red bean; buy extra for breakfast."),
    meal("dinner", "Ssambap Street (Daereungwon south)", "쌈밥거리", "gyeongju-ssambap", 18000, "Pick any busy shop; it's a set menu for the table."),
  ],
  rainy_swap: "The train and the bath don't care about rain. Swap the tomb walk for the Gyeongju National Museum (free, indoors) and keep Wolji: wet stone reflects the lights even better.",
  stay_stop: "gyeongju",
};

// --- Thu 22: Bulguksa at opening, Seokguram, then Busan's east coast ---
const d22 = {
  date: "2026-10-22", dow: "Thu", base: "Busan",
  title: "Bulguksa at nine, the Busan coast by sunset",
  summary: "A dawn soak, then Bulguksa before the school groups and the Seokguram stone Buddha. An afternoon train drops you on Busan's Haeundae side for Haedong Yonggungsa on its sea rocks and the pastel Sky Capsule along the old shore railway at sunset.",
  autumn_note: "Bulguksa's maples by the stone bridges show partial color (forecast peak late Oct to early Nov). Busan stays green; the draw is the clear sea air. Sunset about 17:45.",
  items: [
    item("07:00", "08:15", "spa", "Dawn bath at Ragung", "ragung", "One more soak, with Hwangnam bread and drip coffee in the room."),
    item("08:30", "08:45", "transport", "Taxi to Bulguksa (bags stay at Ragung)", null, "About ₩12,000 for the car.", { lat: 35.7903, lon: 129.332 }),
    item("08:45", "10:15", "sight", "Bulguksa", "bulguksa", "Korea's best-known temple (UNESCO): stone bridges called Blue Cloud and White Cloud, and the twin pagodas Dabotap and Seokgatap in the main courtyard. Arrive before the school buses."),
    item("10:25", "11:30", "sight", "Seokguram Grotto", "seokguram", "An 8th-century granite Buddha in an artificial cave temple, seen through glass. Shuttle bus 12 from Bulguksa or a 15-minute taxi up the mountain road."),
    item("11:30", "12:15", "transport", "Taxi to Ragung, collect bags", null, "About 20 minutes back down.", { ...RAGUNG }),
    item("12:15", "13:15", "food", "Lunch in Bomun", null, "Hanu beef gukbap or a Korean set meal near the lake.", { lat: 35.8365, lon: 129.2848 }),
    item("13:30", "14:00", "transport", "Taxi to Gyeongju Station", null, "About 25 minutes.", { lat: 35.7983, lon: 129.1389 }),
    item("14:16", "15:10", "transport", "KTX-Eum 707 Gyeongju → Sinhaeundae", null, "Lands on the Haeundae side of Busan.", { cost_krw_pp: 10900, booking: "Korail+ / korail.com (Oct 7-13 timetable; confirm)", lat: 35.181, lon: 129.177 }),
    item("15:10", "15:40", "transport", "Taxi to the hotel, drop bags", null, "Paradise (Haeundae) for the sweet tier, Aqua Palace (Gwangalli) for value.", { lat: 35.1597, lon: 129.164 }),
    item("15:50", "16:50", "sight", "Haedong Yonggungsa seaside temple", "haedong-yonggungsa", "A temple built onto the sea rocks, reached down 108 steps, with waves breaking under the halls."),
    item("17:00", "17:20", "walk", "Cheongsapo twin lighthouses", "cheongsapo", "The red and white lighthouses at the end of the breakwater in the golden hour."),
    item("17:25", "18:00", "sight", "Sky Capsule Cheongsapo → Mipo at sunset", "blueline-park-sky-capsule", "Your own pastel pod creeps along the old coastal railway, 7-10 m above the shore, for 30 minutes into Haeundae.", { cost_krw_pp: 18334, cost_note: "₩55,000 per 3-person capsule", booking: "Blueline Park site or Klook; book a late slot" }),
    item("18:15", "21:30", "spa", "Haeundae evening and hot spring", "paradise-hotel-busan", "Bokguk dinner, then Paradise's Cimer sea-view hot spring (sweet and splurge tiers). Value tier: Spa Land Centum (₩26,000, 4 h) instead."),
  ],
  food: [
    meal("lunch", "Bomun hanu gukbap", "보문 한우국밥", null, 12000, "Beef and radish soup with rice; quick before the train.", { lat: 35.8365, lon: 129.2848 }),
    meal("dinner", "Geumsu Bokguk (Haeundae flagship)", "금수복국 해운대본점", "geumsu-bokguk", 18000, "Clear pufferfish soup, a Busan hangover classic since 1970."),
  ],
  rainy_swap: "Bulguksa and Seokguram are fine in drizzle. In Busan the capsule runs in normal rain; in a storm swap it for Spa Land Centum and keep Haedong Yonggungsa if the sea is safe.",
  stay_stop: "busan-1",
};

// --- Busan days from classic; omakase moves to Saturday lunch ---
const d23 = dayOf(classic, "2026-10-23");
const d24 = dayOf(classic, "2026-10-24");
const lunch = d24.items.findIndex((i) => i.title.startsWith("Pork gukbap"));
d24.items[lunch] = item("12:00", "13:30", "food", "Omakase lunch at Iwa, Haeundae", null, "Aged-fish sushi omakase by a Michelin-selected counter: the trip's sushi moment. 20 minutes by taxi from Igidae, then 30 minutes on to Dongnae.", { booking: "Phone +82 10-8543-3356; ask your hotel to call. Book now.", lat: 35.1606, lon: 129.163 });
d24.items[lunch + 1] = { ...d24.items[lunch + 1], time: "14:15", end: "16:45" };
d24.summary = "The Igidae cliff boardwalk in the cool morning, an omakase lunch in Haeundae, an afternoon soak in Korea's largest hot-spring bathhouse, then raw fish facing Gwangan Bridge and the Saturday drone show from the beach outside your hotel.";
d24.food = d24.food.filter((f) => f.meal !== "lunch").concat(meal("lunch", "Iwa (sushi omakase)", "이와", "iwa-busan", 80000, "Aged-fish nigiri, lunch course; confirm the closed day when booking."));
const d25 = dayOf(classic, "2026-10-25");

const days = [d17, d18, d19, d20, d21, d22, d23, d24, d25];

const stays = fillTotals([
  stayOf(foliage, "seoul-1"),
  stayOf(foliage, "sokcho"),
  { ...stayOf(classic, "gyeongju-2"), stop: "gyeongju" },
  stayOf(classic, "busan-1"),
  stayOf(classic, "busan-2"),
]);
stays[0].why_area = "Walking distance to Jongmyo, Changdeokgung, Ikseon-dong and Gwangjang Market, with Line 5 to Dong Seoul for Monday's bus.";
checkNights(stays);

const transport = [
  { date: "2026-10-17", from: "Incheon Airport T1", to: "4rest Stay Jongno", mode: "taxi", dep: "06:30", arr: "07:40", duration: "1h10", cost_krw_pp: 25000, booking: "Taxi rank outside arrivals, or Kakao T", note: "About ₩65,000-80,000 for the car including tolls, split 3 ways." },
  { date: "2026-10-19", from: "Dong Seoul Bus Terminal", to: "Sokcho Express Bus Terminal", mode: "bus", dep: "08:20", arr: "10:36", duration: "2h16", cost_krw_pp: 22800, booking: "kobus.co.kr or the T-money Bus app (foreign Visa/Mastercard accepted); a few days ahead", note: "Deluxe after the Oct 1 2026 fare rise. Weekday departures avoid the weekend foliage jams. Suitcases go in the hold." },
  { date: "2026-10-20", from: "Sinheungsa (Seorak)", to: "Naksansa", mode: "taxi", dep: "14:30", arr: "15:05", duration: "35 min", cost_krw_pp: 8400, booking: "Kakao T", note: "About ₩25,000 for the car." },
  { date: "2026-10-20", from: "Naksansa", to: "Hanwha Resort Seorak Sorano", mode: "taxi", dep: "17:20", arr: "17:50", duration: "30 min", cost_krw_pp: 8400, booking: "Kakao T", note: "About ₩25,000 for the car." },
  { date: "2026-10-21", from: "Sokcho Intercity Bus Terminal", to: "Gangneung Bus Terminal", mode: "bus", dep: "07:30", arr: "08:30", duration: "about 1h", cost_krw_pp: 8400, booking: "Terminal counter or T-money Bus app", note: "Frequent departures; any bus before about 08:00 makes the 09:36 train." },
  { date: "2026-10-21", from: "Gangneung Station", to: "Gyeongju Station", mode: "KTX-Eum", dep: "09:36", arr: "12:30", duration: "2h54", cost_krw_pp: 34300, booking: "Korail+ app or korail.com. Train 752; only 3 a day (09:36, 14:56, 18:35). Book now.", note: "The new Donghae coast line; sit on the left (east) side for the sea between Jeongdongjin and Samcheok. If you miss it, the 14:56 arrives 17:44: do Wolji at night only." },
  { date: "2026-10-22", from: "Gyeongju Station", to: "Sinhaeundae Station (Busan)", mode: "KTX-Eum", dep: "14:16", arr: "15:10", duration: "54 min", cost_krw_pp: 10900, booking: "Korail+ / korail.com. KTX-Eum 707 (Oct 7-13 timetable; confirm).", note: "Backup: ITX-Maeum 1841 12:03 → 13:21 if you skip Seokguram." },
  { date: "2026-10-25", from: "Busan Station", to: "Seoul Station", mode: "KTX", dep: "13:03", arr: "15:47", duration: "2h44", cost_krw_pp: 54400, booking: "Korail+ / korail.com. Sunday trains sell out: book now.", note: "Backups: KTX 36 12:34 → 15:00, KTX 124 13:17 → 16:34. Don't go later than about 14:30." },
  { date: "2026-10-25", from: "Seoul Station", to: "Incheon Airport T1", mode: "AREX", dep: "16:10", arr: "16:53", duration: "43 min", cost_krw_pp: 13000, booking: "Seoul Station B2 AREX machines, or Klook/Trip.com vouchers (about ₩11,000)", note: "Air Premia can't use Seoul Station city check-in, so take your bags." },
];

const activities = [
  { date: "2026-10-17", what: "Jongmyo Shrine (Saturday free-roaming)", cost_krw_pp: 1000 },
  { date: "2026-10-17", what: "Changgyeonggung Mulbit Yeonhwa night show (includes admission)", cost_krw_pp: 1000 },
  { date: "2026-10-18", what: "Changdeokgung + Huwon (Secret Garden) guided tour", cost_krw_pp: 8000 },
  { date: "2026-10-19", what: "Gaetbae hand-pulled ferry, Abai Village (round trip, cash)", cost_krw_pp: 1000 },
  { date: "2026-10-19", what: "Cheoksan Hot Spring public baths", cost_krw_pp: 11000 },
  { date: "2026-10-20", what: "Seorak cable car to Gwongeumseong (round trip)", cost_krw_pp: 16000 },
  { date: "2026-10-20", what: "Seorak Waterpia night spa (sweet tier: covered by the ALL INCLUSIVE rate)", cost_krw_pp: 27000 },
  { date: "2026-10-21", what: "Daereungwon / Cheonmachong tomb", cost_krw_pp: 3000 },
  { date: "2026-10-21", what: "Donggung Palace & Wolji Pond", cost_krw_pp: 3000 },
  { date: "2026-10-22", what: "Blueline Park Sky Capsule, Cheongsapo → Mipo (₩55,000 per 3-person capsule)", cost_krw_pp: 18334 },
  { date: "2026-10-24", what: "Hurshimchung hot-spring bath (weekend rate)", cost_krw_pp: 18000 },
];

const budget = computeBudget({
  stays, transport, activities, localTransitPP: 125000,
  notes: [
    "Lodging is for 3 people sharing one room each night (two Ragung suites on the splurge tier), 8 core nights Oct 17-24. The Oct 16 night is shown separately.",
    "Seoul and Busan prices are live Booking.com / official-site checks from Oct 6 2026, taxes included. Sorano and Ragung prices are live Korean-OTA rates (Yanolja / NOL), which may need a Korean phone; Agoda or Trip.com can cost 5-15% more.",
    "Busan Fri-Sat has no sweet tier: Planet16 is the only live 2-night room on the drone-show beach. The splurge pick (Ananti Cove) puts the splurge total well over US$1,000.",
    "Intercity transport covers the airport taxi share, two buses, two coast taxis, two KTX-Eum trains, the Busan-Seoul KTX and the AREX. Taxi fares are split 3 ways.",
    "Local transit (about 125,000 per person) covers Seoul subway rides and about 25 taxi rides in Sokcho, Gyeongju and Busan, split 3 ways. With big suitcases, large taxis cost about 20% more.",
    "Food is excluded. Typical spend is 50,000-80,000 per person per day, plus Iwa's omakase lunch (about 80,000) and the Sokcho crab dinner (about 40,000).",
  ],
});

const option = {
  id: "grandloop",
  name: "Seoul · Seorak · Coast Train · Gyeongju · Busan",
  tagline: "Everything in nine days: peak foliage in the mountains, a coast-line train, the Silla capital's one hot-spring night, and Busan.",
  recommended: false,
  summary: "The greatest hits at speed. Two Seoul days, two at Seoraksan for the peak foliage and hot springs, the new Donghae coast train down to Gyeongju for one evening and a private hot-spring bath, then three days in Busan. It has the most variety of any option and the most packing and unpacking: five hotels in eight nights. It suits travelers with light bags who would rather see more than linger.",
  design_notes: [
    "Seoul days 17-18 match the foliage option (Jongmyo on Saturday's free-roaming day, Secret Garden and the car-free Jamsu Bridge on Sunday). Gyeongbokgung, Hongdae and the Haneul Park silver grass don't fit.",
    "Mon 19 evening uses Cheoksan's hot spring and the crab dinner, so Tuesday can add Naksansa after the mountain and end at Waterpia's night spa.",
    "Wed 21 takes the intercity bus Sokcho → Gangneung (there's no rail to Sokcho) to catch KTX-Eum 752 at 09:36, one of only three daily trains on the new coast line.",
    "Gyeongju is a single night because Ragung, the private hot-spring hanok, only has rooms on Wed Oct 21.",
    "Thu 22 uses the 14:16 KTX-Eum so Bulguksa and Seokguram fit in the morning; the Sky Capsule ride moves to sunset.",
    "The omakase moves to Saturday lunch at Iwa in Haeundae, between Igidae and Hurshimchung. Busan days and stays otherwise match the classic option.",
  ],
  route: [
    { base: "Seoul", nights: 2, from: "2026-10-17", to: "2026-10-19", lat: 37.5745, lon: 126.9925 },
    { base: "Sokcho / Seoraksan", nights: 2, from: "2026-10-19", to: "2026-10-21", lat: 38.1965, lon: 128.539 },
    { base: "Gyeongju", nights: 1, from: "2026-10-21", to: "2026-10-22", lat: 35.8287, lon: 129.2853 },
    { base: "Busan", nights: 3, from: "2026-10-22", to: "2026-10-25", lat: 35.1545, lon: 129.1183 },
  ],
  pace: "packed",
  hotel_changes: 4,
  scores: { culture: 5, history: 4, nature: 5, city: 3, food: 5, autumn: 5, ease: 2 },
  japan_matches: [
    { japan: "Kamakura", korea: "Two coasts in three days: Naksansa's cliff pavilions over the East Sea at golden hour, the KTX-Eum down the new Donghae line with the sea out the left window, then Busan's Haedong Yonggungsa and the Sky Capsule along the old shore railway.", date: "2026-10-21", honest_note: "The coast train is a fast intercity KTX-Eum, not a little Enoden, and the sea views come in stretches between tunnels." },
    { japan: "Shibuya", korea: "Gwangjang Market and Jongno's tent bars on night one, then Busan's Gwangalli on Saturday night: the lit bridge, the drone show and the bars along the beach.", date: "2026-10-24", honest_note: "Only two Seoul nights, both in old Jongno, so Hongdae and Gangnam's neon are skipped. This is the weakest Shibuya match of the four options." },
    { japan: "Izu ryokan", korea: "Ragung's hanok suite with a private outdoor hot-spring bath (Wed 21), plus Cheoksan's outdoor bath in the pines, Waterpia, Paradise's Cimer (sweet tier) and Hurshimchung.", date: "2026-10-21", honest_note: "Ragung serves no meals, and you arrive after dark and leave after breakfast-time sightseeing; it's one short night." },
    { japan: "Sushi omakase", korea: "Iwa's aged-fish omakase lunch in Haeundae, plus red snow crab in Sokcho and Jagalchi's pick-your-fish raw fish.", date: "2026-10-24", honest_note: "Iwa is Japanese-style sushi by Korean chefs; the crab and market meals are louder, cheaper and more Korean." },
  ],
  highlights: [
    "Seoraksan at its peak on a weekday: first cable car up, then the Biseondae valley",
    "Naksansa's sea-cliff pavilions in the late-afternoon light",
    "The new Donghae coast line from Gangneung to Gyeongju, sea out the window",
    "Wolji Pond at dusk, then a private outdoor hot-spring bath at Ragung",
    "Bulguksa at 09:00, Haedong Yonggungsa and the Sky Capsule the same afternoon",
    "Hot springs four ways: Cheoksan, Waterpia, Ragung, Hurshimchung",
    "Jagalchi, Gamcheon and the Saturday drone show from your hotel's beach",
  ],
  tradeoffs: [
    "Five hotels in eight nights, with check-ins Mon, Wed, Thu and Fri. Pack carry-on size; three big suitcases need a large taxi for every hop.",
    "Only two Seoul days, both in old Jongno: no Gyeongbokgung, Hongdae or Haneul Park silver grass.",
    "Gyeongju gets one afternoon and one morning; the museum, Yangdong village and a slow Gyochon are skipped.",
    "Wednesday is a long transfer day (taxi, bus, 3 h train, then sights), and the Gangwon days depend on the weather.",
  ],
  days,
  stays,
  transport,
  activities_paid: activities,
  budget,
  book_now: [
    { what: "Ragung suite for Wed Oct 21 (5 rooms left on Oct 6)", when: "now", how: "NOL World (English, world.nol.com, NC-11074) or Yanolja; free cancellation until Oct 14, 17:00", priority: "critical" },
    { what: "KTX-Eum 752 Gangneung → Gyeongju, Wed Oct 21, 09:36", when: "now (only 3 trains a day)", how: "Korail+ app or korail.com with a foreign card", priority: "critical" },
    { what: "4rest Stay Jongno, Oct 16-19 (1 Deluxe Suite left)", when: "now", how: "Booking.com; the refundable rate cancels free before Oct 9", priority: "critical" },
    { what: "Hanwha Resort Seorak Sorano, Oct 19-21 (ALL INCLUSIVE rate for the sweet tier)", when: "now", how: "mom-mom.net / yeogi.com, or hanwharesort.co.kr; Agoda as fallback", priority: "critical" },
    { what: "Gwangalli-Planet16 Fri-Sat Oct 23-25 (2-night minimum)", when: "now", how: "Booking.com; free cancellation before Oct 20", priority: "critical" },
    { what: "Busan Thu Oct 22: Paradise Special Deal (sweet) or Aqua Palace (value)", when: "now", how: "busanparadisehotel.co.kr (Korean UI, foreign cards OK) or Booking.com", priority: "high" },
    { what: "Huwon (Secret Garden) tickets for Sun Oct 18, 10:00-11:00 slot", when: "Mon Oct 12, 10:00 KST (Sun Oct 11, 21:00 New York time)", how: "Changdeokgung official reservation site; sells out in minutes. A few on-site tickets go on sale at 09:00.", priority: "critical" },
    { what: "KTX-Eum 707 Gyeongju → Sinhaeundae (Thu 22) and KTX Busan → Seoul (Sun 25)", when: "now (Sunday trains sell out)", how: "Korail+ app or korail.com", priority: "high" },
    { what: "Dong Seoul → Sokcho bus, Mon Oct 19, 08:20 (deluxe)", when: "a few days ahead", how: "kobus.co.kr or the T-money Bus app", priority: "normal" },
    { what: "Iwa omakase lunch, Sat Oct 24 around 12:00", when: "now", how: "Phone +82 10-8543-3356 (open daily 11:30-22:00); ask your hotel to call, or check CatchTable Global", priority: "high" },
    { what: "Blueline Sky Capsule, Thu Oct 22, Cheongsapo → Mipo around 17:25", when: "a week ahead", how: "Blueline Park website or Klook (₩55,000 per capsule)", priority: "high" },
    { what: "Changgyeonggung Mulbit Yeonhwa, Sat Oct 17, 19:00 or 19:30", when: "now", how: "Ticketlink or Creatrip (₩1,000 each)", priority: "normal" },
    { what: "Korea e-Arrival Card for all 3 travelers", when: "Oct 14-16 (within 3 days before landing)", how: "e-arrivalcard.go.kr only (free; US citizens are K-ETA-exempt through Dec 31 2026)", priority: "critical" },
  ],
  watch_outs: [
    "The 09:36 coast train on Wed 21 is the hinge of the trip. Take a bus that reaches Gangneung by 08:45; if you miss the train, the 14:56 arrives at 17:44 and Gyeongju becomes night sights only.",
    "Seorak cable car tickets are same-day only and the car stops in high wind. Gwongeumseong and Seonjae-gil are 5-10°C colder than the coast: bring a windproof layer and gloves.",
    "Luggage moves 4 times. Confirm each hotel will hold bags before check-in and after check-out, and use Kakao T's large taxis (Venti) with big suitcases.",
    "Ragung has no breakfast (drip coffee only): buy Hwangnam bread on Wednesday afternoon.",
    "Gyeongju weekdays are school-trip season: be at Bulguksa by 08:45.",
    "The Gwangalli drone show is cancelled in rain or strong wind.",
    "Air Premia can't use Seoul Station city check-in; ride the AREX with your bags and reach T1 by about 17:00.",
  ],
};

fs.writeFileSync(new URL("./option-grandloop.json", import.meta.url), JSON.stringify(option, null, 1));
console.log("grandloop", budget.per_person_usd, budget.per_person_usd_with_oct16, { transport: budget.transport_krw_pp, activities: budget.activities_krw_pp, lodging: budget.lodging_krw_total });
