// Build option-foliage.json (Seoul · Seoraksan · Gangneung) with computed budget.
import fs from "fs";
import foliageDays from "./foliage-days.mjs";

const FX = 1340;
const HOTEL = { lat: 37.5745, lon: 126.9925 }; // 4rest Stay Jongno

// ---------- stays ----------
const stays = [
  {
    stop: "seoul-1", base: "Seoul", area: "Jongno 3-ga / Ikseon-dong",
    check_in: "2026-10-16", check_out: "2026-10-19", nights: 3, includes_oct16: true,
    why_area: "Walking distance to Jongmyo, Changdeokgung, Ikseon-dong and Gwangjang Market, with Line 1/3/5 for the bus terminal and Seoul Station; using the same hotel for both Seoul stays lets big suitcases wait here during the Gangwon loop.",
    choices: [
      { tier: "value", lodging_id: "4rest-stay-jongno", name: "4rest Stay Jongno", room: "Deluxe Suite (1 twin + 1 full bed, max 3), breakfast included", price_krw_per_night: 400441, price_basis: "Live Booking.com Oct 6 2026 (US time), Oct 16-19, 3 adults: 1,092,112 + 10% tax = 1,201,323 for 3 nights, non-refundable", availability: "available (live Oct 6) - only 1 Deluxe Suite left", total_krw: 1201323, why: "Cheapest live room that sleeps 3 adults with a real bed each, breakfast included, and 3 minutes from Jongmyo." },
      { tier: "sweet", lodging_id: "4rest-stay-jongno", name: "4rest Stay Jongno (refundable rate)", room: "Same Deluxe Suite, breakfast included", price_krw_per_night: 421517, price_basis: "Live Booking.com Oct 6 2026: 1,149,592 + 10% = 1,264,551 for 3 nights, free cancellation before Oct 9", availability: "available (live Oct 6) - only 1 Deluxe Suite left", total_krw: 1264551, why: "Same suite for about 21k a night more, but you can cancel until Oct 9. Seoul has nothing better for 3 at this price this weekend." },
      { tier: "splurge", lodging_id: "the-prima-jongno", name: "The Prima Hotel Jongno Insadong", room: "Deluxe Twin 23 m2 (1 twin + 1 full, recommended for 3), buffet breakfast", price_krw_per_night: 569296, price_basis: "Live Booking.com Oct 6 2026: 1,552,626 + 10% = 1,707,889 for 3 nights, free cancellation before Oct 13, pay at hotel", availability: "available (live Oct 6)", total_krw: 1707889, why: "A full-service hotel by Jogyesa with more room and flexible cancellation." }
    ]
  },
  {
    stop: "sokcho", base: "Sokcho / Seoraksan", area: "Nohak-dong (Seorak entrance road), next to Seorak Waterpia",
    check_in: "2026-10-19", check_out: "2026-10-21", nights: 2, includes_oct16: false,
    why_area: "Taxi 10-12 min to the Seorak cable car and Biseondae at dawn, 5 min to Cheoksan Hot Spring, Waterpia hot-spring park next door, and 25 min to Naksansa for the move south.",
    choices: [
      { tier: "value", lodging_id: "hanwha-resort-seorak-sorano", name: "Hanwha Resort Seorak Sorano", room: "Deluxe FAM family condo (sleeps 4 as standard, kitchen), room only", price_krw_per_night: 192000, price_basis: "Live on Korean OTAs (mom-mom/Webtour, yeogi) Oct 6 2026, Mon-Tue weekday rate", availability: "available (live Oct 6)", total_krw: 384000, why: "A big condo with kitchen at the park gate for under 65k per person per night." },
      { tier: "sweet", lodging_id: "hanwha-resort-seorak-sorano", name: "Hanwha Resort Seorak Sorano (ALL INCLUSIVE rate)", room: "Same family condo, plus Waterpia hot-spring passes and breakfast buffet for 2 adults; 3rd adult's Waterpia pass +49,000 (included in the total)", price_krw_per_night: 251500, price_basis: "Live on Korean OTAs Oct 6 2026: 227,000 x 2 weekday nights + 49,000 for the 3rd Waterpia pass = 503,000 (3rd breakfast about 30,000 extra on site, not included)", availability: "available (live Oct 6)", total_krw: 503000, why: "Only 35k a night more than room-only, and it adds the hot-spring park and breakfast: the best deal in Seorak." },
      { tier: "splurge", lodging_id: "lotte-resort-sokcho", name: "Lotte Resort Sokcho", room: "Hotel Deluxe Family Twin (3/3), sea view", price_krw_per_night: 341000, price_basis: "Live on mom-mom (Webtour) Oct 6 2026, Mon/Tue rate", availability: "available (live Oct 6)", total_krw: 682000, why: "Beachfront at Oeongchi with a sea-view infinity pool, 15 min from Seorak; the hot-spring nights then use Cheoksan." }
    ]
  },
  {
    stop: "gangneung", base: "Gangneung", area: "Gyeongpo / Unjeong-dong (Seongyojang) or Gangmun beach",
    check_in: "2026-10-21", check_out: "2026-10-23", nights: 2, includes_oct16: false,
    why_area: "Gyeongpo is between Anmok (Coffee Festival), Chodang tofu village and Ojukheon, and 10 min by taxi from Gangneung Station for the Odaesan and Seoul trains.",
    choices: [
      { tier: "value", lodging_id: "st-johns-gangneung", name: "St. John's Hotel Gangneung", room: "Superior Twin (max 3; 3rd guest free, proper extra bedding 22,000/night)", price_krw_per_night: 170000, price_basis: "Live on yeogi/mom-mom Oct 6 2026: 138-155k Wed-Thu + 22k bedding", availability: "available (live Oct 6)", total_krw: 340000, why: "A clean, modern beach hotel at the cheapest price for 3 in Gangneung." },
      { tier: "sweet", lodging_id: "seongyojang-hanok-stay", name: "Seongyojang Hanok Stay (Choga cottage)", room: "Choga thatched cottage: 2 ondol bedrooms (floor bedding), kitchen, private bathroom, sleeps 6", price_krw_per_night: 191000, price_basis: "Live on mom-mom (Yanolja) Oct 6 2026, Wed-Thu rate (Yeonjidang heritage house is the same price but its bathroom is shared)", availability: "available (live Oct 6)", total_krw: 382000, why: "You sleep inside a 300-year-old aristocratic manor and walk its pond pavilion after the day visitors leave: the closest thing to a ryokan on this route. Check-in 16:00, check-out 10:00." },
      { tier: "splurge", lodging_id: "skybay-gyeongpo", name: "Skybay Hotel Gyeongpo", room: "'[3인 전용]' Deluxe Twin for 3 (lake or pine view); rooftop infinity pool +50k for 2", price_krw_per_night: 300300, price_basis: "Live on yeogi Oct 6 2026, weekday 3-person rate", availability: "available (live Oct 6)", total_krw: 600600, why: "A high-rise between Gyeongpo lake and the sea with a rooftop infinity pool. Pick it for comfort over character." }
    ]
  },
  {
    stop: "seoul-2", base: "Seoul", area: "Jongno 3-ga / Ikseon-dong (same hotel as the first stay)",
    check_in: "2026-10-23", check_out: "2026-10-25", nights: 2, includes_oct16: false,
    why_area: "Big bags wait here from Oct 19; it is near Gyeongbokgung and Bukchon for Saturday, and Line 1 goes straight to Noryangjin and Seoul Station on Sunday.",
    choices: [
      { tier: "value", lodging_id: "4rest-stay-jongno", name: "4rest Stay Jongno", room: "Family Suite (2 full beds, max 4), breakfast included", price_krw_per_night: 459448, price_basis: "Live Booking.com Oct 6 2026, Oct 23-25, 3 adults: 835,359 + 10% = 918,895 for 2 nights, non-refundable", availability: "available (live Oct 6) - 2 Family Suites left", total_krw: 918895, why: "Same hotel as the first stay, so luggage never moves. Fri-Sat Seoul prices for 3 run 330-490k a night everywhere in Jongno." },
      { tier: "sweet", lodging_id: "4rest-stay-jongno", name: "4rest Stay Jongno (refundable rate)", room: "Family Suite, breakfast included", price_krw_per_night: 483630, price_basis: "Live Booking.com Oct 6 2026: 879,326 + 10% = 967,259, free cancellation before Oct 16", availability: "available (live Oct 6) - 2 left", total_krw: 967259, why: "Same suite with a free-cancellation window." },
      { tier: "splurge", lodging_id: "the-prima-jongno", name: "The Prima Hotel Jongno Insadong", room: "Deluxe Twin (recommended for 3), buffet breakfast", price_krw_per_night: 655564, price_basis: "Live Booking.com Oct 6 2026: 1,191,934 + 10% = 1,311,127 for 2 nights, free cancellation before Oct 20", availability: "available (live Oct 6)", total_krw: 1311127, why: "Same hotel as the splurge first stay. Bags stay put, and you get full hotel service." }
    ]
  }
];

