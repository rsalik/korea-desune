// Build option-classic.json (Seoul · Gyeongju · Busan): days from classic-days.json, budget computed from the stays below.
import fs from "node:fs";
import { computeBudget, fillTotals, checkNights } from "./lib.mjs";

const days = JSON.parse(fs.readFileSync(new URL("./classic-days.json", import.meta.url), "utf8"));

const stays = fillTotals([
  {
    stop: "seoul-1", base: "Seoul", area: "Jongno (Anguk / Jongno 3-ga)",
    check_in: "2026-10-16", check_out: "2026-10-20", nights: 4, includes_oct16: true,
    why_area: "Walking distance to Changdeokgung, Bukchon, Ikseon-dong, Insadong and Gwangjang Market, with subway Lines 1, 3 and 5 for everything else.",
    choices: [
      { tier: "value", lodging_id: "4rest-stay-jongno", name: "4rest Stay Jongno", room: "Deluxe Suite: 1 twin + 1 full bed (max 3), breakfast included", price_krw_per_night: 340000, price_basis: "Live Booking.com Oct 6: 1,475,638 with tax for Oct 16-21 (5 nights) and 1,201,323 for Oct 16-19 (3 weekend nights), non-refundable. 4 nights (Fri-Mon) should land near 1.36M.", availability: "available (live Oct 6) · 1 Deluxe Suite left", why: "Cheapest live room with a real bed for each of you, breakfast included, 3 minutes from Jongmyo and Ikseon-dong." },
      { tier: "sweet", lodging_id: "nine-tree-dongdaemun", name: "Nine Tree by Parnas Dongdaemun", room: "Family Room: twin + full bed, 1 room", price_krw_per_night: 347228, price_basis: "Live Booking.com Oct 6: 1,736,141 with tax for Oct 16-21 (5 nights), free cancellation until Oct 13, no prepayment", availability: "partly sold out · a later Oct 6 search found no rooms for Oct 16-19", why: "Free cancellation and a proper family room, two subway stops from Jongno. Recheck: it may be gone for the weekend." },
      { tier: "splurge", lodging_id: "the-prima-jongno", name: "The Prima Hotel Jongno Insadong", room: "Deluxe Twin 23 m² (1 twin + 1 full, max 3), buffet breakfast", price_krw_per_night: 520000, price_basis: "Live Booking.com Oct 6: 1,707,889 with tax for Oct 16-19 (3 weekend nights) and 2,111,093 for Oct 16-21; 4 nights estimated at about 2.08M", availability: "available (live Oct 6)", why: "Full-service hotel by Jogyesa with more room and free cancellation until Oct 13." },
    ],
  },
  {
    stop: "gyeongju-1", base: "Gyeongju", area: "Bomun Lake resort area",
    check_in: "2026-10-20", check_out: "2026-10-21", nights: 1, includes_oct16: false,
    why_area: "Every downtown hanok was sold out for Oct 20. Bomun is a 15-minute taxi from the tombs and 1.7 km from Ragung, so Wednesday's move is a 5-minute hop.",
    choices: [
      { tier: "value", lodging_id: "commodore-gyeongju", name: "Commodore Hotel Gyeongju", room: "Deluxe Triple: 2 singles + 1 double, no 3rd-person fee", price_krw_per_night: 170050, price_basis: "Live Yanolja Oct 6 ('Oct 20 from 170,050'), room only", availability: "available (live Oct 6)", why: "A bed each for the least money, on the lake road." },
      { tier: "sweet", lodging_id: "lahan-select-gyeongju", name: "Lahan Select Gyeongju", room: "Deluxe Twin Mountain View: 1 double + 1 single, base 3", price_krw_per_night: 215000, price_basis: "Live Yanolja Oct 6, room-only special for Oct 20 (Oct 21-22 sold out)", availability: "available (live Oct 6) · Oct 20 only", why: "The nicest renovated hotel on Bomun Lake at a fair price; walk the lake at night." },
      { tier: "splurge", lodging_id: "sono-calm-gyeongju", name: "Sono Calm Gyeongju", room: "Deluxe Suite A: 1 double + 1 single, base 3", price_krw_per_night: 291000, price_basis: "Live Yanolja Oct 6 ('Oct 20 from 291,000'), room only", availability: "available (live Oct 6)", why: "A suite with a separate living room and the resort's pool and spa." },
    ],
  },
  {
    stop: "gyeongju-2", base: "Gyeongju", area: "Bomun (Silla Millennium Park)",
    check_in: "2026-10-21", check_out: "2026-10-22", nights: 1, includes_oct16: false,
    why_area: "Ragung is the trip's ryokan night: hanok suites around walled courtyards, each with its own outdoor hot-spring bath. Wed Oct 21 is the only night it has rooms.",
    choices: [
      { tier: "value", lodging_id: "ragung", name: "Ragung (Silla Millennium Park hanok hotel)", room: "Madang or Numaru suite: 1 double bed + 1 floor futon, private outdoor hot-spring bath. 3rd adult +30,000 on site.", price_krw_per_night: 200000, price_basis: "Live Yanolja / NOL World Oct 6: 170,000 + 30,000 for the 3rd adult. Free cancellation until Oct 14, 17:00.", availability: "available (live Oct 6) · 2 left of each suite type, Wed only", why: "The closest thing in Korea to the Izu ryokan, for under US$50 each." },
      { tier: "sweet", lodging_id: "ragung", name: "Ragung, suite + extra bedding", room: "Same suite with a second futon set (+25,000, subject to stock), so nobody shares the double bed", price_krw_per_night: 225000, price_basis: "Live Yanolja Oct 6: 170,000 + 30,000 + 25,000", availability: "available (live Oct 6) · Wed only", why: "Worth the 25k so three adults each get their own bedding." },
      { tier: "splurge", lodging_id: "ragung", name: "Ragung, two suites", room: "One Madang + one Numaru suite (2 + 1), so two private hot-spring baths and real beds", price_krw_per_night: 340000, price_basis: "Live Yanolja Oct 6: 2 × 170,000, no 3rd-adult fee", availability: "available (live Oct 6) · Wed only", why: "Privacy and two outdoor baths; still cheaper than one night at most Busan hotels." },
    ],
  },
  {
    stop: "busan-1", base: "Busan", area: "Haeundae (sweet, splurge) or Gwangalli (value)",
    check_in: "2026-10-22", check_out: "2026-10-23", nights: 1, includes_oct16: false,
    why_area: "Paradise's Special Deal includes unlimited Cimer, its sea-view hot spring, but Paradise is sold out on Sat 24. The value pick is in Gwangalli across the street from Friday's hotel, so Friday's move is a walk.",
    choices: [
      { tier: "value", lodging_id: "hotel-aqua-palace", name: "Hotel Aqua Palace (Gwangalli)", room: "Family Ondol or Deluxe Twin (no view), sleeps 3", price_krw_per_night: 207000, price_basis: "Live Booking.com Oct 6: 188,182 + 10% tax; free cancellation before Oct 19", availability: "available (live Oct 6) · Thu only", why: "Cheap, on the beach, and 100 m from Planet16 for Fri-Sat. Use Spa Land Centum (26,000) for the hot-spring evening." },
      { tier: "sweet", lodging_id: "paradise-hotel-busan", name: "Paradise Hotel Busan (Special Deal)", room: "Deluxe City (main building) + 3rd adult; unlimited Cimer sea-view hot spring and ocean spa pool for all 3", price_krw_per_night: 532400, price_basis: "Live official site Oct 6: 459,800 + 72,600 for the 3rd adult, tax and service included. Free cancellation until 18:00 five days before.", availability: "available (live Oct 6) · Thu-Fri only, sold out Sat", why: "Haeundae beachfront with Busan's best hot spring included: the second ryokan-style evening." },
      { tier: "splurge", lodging_id: "paradise-hotel-busan", name: "Paradise Hotel Busan, ocean-view wing", room: "Deluxe Ocean (new wing, side sea view) + 3rd adult, Cimer included", price_krw_per_night: 592900, price_basis: "Live official site Oct 6: 520,300 + 72,600", availability: "available (live Oct 6)", why: "The same package with the sea outside the window." },
    ],
  },
  {
    stop: "busan-2", base: "Busan", area: "Gwangalli Beach",
    check_in: "2026-10-23", check_out: "2026-10-25", nights: 2, includes_oct16: false,
    why_area: "On the beach facing Gwangan Bridge: the Saturday drone show is outside the door, and Millak's raw-fish market is a 10-minute walk.",
    choices: [
      { tier: "value", lodging_id: "gwangalli-planet16", name: "Gwangalli-Planet16", room: "Deluxe Triple Sea View: twin + full, 1 room", price_krw_per_night: 201717, total_krw: 403434, price_basis: "Live Booking.com Oct 6: 403,434 with tax for Fri-Sat (2-night minimum); free cancellation before Oct 20", availability: "available (live Oct 6)", why: "The only live 2-night room on the drone-show beach, at a good price." },
      { tier: "splurge", lodging_id: "ananti-busan-cove", name: "Ananti at Busan Cove", room: "Cabin S Forest View (70 m², max 3) + extra guest and extra bed", price_krw_per_night: 645000, total_krw: 1290000, price_basis: "Live official site Oct 6: Fri about 441,000 + Sat 661,000 + 94,000 a night for the 3rd adult", availability: "available (live Oct 6)", why: "A destination resort on the Gijang cliffs, but 30-40 min by taxi from the drone show and well over budget." },
    ],
  },
]);
checkNights(stays);

