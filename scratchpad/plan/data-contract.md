# data.js contract: `window.TRIP = {...}`

```js
window.TRIP = {
  meta: {
    title: "Korea Autumn 2026", start: "2026-10-17", end: "2026-10-25", travelers: 3,
    fx: 1340, budget_usd_pp: 1000, checked: "2026-10-07",
    flights: [
      { dir: "out", from: "EWR", to: "ICN", airline: "Air Premia", dep: "2026-10-16T01:00", arr: "2026-10-17T05:15", note: "Nonstop, 15 h 15 m" },
      { dir: "back", from: "ICN", to: "EWR", airline: "Air Premia", dep: "2026-10-25T21:55", arr: "2026-10-25T22:30", note: "Nonstop, 13 h 35 m" }
    ]
  },
  options: [ /* plan/option-*.json objects, schema in plan/brief.md, order: classic, foliage, grandloop, island */ ],
  places:  { "<id>": { id, name, name_ko, region, area, category, lat, lon, summary, why, autumn_note, hours, closed, cost_krw, booking, tips, image: "<imageId>|null" } },
  lodging: { "<id>": { id, name, name_ko, city, area, type, lat, lon, room_for_3, highlights, drawbacks, booking, image } },
  food:    { "<id>": { id, name, name_ko, city, area, type, price_krw_pp, booking, why, lat, lon, image } },
  images:  { "<imageId>": { src: "img/<imageId>.webp", w, h, alt, author, license, source_url } },
  foliage: [ { id, name, name_ko, region, lat, lon, first_color: "2026-10-03", peak_start: "2026-10-16", peak_end: "2026-10-25", kind: "maple|ginkgo|silver-grass|mixed", note, confidence } ],
  events:  [ { id, name, name_ko, city, start: "2026-10-17", end: "2026-10-23", times, cost, kind: "festival|show|closure|season|free-entry", note, lat, lon, confidence } ],
  guide: {
    japan_matches: [ { japan: "Kamakura", why_loved: "...", korea: [ { name, place_id, where, note, options: ["classic", ...], image } ] } ],
    food: { tiers: [ { tier: "Entry|Mid|High", price: "...", examples: [ { name, city, price, booking, note, food_id } ] } ], autumn: [ { item, ko, where, note } ], regional: [ { city, dishes: [ { dish, ko, where, price } ] } ], how_to_book: ["..."] },
    arrival: [ "step strings for the 05:15 landing" ],
    departure: [ "step strings for Sun Oct 25" ],
    money_apps: [ { name, what, note } ],
    entry: [ "..." ],
    weather: { summary, temps: "...", packing: ["..."] },
    general_book_now: [ { what, when, how, priority } ]
  }
};
```
Every `image` value is a key in `images` or null.