// ---------- transport (intercity legs counted in transport_krw_pp) ----------
const transport = [
  { date: "2026-10-17", from: "Incheon Airport T1", to: "4rest Stay Jongno", mode: "taxi", dep: "06:30", arr: "07:40", duration: "1h10", cost_krw_pp: 25000, booking: "Taxi rank outside arrivals, or Kakao T (works with foreign phones/cards)", note: "About 65-80k for the car including tolls, split 3 ways. Door to door with suitcases at dawn, about the same price as 3 AREX Express tickets plus a taxi from Seoul Station.", counted: true },
  { date: "2026-10-19", from: "4rest Stay Jongno", to: "Dong Seoul Bus Terminal (Gangbyeon)", mode: "taxi", dep: "07:30", arr: "07:55", duration: "25 min", cost_krw_pp: 5000, booking: "Kakao T", note: "Or subway Line 5 to Dongdaemun History & Culture Park, then Line 2 to Gangbyeon (about 35 min, 1,550). Counted in local transit.", counted: false },
  { date: "2026-10-19", from: "Dong Seoul Bus Terminal", to: "Sokcho Express Bus Terminal", mode: "bus", dep: "08:20", arr: "10:36", duration: "2h16", cost_krw_pp: 22800, booking: "kobus.co.kr / Express Bus Mobile app (foreign Visa/MC accepted), Klook, or terminal kiosk; book a few days ahead", note: "Deluxe (udeung) 22,800 after the Oct 1 2026 fare rise; 15 departures a day 07:00-20:30 (07:00, 08:20, 09:00 ...); arrives at the Express terminal by Cheongchoho lake, a short taxi or 20-min walk from Abai Village. A Monday departure avoids the weekend foliage jams (3.5-5 h). Fallback: Seoul Express Bus Terminal (Gangnam) to Sokcho, 45 a day, deluxe 24,300.", counted: true },
  { date: "2026-10-19", from: "Sokcho Jungang Market", to: "Hanwha Resort Seorak Sorano", mode: "taxi", dep: "14:20", arr: "14:40", duration: "20 min", cost_krw_pp: 5000, booking: "Hail or Kakao T", note: "About 15k for the car. Counted in local transit.", counted: false },
  { date: "2026-10-20", from: "Sorano", to: "Seorak Sogongwon (cable car)", mode: "taxi", dep: "07:30", arr: "07:45", duration: "12-15 min", cost_krw_pp: 3500, booking: "Kakao T; ask the front desk the night before", note: "Weekday traffic controls (Oct 3-Nov 8) still let taxis through early. Sokcho city bus 7/7-1 also runs (1,500). Counted in local transit.", counted: false },
  { date: "2026-10-21", from: "Sorano", to: "Naksansa", mode: "taxi", dep: "09:00", arr: "09:30", duration: "30 min", cost_krw_pp: 8400, booking: "Kakao T", note: "About 25k for the car. There is no direct bus from the Seorak side.", counted: true },
  { date: "2026-10-21", from: "Naksansa", to: "Hajodae", mode: "taxi", dep: "11:40", arr: "12:00", duration: "20 min", cost_krw_pp: 6000, booking: "Kakao T, or ask the Naksansa parking-lot taxi rank", note: "About 18k for the car.", counted: true },
  { date: "2026-10-21", from: "Hajodae", to: "Jumunjin Port", mode: "taxi", dep: "12:50", arr: "13:15", duration: "25 min", cost_krw_pp: 8400, booking: "Kakao T (call one before leaving the pavilion; Hajodae has few cruising taxis)", note: "About 25k for the car.", counted: true },
  { date: "2026-10-21", from: "Jumunjin Port", to: "Seongyojang, Gangneung", mode: "taxi", dep: "14:30", arr: "15:00", duration: "30 min", cost_krw_pp: 9000, booking: "Kakao T", note: "About 27k for the car. Cheaper but slower: Gangneung city bus 300 (about 1,500, 50 min) to downtown, then a short taxi.", counted: true },
  { date: "2026-10-22", from: "Gangneung Station", to: "Jinbu (Odaesan) Station", mode: "KTX", dep: "08:05", arr: "08:25", duration: "20 min", cost_krw_pp: 8400, booking: "Korail+ app / korail.com; pick a Seoul-bound KTX-Eum that stops at Jinbu (not all do)", note: "Exact time and fare are estimates: check the Korail+ timetable. About 1 train an hour.", counted: true },
  { date: "2026-10-22", from: "Jinbu Station", to: "Sangwonsa (top of Seonjae-gil)", mode: "taxi", dep: "08:30", arr: "09:00", duration: "30 min", cost_krw_pp: 11700, booking: "Taxi rank at Jinbu Station or Kakao T", note: "About 35k for the car (estimate). The rural bus via Woljeongsa is cheaper (about 2,000) but runs only about hourly.", counted: true },
  { date: "2026-10-22", from: "Woljeongsa", to: "Jinbu Station", mode: "bus", dep: "15:30", arr: "15:55", duration: "25 min", cost_krw_pp: 2000, booking: "Rural bus, T-money or cash; taxi about 20k for the car if the bus doesn't fit", note: "Bus frequency is about hourly (unverified); check the stop timetable when you arrive.", counted: true },
  { date: "2026-10-22", from: "Jinbu (Odaesan) Station", to: "Gangneung Station", mode: "KTX", dep: "16:20", arr: "16:40", duration: "20 min", cost_krw_pp: 8400, booking: "Korail+; book with the morning ticket", note: "Times and fare are estimates; check Korail+.", counted: true },
  { date: "2026-10-23", from: "Gangneung Station", to: "Seoul Station", mode: "KTX-Eum", dep: "11:30", arr: "13:30", duration: "about 2h", cost_krw_pp: 27600, booking: "Korail+ app / korail.com, seats open about a month ahead. Friday trains in foliage season sell out: book now.", note: "14 trains a day to Seoul Station, more to Cheongnyangni (26,000). Departure time is a placeholder: take the one nearest 11:30.", counted: true },
  { date: "2026-10-25", from: "4rest Stay Jongno", to: "Seoul Station (bag storage)", mode: "taxi", dep: "09:30", arr: "09:45", duration: "15 min", cost_krw_pp: 3000, booking: "Kakao T", note: "Store bags at the Seoul Station T-Luggage counter (09:00-22:00) or lockers for the day. Counted in local transit.", counted: false },
  { date: "2026-10-25", from: "Seoul Station", to: "Incheon Airport T1", mode: "AREX", dep: "17:20", arr: "18:03", duration: "43 min", cost_krw_pp: 13000, booking: "Airport machines/counter or airportrailroad.com; Klook/Trip.com vouchers about 11,000", note: "Express every 30-40 min. Air Premia can't use Seoul Station city check-in, so take bags with you. An earlier train is fine; aim to reach T1 by about 18:15.", counted: true }
];