const transport = [
  { date: "2026-10-17", from: "Incheon Airport T1", to: "Jongno hotel", mode: "taxi", dep: "06:40", arr: "07:45", duration: "~1h05", cost_krw_pp: 25000, booking: "Taxi rank outside arrivals (regular orange or white taxi), or Kakao T. Pay by card.", note: "About 70,000-80,000 KRW for the car including ~7,000 in tolls, split 3 ways. Door to door with luggage at dawn beats AREX plus a transfer. Budget option: AREX all-stop train (4,750 each) to Seoul Station, then a short taxi." },
  { date: "2026-10-20", from: "Seoul Station", to: "Gyeongju Station", mode: "KTX", dep: "09:33", arr: "11:49", duration: "2h16", cost_krw_pp: 44000, booking: "Korail+ app or korail.com (English). On sale now. KTX-Sancheon 23 in the Oct 7-13 timetable; confirm for Oct 20.", note: "Backups: KTX 121 08:12→10:58 or KTX 25 09:58→12:11 (44,500)." },
  { date: "2026-10-22", from: "Gyeongju Station", to: "Sinhaeundae Station (Busan)", mode: "ITX-Maeum", dep: "10:43", arr: "12:00", duration: "1h17", cost_krw_pp: 8700, booking: "Korail+ / korail.com. ITX-Maeum 1601 in the Oct 7-13 timetable; confirm.", note: "Drops you on the Haeundae side, so there is no cross-city taxi from Busan Station. Backups: ITX-Maeum 1841 12:03→13:21, KTX-Eum 707 14:16→15:10 (10,900), or KTX to Busan Station (10,100, 30 min) then a 30-min taxi." },
  { date: "2026-10-25", from: "Busan Station", to: "Seoul Station", mode: "KTX", dep: "13:03", arr: "15:47", duration: "2h44", cost_krw_pp: 54400, booking: "Korail+ / korail.com. KTX-Sancheon 38 in the Oct 7-13 timetable. Sunday trains sell out: book now.", note: "Backups: KTX-Cheongryong 36 12:34→15:00, KTX 124 13:17→16:34. Don't go later than about 14:30." },
  { date: "2026-10-25", from: "Seoul Station", to: "Incheon Airport T1", mode: "AREX", dep: "16:10", arr: "16:53", duration: "43 min", cost_krw_pp: 13000, booking: "Machines or counter at the Seoul Station B2 AREX concourse; Klook or Trip.com vouchers about 11,000.", note: "Air Premia can't use Seoul Station city check-in, so take your bags. Check-in usually opens 3 h before the 21:55 departure. Confirm Air Premia's terminal (T1 assumed)." },
];

