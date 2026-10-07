# Page design spec: "Korea Autumn 2026"

A static, interactive trip planner for 3 friends choosing between 4 itinerary options for Oct 17–25 2026. It is read on laptops and phones, and shared in a group chat. Its single job: help them pick an option, then use it as the plan.

## Hard platform rules (the page is published as a sandboxed Artifact)
- Author `index.html` WITHOUT `<!doctype>`, `<html>`, `<head>`, `<body>` tags: the file starts with `<title>Korea Autumn 2026</title>`, then `<link>` to Google Fonts, then `<style>`, then markup, then scripts. (A publish step wraps it in a skeleton with charset + viewport meta.)
- External scripts ONLY from https://cdnjs.cloudflare.com (pin exact versions, UMD builds, placed before the inline/own scripts that use them). Use d3 7.9.0 (`https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js`) and topojson-client if needed (`https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js`). Nothing else external except Google Fonts CSS.
- No external images, no fetch to other hosts, no iframes, no map tiles. All images are local files under `img/` (relative paths). Data is in local `data.js` and `geo.js` loaded with `<script src="data.js">` (relative). Own JS may be in `app.js` / `viz.js` (relative script tags).
- No alert/confirm/prompt, no window.print, no `<a download>`. Outbound links (Naver Map, Google Maps, booking sites) are plain `<a href target="_blank" rel="noopener">`.
- localStorage only for per-viewer conveniences (selected option, checked booking items, tier picks), always wrapped in try/catch; the page must work without it.
- Deep links: only bare `#token` hashes (e.g. `#classic`, `#foliage`, `#grandloop`, `#island`).
- Must work at 375px wide with no horizontal page scroll; side gutter ≥16px set once on the outer wrapper with `padding-inline` (vertical via `padding-block`). Tables/charts may scroll inside their own `overflow-x:auto` container. `min-width:0` on flex/grid children holding text.
- Both themes: define all colors as tokens on bare `:root` (light), redefine under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…; color-scheme: dark} }` and again under `:root[data-theme="dark"] {…; color-scheme: dark}`. `body { background: var(--paper); color: var(--ink) }`. No literal colors in component rules; SVG/canvas colors read from CSS variables (getComputedStyle) or use `currentColor`/`var()` in SVG attributes via CSS classes.
- Keep the `:root` safe-area padding from the skeleton; sticky header uses `top: env(safe-area-inset-top, 0px)`.
- Visible focus states, `prefers-reduced-motion` respected, every form control has a stable `id`.
- Everything meant to be read is visible at rest (no opacity:0 waiting on observers).

## Design direction
Subject materials: hanji paper, Goryeo celadon, maple (단풍) red and ginkgo (은행) gold, Korail tickets and subway line diagrams, the 24 solar terms (Oct 23 2026 is 상강 Sanggang, "frost descent"). Utilitarian-editorial: a well-made field guide + timetable, not a marketing site. No hero image wall, no emoji, no gradients, no numbered 01/02/03 decoration, not everything centered, not rounded-everything.

```css
/* Layout: ticket-stub day cards in a scrolling timetable column beside a sticky map; option picker as four route strips. */
:root{
  --paper:#F2F4F0; --card:#FAFBF8; --ink:#1B211F; --muted:#5A6561; --line:#D5DBD3;
  --celadon:#4C8273; --celadon-soft:#DCEAE4; --maple:#BF3F2B; --maple-soft:#F6DED8;
  --ginkgo:#C98F12; --ginkgo-soft:#F7ECCF; --sea:#2E5C86; --sea-soft:#DCE6EF; --land:#E6E9E2;
  --font-display:"Hahmlet", "Noto Serif KR", Georgia, serif;
  --font-body:"IBM Plex Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif;
  --font-mono:"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
/* dark */ --paper:#111614; --card:#171D1B; --ink:#E6EBE7; --muted:#9AA6A1; --line:#29322F;
  --celadon:#7DB7A6; --celadon-soft:#1D2D28; --maple:#E4644F; --maple-soft:#3A2420;
  --ginkgo:#E3B23F; --ginkgo-soft:#352C16; --sea:#7FA6CF; --sea-soft:#1A2633; --land:#1E2522;
```
Google Fonts link: `https://fonts.googleapis.com/css2?family=Hahmlet:wght@500;700;800&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap`
Type scale (rem): 0.8 / 0.9 / 1 (body 16px, line-height 1.55) / 1.15 / 1.4 / 1.9 / 2.6 (h1). Headings `text-wrap: balance`, display face for h1–h3 and day titles only. Mono for times, prices, train numbers, dates. Uppercase micro-labels get letter-spacing .06em. Running text max ~68ch.
Semantic colors: maple = peak foliage / sold out / closed days / critical; ginkgo = food & money; celadon = selection, links, rail lines; sea = water + bus/ferry/flight lines.

## Page structure (top to bottom)
1. **Header** (not a giant hero): small eyebrow "Oct 17–25, 2026 · 3 travelers · 상강 falls on Oct 23", h1 "Korea Autumn 2026", one-sentence lede. A flight strip styled like a boarding pass: `EWR → ICN · lands Sat 17 Oct 05:15` and `ICN → EWR · departs Sun 25 Oct 21:55` (Air Premia), plus "8 nights · budget US$1,000 pp (lodging, transport, activities)". Theme follows system; no toggle needed.
2. **Choose a route**: 4 option cards (grid, 1 col on phone, 2 on tablet, 4 on wide). Each card: name, tagline, a subway-style route diagram (dots = bases, segment length ∝ nights, labels with nights), pace chip, hotel changes, per-person cost range (value–splurge) with a thin bar against the US$1,000 mark, "Recommended" chip on the recommended one. Clicking selects (aria-pressed), updates `#hash`, re-renders everything below. A compact compare table below the cards (collapsible `<details>`, open by default on desktop): scores as 5-dot ratings for culture/history/nature/city/food/autumn/ease, Japan matches, tradeoffs.
3. **The plan** for the selected option: summary, highlights, design notes hidden in a `<details>`. Two-column ≥1100px: left = day cards, right = sticky map panel (top offset below header). Under 1100px the map sits above the days at ~60vh max, with day chips (Sat 17 … Sun 25) to jump.
   - **Day card** (ticket stub: a perforated left edge via a dashed border + date block in mono: "SAT 17", "토", "OCT"): base chip, title (display face), summary, autumn note (small leaf glyph drawn in SVG/CSS + text), then a timetable list of items: time (mono, left), kind glyph (tiny inline SVG per kind), title, detail, and chips for cost (₩ and ≈US$), booking, tip. Items with a place image show a 4:3 thumbnail (lazy-loaded) that opens a larger view in a lightweight overlay (or simply links). Each located item has small "Naver Map" / "Google Maps" text links (Naver: `https://map.naver.com/p/search/<encoded Korean or English name>`; Google: `https://www.google.com/maps/search/?api=1&query=<lat>,<lon>`). Food picks row (ginkgo accent), rainy-day swap (muted callout), overnight stay chip linking to the stays panel.
   - When a day card is scrolled into the middle of the viewport (IntersectionObserver) or clicked, the map focuses that day: route context stays, day pins numbered in order, others dimmed.
4. **Where you'll sleep**: per stop, the 2–3 tier choices as rows with a radio per stop (value/sweet/splurge), showing name, room setup, price/night (mono), nights, total, availability badge (Live-checked available = celadon; Partly sold out = ginkgo; Sold out = maple strikethrough; Unverified = muted), why. Photos where available.
5. **Budget**: live total per person for the current tier picks, in USD and KRW, as a horizontal stacked bar (lodging / intercity transport / local transit / activities) with the US$1,000 line and a numeric legend; a toggle "Book the night of Oct 16 (room ready at dawn)" adds the extra night. Show the budget notes. Use tabular-nums.
6. **Autumn calendar**: (a) foliage chart: rows = places (from data.foliage), x-axis Oct 1 → Nov 20 with week ticks, a bar from first color to peak-end, peak window darker (maple), the trip window Oct 17–25 shaded band, and a marker on rows that the selected option visits on the dates it visits; (b) a 9-day events strip (Sat 17 … Sun 25): festivals/shows (celadon), closures (maple), seasonal notes, highlighting days the selected option is in that city.
7. **Japan → Korea**: four cards (Kamakura, Shibuya, Izu ryokan, Sushi omakase), each with the best Korean match(es), photo, and which options include it.
8. **Food & omakase**: tiers table (entry / mid / high with real examples, prices, booking), autumn foods list, regional must-eats, how to book (CatchTable Global etc.).
9. **Before you go**: book-now checklist for the selected option (checkboxes persisted in localStorage, critical items marked maple), arrival plan (05:15 landing), departure plan, money & apps, entry (e-Arrival Card, K-ETA exemption), weather & packing.
10. **All places**: filterable grid (region + category chips, text filter) of catalog places with photos.
11. **Footer**: sources note ("prices live-checked Oct 6–7 2026; recheck before booking"), FX used, image credits list (author, license, link) for every image.

## Map (viz.js)
- d3-geo `geoMercator` fitted to South Korea; SVG, responsive (viewBox), zoom/pan with d3-zoom (buttons: "Whole trip", "+", "−").
- Layers: sea background (--sea-soft), neighbors land (--land, no labels), South Korea provinces (--card fill, --line stroke), municipality boundaries thin (shown more at higher zoom), optional Han River polygon (--sea-soft).
- Route: base-to-base links per selected option, styled by mode (rail = solid celadon, bus = dashed sea, flight = dotted arc, KTX-Eum coast segment along the coast if simple). Base markers with name + nights.
- Day focus: numbered pins (ink fill, paper text) for that day's located items, drawn in order with a thin connector; zoom to their bounds (with padding, max zoom cap). Hover/focus/tap a pin → small card with photo, title, time.
- Stroke widths and label sizes scale inversely with zoom (vector-effect: non-scaling-stroke).

## Interface between files
- `geo.js` defines `window.GEO = { provinces: GeoJSON FeatureCollection, municipalities: GeoJSON FeatureCollection, neighbors: GeoJSON FeatureCollection, hanRiver: GeoJSON | null }`.
- `data.js` defines `window.TRIP` (see data-contract.md).
- `viz.js` defines `window.Viz = { initMap(container), setOption(option), focusDay(dateStr|null), renderFoliage(container, option), renderEvents(container, option) }`.
- `app.js` owns state, rendering of everything else, and calls Viz.