const transportPP = transport.filter(t => t.counted).reduce((s, t) => s + t.cost_krw_pp, 0);
transport.forEach(t => delete t.counted);

// ---------- activities ----------
const activities_paid = [
  { date: "2026-10-17", what: "Jongmyo Shrine (Saturday free-roaming)", cost_krw_pp: 1000 },
  { date: "2026-10-17", what: "Changgyeonggung (open to 21:00; Mulbit Yeonhwa light show if a slot is free)", cost_krw_pp: 1000 },
  { date: "2026-10-18", what: "Changdeokgung + Huwon (Secret Garden) guided entry", cost_krw_pp: 8000 },
  { date: "2026-10-19", what: "Gaetbae hand-pulled ferry, Abai Village (cash, round trip)", cost_krw_pp: 1000 },
  { date: "2026-10-19", what: "Seorak Waterpia night spa (sweet tier: covered by the ALL INCLUSIVE passes)", cost_krw_pp: 27000 },
  { date: "2026-10-20", what: "Seorak cable car to Gwongeumseong (round trip)", cost_krw_pp: 16000 },
  { date: "2026-10-20", what: "Cheoksan Hot Spring public baths", cost_krw_pp: 11000 },
  { date: "2026-10-21", what: "Seongyojang House admission (free for hanok-stay guests)", cost_krw_pp: 5000 },
  { date: "2026-10-23", what: "Ojukheon", cost_krw_pp: 3000 },
  { date: "2026-10-24", what: "Hanbok rental, 4 h basic (gets free Gyeongbokgung entry)", cost_krw_pp: 25000 }
];
const activitiesPP = activities_paid.reduce((s, a) => s + a.cost_krw_pp, 0);