const activities = [
  { date: "2026-10-17", what: "Haneul Park electric cart up the hill (optional; or climb the 291 steps for free)", cost_krw_pp: 3000 },
  { date: "2026-10-18", what: "Changdeokgung + Huwon (Secret Garden) guided tour", cost_krw_pp: 8000 },
  { date: "2026-10-18", what: "Changgyeonggung Mulbit Yeonhwa night show (includes admission)", cost_krw_pp: 1000 },
  { date: "2026-10-19", what: "Hanbok rental, basic 4 h (makes Gyeongbokgung free)", cost_krw_pp: 25000 },
  { date: "2026-10-20", what: "Daereungwon / Cheonmachong tomb", cost_krw_pp: 3000 },
  { date: "2026-10-20", what: "Donggung Palace & Wolji Pond at night", cost_krw_pp: 3000 },
  { date: "2026-10-22", what: "Blueline Park Sky Capsule, Cheongsapo → Mipo (55,000 per 3-person capsule)", cost_krw_pp: 18334 },
  { date: "2026-10-24", what: "Hurshimchung hot-spring bath (weekend rate)", cost_krw_pp: 18000 },
];

const budget = computeBudget({
  stays, transport, activities, localTransitPP: 140000,
  notes: [
    "Lodging is for 3 people sharing one room each night (two Ragung suites on the splurge tier), 8 core nights Oct 17-24. The Oct 16 night is shown separately.",
    "Prices are live checks from Oct 6 2026 (Booking.com, Yanolja/NOL, Paradise's official site), taxes included. Seoul weekend nights cost more than the 5-night averages, so Seoul figures are adjusted upward.",
    "Busan Fri-Sat has no sweet tier: Planet16 is the only live 2-night room on the drone-show beach. The splurge pick (Ananti Cove) puts the splurge total over US$1,000.",
    "Intercity transport covers the airport taxi share, 3 trains and the AREX Express.",
    "Local transit (about 140,000 per person) covers Seoul and Busan subway rides plus roughly 25 taxi rides, split 3 ways. Gyeongju is a taxi town: most hops are 5,000-15,000 for the car.",
    "Food is excluded. Typical spend is 50,000-80,000 per person per day, plus Iwa's omakase lunch (about 80,000) and the Yoseokgung court lunch (about 60,000).",
    "Not included: the value tier's Spa Land Centum evening (26,000) on Thursday.",
  ],
});

