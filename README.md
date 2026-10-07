# Korea Autumn 2026

An interactive trip planner for three travelers from Newark: Korea, **Sat Oct 17 – Sun Oct 25, 2026** (Air Premia, lands ICN 05:15, departs ICN 21:55). Budget target: under US$1,000 per person for lodging, transport inside Korea and paid activities (food excluded).

Open **`dist/index.html`** in a browser (it needs internet for d3 and fonts). The same page is published as a claude.ai artifact.

## The four options

| Option | Route (nights) | Pace | Per person, value / sweet / splurge* |
|---|---|---|---|
| **Classic** (recommended) | Seoul 3 → Gyeongju 2 → Busan 3 | balanced | US$770 / $873 / $1,285 |
| **Foliage** | Seoul 2 → Seoraksan 2 → Gangneung 2 → Seoul 2 | balanced | US$864 / $927 / $1,185 |
| **Grand loop** | Seoul 2 → Seoraksan 2 → Gyeongju 1 → Busan 3 | packed | US$808 / $935 / $1,318 |
| **Island** | Seoul 3 → Jeju 3 → Busan 2 | balanced | US$895 / $998 / $1,496 |

\*Lodging + intercity transport + local transit + paid activities, 8 nights. Booking the night of Oct 16 (so the room is ready at dawn) adds about US$85-140 per person; the page has a toggle for it. FX 1 USD = 1,340 KRW.

Every option has day-by-day timetables with costs, map pins, food picks and rainy-day swaps; 2-3 lodging tiers per stop with live-checked availability (Oct 6 2026); a budget calculator; a foliage-timing chart and events calendar; Japan → Korea matches (Kamakura, Shibuya, Izu ryokan, sushi omakase); and a book-now checklist.

**Book first, whichever option:** the Huwon (Secret Garden) tickets open Mon Oct 12, 10:00 KST (Sun Oct 11, 21:00 New York time); hotels are very thin (many were already sold out on Oct 6); Ragung in Gyeongju has rooms only on Wed Oct 21; Sunday KTX trains to Seoul sell out.

## Layout

- `site/`: page sources. `index.html` + `app.js` (page and logic), `viz.js` + `viz.css` (map, foliage chart, events strip), `data.js` (generated trip data), `geo.js` (map geometry).
- `dist/`: single-file builds. `index.html` opens from disk; `korea-autumn-2026.html` is the artifact body.
- `scratchpad/research/`: raw research (JSON per region/topic; `followup-*` files are later, live-checked corrections).
- `scratchpad/plan/`: `brief.md` (planning brief and option schema), `catalog.json` (merged research), `build-*.mjs` (one builder per option, plus `build-guide.mjs` and `build-data.mjs`), `validate.mjs`.
- `tools/build.sh`: rebuild everything; `tools/shot.mjs`: Playwright screenshots (desktop/phone, light/dark).

```sh
tools/build.sh                       # plan JSON -> site/data.js -> dist/
node tools/shot.mjs index.html /tmp/shots --full
```

## Caveats

- Prices and availability were live-checked on Oct 6-7, 2026, except Jeju hotels, which are estimates. Recheck before booking.
- No photos: image hosts were blocked in the build environment, so places use drawn vignettes, with links to Naver and Google photo searches and maps.
- Train times come from the Oct 7-13 Korail timetable; confirm them for your dates in Korail+.
- Map data: KOSTAT boundaries via southkorea-maps, Natural Earth via world-atlas, Han River © OpenStreetMap contributors (ODbL).