// Local transit per person: Seoul subway ~20 rides + Haneul shuttle + 2 taxis; Sokcho taxis; Gangneung taxis.
const localTransitPP = 95000;

// ---------- budget ----------
const tiers = ["value", "sweet", "splurge"];
const core = {}, oct16 = {}, pp = {}, pp16 = {};
for (const t of tiers) {
  let total = 0, extra = 0;
  for (const s of stays) {
    const c = s.choices.find(x => x.tier === t);
    if (s.includes_oct16) {
      extra = c.price_krw_per_night;
      total += c.total_krw - c.price_krw_per_night;
    } else {
      total += c.total_krw;
    }
  }
  core[t] = total;
  oct16[t] = extra;
  const base = total / 3 + transportPP + localTransitPP + activitiesPP;
  pp[t] = Math.round(base / FX);
  pp16[t] = Math.round((base + extra / 3) / FX);
}

const days = foliageDays;

const out = {
  id: "foliage",
  name: "Seoul · Seoraksan · Gangneung",
  tagline: "Peak autumn color in the Gangwon mountains, hot-spring evenings, and a coffee-town coast, framed by two Seoul weekends.",
  recommended: false,
  summary: "This is the trip for the foliage: on weekdays you catch Seoraksan and Odaesan at their 2026 peak, when the cable car and trails are quieter, and you soak in hot springs after the hikes. Then the Gangneung coast (seaside temple, coffee festival, a night in a 300-year-old manor) and two Seoul weekends of palaces, night markets and Friday-night Hongdae. It suits travelers who liked Kamakura and the Izu ryokan more than they need Gyeongju's tombs or Busan's beaches.",
  design_notes: [
    "Haneul Park silver grass moved from Sat 17 to Fri 23, the festival's last evening (open to 21:00). Day 1 stays jet-lag-gentle within 10 minutes of the hotel, a weekend afternoon at Haneul Park is the crowd peak, and Friday leads straight into Hongdae's best night.",
    "Day 1 uses Jongmyo, which allows free-roaming only on Saturdays (weekdays are guided tours only) and is 3 minutes from the hotel. Changgyeonggung next door is open to 21:00 for the Mulbit Yeonhwa show.",
    "Hwadam Botanic Garden is dropped from Fri 23. Gonjiam is off the Gangneung-Seoul rail line, it needs timed NOL tickets, Seoul-area color is still partial on Oct 23, and the travelers will have just seen peak Gangwon. It stays as a Sat 24 swap for anyone who wants it.",
    "Seoul hotel: Nine Tree Dongdaemun showed NO availability for Oct 16-19 or Oct 23-25 in a live check (Oct 6, US time). 4rest Stay Jongno is live for both stays, so the plan uses the same hotel twice and big suitcases stay there Oct 19-23. The live 3-night weekend rate (about 400k/night) is higher than the brief's 5-night average of 295k.",
    "The Sokcho base is Sorano at the Seorak entrance, not Osaek. Osaek is about 40 min from the cable car, and its famous carbonated spring is cool water. Cheoksan (53°C, outdoor baths) and Waterpia give the real hot soaks.",
    "Seorak day: cable car at opening plus the flat Biseondae valley, not Ulsanbawi, which suits a mixed group better (Ulsanbawi is the swap for strong hikers). Heullimgol is skipped because its KNPS booking needs Korean ID verification; Juongol from Osaek (no booking) is the alternative.",
    "Wed 21 coast move uses 4 short taxi hops (about 32k per person). No rail reaches Sokcho, and the Sokcho-Gangneung express bus skips Naksansa, Hajodae and Jumunjin.",
    "Odaesan is done top-down: taxi to Sangwonsa, then walk 9 km downhill along Seonjae-gil to Woljeongsa, so the hard part is gravity's job.",
    "The car-free Jamsu Bridge festival and Banpo fountain go on Sun 18. Sun 25 instead gets Noryangjin plus the free National Museum of Korea, which fit around the airport run."
  ],
  route: [
    { base: "Seoul", nights: 2, from: "2026-10-17", to: "2026-10-19", lat: 37.5745, lon: 126.9925 },
    { base: "Sokcho / Seoraksan", nights: 2, from: "2026-10-19", to: "2026-10-21", lat: 38.1965, lon: 128.539 },
    { base: "Gangneung", nights: 2, from: "2026-10-21", to: "2026-10-23", lat: 37.7867, lon: 128.8851 },
    { base: "Seoul", nights: 2, from: "2026-10-23", to: "2026-10-25", lat: 37.5745, lon: 126.9925 }
  ],
  pace: "balanced",
  hotel_changes: 3,
  scores: { culture: 4, history: 3, nature: 5, city: 3, food: 4, autumn: 5, ease: 3 },
  japan_matches: [
    { japan: "Kamakura", korea: "Naksansa: a cliff-top seaside temple with Uisangdae pavilion and Hongnyeonam hermitage over a sea cave, then Hajodae's pine-on-rock lighthouse and Gangneung's Anmok coffee coast during the Coffee Festival", date: "2026-10-21", honest_note: "There is no little coastal train: the Donghae Bukbu line won't open until about 2027-28, so you hop by taxi. Naksansa was largely rebuilt after a 2005 wildfire, so it feels less ancient than Kotoku-in." },
    { japan: "Izu ryokan", korea: "Hot-spring evenings at Seorak (Waterpia's outdoor hot pools, Cheoksan's 53°C outdoor baths), then two nights in Seongyojang's 300-year-old hanok manor (sweet tier)", date: "2026-10-19", honest_note: "Korean hot springs are public: Cheoksan is a nude, single-sex bathhouse and Waterpia a swimsuit spa park. The hanok has no in-house bath or kaiseki dinner. It's the same mood split across two places, not one ryokan." },
    { japan: "Shibuya", korea: "Friday night in Hongdae and Yeonnam-dong: buskers, neon, the Gyeongui Line Forest Park bars, straight after silver grass at Haneul Park", date: "2026-10-23", honest_note: "Hongdae is younger and more indie than Shibuya, with no scramble crossing. Myeongdong or Gangnam are closer for pure neon and scale." },
    { japan: "Sushi omakase", korea: "Saturday counter dinner at Sushi Sora Gwanghwamun (entry tier) or Sushi Cho at the Westin Josun (high tier), plus Sokcho red snow crab and a Noryangjin sashimi brunch on the last day", date: "2026-10-24", honest_note: "Seoul's sushi counters are excellent but Japanese-trained, not Korean. The local seafood ritual (pick live fish, eat upstairs) is louder and cheaper than a hushed omakase." }
  ],
  highlights: [
    "Seoraksan at its 2026 peak on a weekday: cable car to Gwongeumseong + the Biseondae valley under granite spires",
    "Odaesan's 9 km Seonjae-gil streamside walk and the 1,000-year fir forest at Woljeongsa",
    "Naksansa seaside temple, Hajodae and lunch at Jumunjin fish market down the coast",
    "Two hot-spring evenings at the Seorak gate (Waterpia, Cheoksan)",
    "Gangneung Coffee Festival opening day and a night in Seongyojang manor",
    "Silver grass at Haneul Park on the festival's last evening, then Friday-night Hongdae",
    "Changdeokgung's Secret Garden, Gyeongbokgung in hanbok and a sushi counter on the last night"
  ],
  tradeoffs: [
    "No Gyeongju or Busan: history is the Seoul palaces plus mountain and seaside temples.",
    "Three hotel moves and two split Seoul stays. Travel Gangwon with day packs while the suitcases wait in Seoul.",
    "Gangwon runs on buses and taxis (no train to Sokcho), and the weather matters: wind stops the cable car, and rain soaks the mountain days.",
    "Seoul weekend hotels for 3 are expensive (about 400-490k a night even at the value tier), so the sweet tier slightly exceeds US$1,000 per person if you add Oct 16."
  ],
  days,
  stays,
  transport,
  activities_paid,
  budget: {
    fx: FX,
    lodging_krw_total: core,
    oct16_extra_krw: oct16,
    transport_krw_pp: transportPP,
    local_transit_krw_pp: localTransitPP,
    activities_krw_pp: activitiesPP,
    per_person_usd: pp,
    per_person_usd_with_oct16: pp16,
    notes: [
      "Lodging is for 3 people sharing one room per night, 8 core nights Oct 17-24. The Oct 16 night is shown separately.",
      "Seoul prices are live Booking.com totals including 10% tax (Oct 6 2026). Gangwon prices are live Korean-OTA rates (mom-mom, yeogi), which may need a Korean phone; on Agoda or Trip.com the same rooms may cost 5-15% more.",
      "Intercity transport (" + transportPP.toLocaleString("en-US") + " KRW per person) includes the airport taxi share, the Dong Seoul-Sokcho bus, Wednesday's 4 coast taxi hops, the Odaesan KTX and taxi, the Gangneung-Seoul KTX and AREX Express. Taxi fares are split 3 ways.",
      "Local transit (about 95,000 per person) covers about 20 Seoul subway rides, the Haneul Park shuttle and roughly 20 short taxi rides in Sokcho and Gangneung, split 3 ways.",
      "Activities include a conservative 27,000 for the Waterpia night spa, which sweet-tier guests already have through their package.",
      "Food is excluded. Typical spend is 50-80k per person per day, plus 110-340k for the omakase dinner.",
      "Not included: the optional Gyeongbokgung Starlight Night Walk (60,000, sold out; cancellations only), Sokcho Eye (about 15,000), and the third breakfast at Sorano (about 30,000)."
    ]
  },
  book_now: [
    { what: "4rest Stay Jongno, Oct 16-19 Deluxe Suite (1 left) AND Oct 23-25 Family Suite (2 left). Message the hotel to hold big luggage Oct 19-23.", when: "now", how: "booking.com/hotel/kr/4rest-stay-jongno.html (refundable rate cancels free before Oct 9 / Oct 16)", priority: "critical" },
    { what: "Hanwha Resort Seorak Sorano, Mon Oct 19-Wed Oct 21, family condo (ALL INCLUSIVE rate for the sweet tier)", when: "now", how: "mom-mom.net / yeogi.com (Korean OTAs), or hanwharesort.co.kr; Agoda as fallback", priority: "critical" },
    { what: "Seongyojang Hanok Stay Choga (or St. John's / Skybay), Wed Oct 21-Fri Oct 23", when: "now", how: "mom-mom.net / Yanolja, phone 050-703-8155", priority: "high" },
    { what: "Huwon (Secret Garden) tickets for Sun Oct 18, a 10:00-11:00 slot", when: "Mon Oct 12, 10:00 KST (Sun Oct 11, 21:00 New York time)", how: "Changdeokgung official reservation site; sells out in minutes in autumn. A few on-site tickets go on sale at 09:00.", priority: "critical" },
    { what: "KTX Gangneung -> Seoul, Fri Oct 23 around 11:30", when: "now (Friday foliage-season trains sell out)", how: "Korail+ app / korail.com with a foreign card", priority: "high" },
    { what: "KTX Gangneung <-> Jinbu (Odaesan) round trip, Thu Oct 22", when: "this week", how: "Korail+ app; choose trains that stop at Jinbu", priority: "normal" },
    { what: "Dong Seoul -> Sokcho bus, Mon Oct 19, 08:20 (deluxe)", when: "a few days ahead", how: "kobus.co.kr / Express Bus Mobile app / Klook", priority: "normal" },
    { what: "Omakase dinner Sat Oct 24: Sushi Sora Gwanghwamun (about 110k) or Sushi Cho, Westin Josun (about 340k)", when: "now", how: "CatchTable Global app (Sushi Sora); Westin Josun website or phone (Sushi Cho). Confirm the closed day when booking.", priority: "high" },
    { what: "Korea e-Arrival Card for all 3 travelers", when: "Oct 14-17 (within 3 days before arrival)", how: "Official e-Arrival site (free; US citizens are K-ETA-exempt through Dec 31 2026)", priority: "critical" },
    { what: "Gyeongbokgung Starlight Night Walk, Sat Oct 24 (18:20 or 19:30), cancellation watch", when: "check daily from now", how: "Creatrip (max 2 tickets per booker, 60,000)", priority: "normal" },
    { what: "Changgyeonggung Mulbit Yeonhwa, Sat Oct 17 evening slot", when: "now, if slots remain", how: "NOL Ticket / Korea Heritage Agency; the palace itself is walk-up to 21:00", priority: "normal" }
  ],
  watch_outs: [
    "Seorak cable car: tickets are same-day only with a printed boarding time, and the car stops in high wind. If Tue 20 is a washout, move Seorak to Wed morning and take the intercity bus Sokcho-Gangneung (8,400, about 1 h), dropping Naksansa and Hajodae.",
    "Gwongeumseong, Seonjae-gil and Haneul Park after dark run 5-10°C colder than the city. Bring a windproof layer, gloves and real walking shoes.",
    "Mon Oct 19 is the 3rd Monday of the month, when some Sokcho Jungang Market stalls close. The market and Manseok dakgangjeong are normally busy, but have Abai Village as the food anchor.",
    "Foliage forecasts move. Valleys (Biseondae, Seonjae-gil) are forecast at peak Oct 20-27; high ridges may be past peak by Oct 20.",
    "Korean OTA rates (mom-mom, yeogi) may need a Korean phone number for checkout. If they reject you, use Agoda or Trip.com or the hotel's own site and expect a slightly higher price.",
    "Value-tier Seoul rates are non-refundable. Choose the refundable rate if the dates could change.",
    "Confirm in writing that 4rest Stay will hold big bags for 4 nights. If not, use the Seoul Station T-Luggage counter or a Jongno luggage-storage shop.",
    "Bukchon red-zone lanes are open to tourists only 10:00-17:00 (fines up to 100k), and Gyeongbokgung's Geunjeongjeon courtyard is partly closed for works until Oct 31.",
    "The Gangneung Coffee Festival (Oct 21-25) fills Anmok's cafés. Go on Wednesday or Thursday evening, not Saturday.",
    "Air Premia has no Seoul Station city check-in. On Oct 25, collect your bags and ride the AREX to T1 by about 18:15."
  ]
};

fs.writeFileSync(new URL("./option-foliage.json", import.meta.url), JSON.stringify(out, null, 2));
console.log({ transportPP, activitiesPP, core, oct16, pp, pp16 });