const option = {
  id: "classic",
  name: "Seoul · Gyeongju · Busan",
  tagline: "The balanced first trip: Seoul's palaces and night markets, the old Silla capital with a private hot-spring night, then Busan's sea temples and harbor.",
  recommended: true,
  summary: "Three bases with three moods. Seoul gets three days of palaces, hanok lanes and night markets. Gyeongju, Korea's open-air museum of royal tombs and temples, gets two, ending in a hanok suite with its own hot-spring bath. Busan's coast gets the last three: a seaside temple, a little sky capsule on the old shore railway, fish markets and the Saturday drone show. Every interest gets a full day and every transfer is a fast train. Foliage is early color only on this route.",
  design_notes: [
    "Gyeongju's two nights are in two hotels because Ragung (private hot-spring hanok suites) only has rooms on Wed Oct 21. Tue Oct 20 is in Bomun, 1.7 km away, so the move is a 5-minute taxi.",
    "Busan is split for the same reason: Thu Oct 22 at Paradise (Cimer hot spring included) because Paradise is sold out on Sat 24, then Fri-Sat at Gwangalli-Planet16 (2-night minimum) on the drone-show beach. The value tier sleeps in Gwangalli on Thursday too, 100 m from Planet16.",
    "The Gyeongju → Busan train goes to Sinhaeundae (ITX-Maeum), not Busan Station, so you land on the Haeundae side next to the Sky Capsule and Haedong Yonggungsa.",
    "Mon Oct 19 is Gyeongbokgung day: Changdeokgung and Changgyeonggung close on Mondays and Gyeongbokgung closes on Tuesdays. Sunday gets the Secret Garden and the Mulbit Yeonhwa night show.",
    "Haneul Park's silver grass is on Sat 17, the festival's opening day, as the gentle first-day outing. Weekend afternoons are busy, so arrive after 16:00 and stay for the lights.",
    "The omakase is Thursday lunch at Iwa in Haeundae (aged-fish sushi, about 80,000). Lunch costs less than dinner and fits the day. Mori's kaiseki (closed Mon) is the Friday-dinner splurge.",
    "Seoul hotel: the first live check found Nine Tree Dongdaemun available for Oct 16-21, but a later search saw nothing for Oct 16-19, so the sweet tier is marked 'recheck'.",
  ],
  route: [
    { base: "Seoul", nights: 3, from: "2026-10-17", to: "2026-10-20", lat: 37.5745, lon: 126.9925 },
    { base: "Gyeongju", nights: 2, from: "2026-10-20", to: "2026-10-22", lat: 35.8387, lon: 129.287 },
    { base: "Busan", nights: 3, from: "2026-10-22", to: "2026-10-25", lat: 35.1545, lon: 129.1183 },
  ],
  pace: "balanced",
  hotel_changes: 4,
  scores: { culture: 5, history: 5, nature: 3, city: 5, food: 5, autumn: 3, ease: 4 },
  japan_matches: [
    { japan: "Kamakura", korea: "Busan's east coast on Thursday: Haedong Yonggungsa on its sea rocks, Cheongsapo's twin lighthouses and the pastel Sky Capsule creeping along the old coastal railway. Gyeongju supplies the temple-town half with Bulguksa and the Seokguram stone Buddha.", date: "2026-10-22", honest_note: "Kamakura packs temples and sea into one small town; here they are split between Gyeongju (inland) and Busan (coast). The capsule is a tourist ride on a retired line, not a working local train like the Enoden." },
    { japan: "Shibuya", korea: "Saturday night in Mangwon and Hongdae, Monday in Euljiro's back-alley bars, the Gwangjang Market food alley, and the Gwangalli bridge and drone show on Saturday in Busan.", date: "2026-10-17", honest_note: "There is no scramble crossing; Seoul's energy is spread over several neighborhoods. Myeongdong and Gangnam have the bigger-neon look if you want it." },
    { japan: "Izu ryokan", korea: "Ragung in Gyeongju: a hanok suite on a walled courtyard with your own outdoor hot-spring bath. Then Paradise Busan's Cimer sea-view hot spring (sweet and splurge tiers) and Hurshimchung, Korea's biggest hot-spring bathhouse.", date: "2026-10-21", honest_note: "Ragung serves no meals (no kaiseki, no breakfast) and some reviews mention thin walls. The other hot springs are big public bathhouses (nude, single-sex), not a quiet inn." },
    { japan: "Sushi omakase", korea: "Iwa in Haeundae for an aged-fish omakase lunch, plus the live-picked raw fish at Jagalchi and Millak, Busan's own seafood ritual.", date: "2026-10-22", honest_note: "Iwa is Japanese-style sushi by Korean chefs and a bargain at lunch. The markets are loud and casual: pick a fish downstairs, eat it upstairs." },
  ],
  highlights: [
    "Changdeokgung's Secret Garden tour and the lantern-lit Mulbit Yeonhwa show at Changgyeonggung",
    "Gyeongbokgung in hanbok (free entry), then sunset on the Inwangsan city wall",
    "Silver grass at Haneul Park on the festival's opening evening",
    "Gyeongju's grassy royal tombs, Cheomseongdae and Wolji Pond lit at night",
    "Bulguksa and Seokguram, then a hanok suite with a private outdoor hot-spring bath",
    "Haedong Yonggungsa and the Sky Capsule along Busan's coast on a quiet weekday",
    "Jagalchi raw fish, Gamcheon's painted hills, and the drone show from your hotel's beach",
  ],
  tradeoffs: [
    "No peak foliage: Seoul, Gyeongju and Busan show early color only (their peaks run late Oct to mid Nov). Silver grass and clear autumn light are the seasonal draw.",
    "Four check-ins from Tue to Fri, forced by sold-out hotels. Two are 5-minute hops (Bomun → Ragung, and across the street in Gwangalli on the value tier).",
    "Ragung has no breakfast or dinner, and only 5 rooms were left for Wed Oct 21: book it first.",
    "The last day spends about 3.5 hours getting from Busan to the airport (KTX + AREX).",
  ],
  days,
  stays,
  transport,
  activities_paid: activities,
  budget,
  book_now: [
    { what: "Ragung suite for Wed Oct 21 (5 rooms left on Oct 6)", when: "now", how: "NOL World (English, world.nol.com, NC-11074) or Yanolja; free cancellation until Oct 14, 17:00", priority: "critical" },
    { what: "Seoul hotel Oct 16-20 (4rest Stay Jongno: 1 Deluxe Suite left)", when: "now", how: "Booking.com; the refundable rate cancels free until Oct 9", priority: "critical" },
    { what: "Gyeongju Tue Oct 20 (Lahan Select or Commodore, Bomun)", when: "now", how: "NOL World / Yanolja", priority: "critical" },
    { what: "Gwangalli-Planet16 Fri-Sat Oct 23-25 (2-night minimum)", when: "now", how: "Booking.com; free cancellation before Oct 20", priority: "critical" },
    { what: "Busan Thu Oct 22: Paradise Special Deal (sweet) or Aqua Palace (value)", when: "now", how: "busanparadisehotel.co.kr (Korean UI, foreign cards OK) or Booking.com", priority: "high" },
    { what: "Huwon (Secret Garden) tickets for Sun Oct 18, 09:30-10:30 slot", when: "Mon Oct 12, 10:00 KST (Sun Oct 11, 21:00 New York time)", how: "Changdeokgung official reservation site. Sells out in minutes in autumn; a few on-site tickets go on sale at 09:00.", priority: "critical" },
    { what: "KTX Seoul → Gyeongju (Tue 20), ITX-Maeum Gyeongju → Sinhaeundae (Thu 22), KTX Busan → Seoul (Sun 25)", when: "now (Sunday trains sell out first)", how: "Korail+ app or korail.com with a foreign card", priority: "critical" },
    { what: "Iwa omakase lunch, Thu Oct 22 around 12:30", when: "now", how: "Phone +82 10-8543-3356 (open daily 11:30-22:00); ask your hotel to call, or check CatchTable Global", priority: "high" },
    { what: "Blueline Sky Capsule, Thu Oct 22, Cheongsapo → Mipo around 16:45", when: "a week ahead", how: "Blueline Park website or Klook (55,000 per 3-person capsule)", priority: "high" },
    { what: "Changgyeonggung Mulbit Yeonhwa, Sun Oct 18, 19:00 slot", when: "now", how: "Ticketlink or Creatrip (1,000 each)", priority: "normal" },
    { what: "Korea e-Arrival Card for all 3 travelers", when: "Oct 14-16 (within 3 days before landing)", how: "e-arrivalcard.go.kr only (free; US citizens are K-ETA-exempt through Dec 31 2026)", priority: "critical" },
  ],
  watch_outs: [
    "Closures this week: Mon Oct 19 Changdeokgung, Changgyeonggung, Deoksugung, Leeum and DMZ tours; Tue Oct 20 Gyeongbokgung and Jongmyo. The plan already works around them.",
    "Huwon tickets sell out in minutes. If you miss them, try the 09:00 on-site release or do Changdeokgung's main palace only (3,000).",
    "Bukchon's red-zone lanes are open to tourists only 10:00-17:00, with fines up to 100,000. Gyeongbokgung's Geunjeongjeon courtyard is partly closed for works until Oct 31.",
    "Gyeongju weekdays are school-trip season: be at Bulguksa by 09:00, before the buses.",
    "Ragung has no breakfast (drip coffee only). Buy pastries and fruit in town on Wednesday afternoon.",
    "The Gwangalli drone show is cancelled in rain or strong wind; check @gwangallimdroneshow on the day.",
    "Air Premia can't use Seoul Station city check-in. Ride the AREX with your bags and reach T1 by about 17:00.",
  ],
};

fs.writeFileSync(new URL("./option-classic.json", import.meta.url), JSON.stringify(option, null, 1));
console.log("classic", budget.per_person_usd, budget.per_person_usd_with_oct16, { transport: budget.transport_krw_pp, activities: budget.activities_krw_pp, lodging: budget.lodging_krw_total });
