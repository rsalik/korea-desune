/* viz.js - route map, foliage chart and events strip for the Korea Autumn 2026 trip planner.
 * Plain ES2020 script. Needs global d3 v7 (loaded first), window.GEO (geo.js) and window.TRIP (data.js).
 * Public API: window.Viz = { initMap, setOption, focusDay, renderFoliage, renderEvents, onPin }.
 * Every CSS class is prefixed `vz-` and styled in viz.css; colors come only from the page's CSS tokens. */
(function () {
  'use strict';

  const d3 = window.d3;
  if (!d3) console.error('viz.js: d3 must be loaded before viz.js');

  /* ------------------------------------------------------------------ constants */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICN = { name: 'Incheon Airport', code: 'ICN', lat: 37.4492, lon: 126.4508 };
  const MAX_ZOOM = 40;        // d3.zoom scaleExtent upper bound
  const MAX_DAY_K = 28;       // cap when zooming to a day's pins
  const SINGLE_PIN_K = 12;    // zoom used when a day has one pin location only
  const MAX_TRIP_K = 6;       // cap for the whole-trip view
  const MUNI_K = 2.5;         // municipality boundaries appear above this zoom
  const ZOOM_MS = 600;
  const DAY_MS = 864e5;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];

  /* ------------------------------------------------------------------ small helpers */
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const trip = () => window.TRIP || {};

  function debounce(fn, ms) {
    let t = 0;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
  }

  function setAttrs(el, attrs) {
    if (!attrs) return el;
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    return el;
  }
  function addKids(el, kids) {
    if (kids == null) return el;
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return el;
  }
  const h = (tag, attrs, kids) => addKids(setAttrs(document.createElement(tag), attrs), kids);
  const s = (tag, attrs, kids) => addKids(setAttrs(document.createElementNS(SVG_NS, tag), attrs), kids);

  /* dates are handled as UTC midnight milliseconds so there is no timezone drift */
  function utc(iso) {
    const p = String(iso).slice(0, 10).split('-').map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }
  const monthDay = (ms) => { const d = new Date(ms); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  function monthDayRange(a, b) {
    if (a === b) return monthDay(a);
    const da = new Date(a), db = new Date(b);
    return da.getUTCMonth() === db.getUTCMonth() ? monthDay(a) + '–' + db.getUTCDate() : monthDay(a) + '–' + monthDay(b);
  }
  const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, t = Math.PI / 180;
    const dLat = (lat2 - lat1) * t, dLon = (lon2 - lon1) * t;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function clip(text, n) {
    const t = String(text == null ? '' : text).trim();
    if (t.length <= n) return t;
    const cut = t.slice(0, n);
    const sp = cut.lastIndexOf(' ');
    return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, '') + '…';
  }

  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const baseKey = (name) => String(name == null ? '' : name).toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

  /* Re-render charts when their container's width changes (debounced). */
  const watched = new Map();
  let resizeObs = null;
  function watchWidth(container, fn) {
    const rec = watched.get(container) || { timer: 0, w: 0 };
    rec.fn = fn;
    rec.w = Math.round(container.getBoundingClientRect().width);
    watched.set(container, rec);
    const check = (w) => {
      if (!container.isConnected) { watched.delete(container); if (resizeObs) resizeObs.unobserve(container); return; }
      if (Math.abs(w - rec.w) <= 1) return;
      rec.w = w;
      clearTimeout(rec.timer);
      rec.timer = setTimeout(() => { try { rec.fn(); } catch (e) { console.error(e); } }, 150);
    };
    rec.check = check;
    if ('ResizeObserver' in window) {
      if (!resizeObs) {
        resizeObs = new ResizeObserver((entries) => {
          entries.forEach((en) => { const r = watched.get(en.target); if (r) r.check(Math.round(en.contentRect.width)); });
        });
      }
      resizeObs.observe(container);
    }
  }
  window.addEventListener('resize', debounce(() => {
    watched.forEach((rec, c) => rec.check(Math.round(c.getBoundingClientRect().width)));
  }, 150));

  /* ================================================================== MAP ==================================================================== */

  const S = { option: null, focus: null };   // survives initMap() being called again
  let M = null;                              // live map instance

  /* ----- model: bases, links, ICN ----------------------------------------------------------------------------------------------------------- */
  function legMinutes(l) {
    const p = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const a = p(l.dep), b = p(l.arr);
    if (a == null || b == null) return 0;
    return (b - a + 1440) % 1440;
  }
  function pickLeg(option, date, fromName, toName) {
    const same = (option.transport || []).filter((t) => t.date === date);
    const legs = same.filter((t) => !/^(taxi|arex)/i.test(t.mode || ''));
    if (!legs.length) return same.find((t) => /^taxi/i.test(t.mode || '')) || null;   // taxi-only day: drawn as a car link
    const toks = (n) => String(n || '').toLowerCase().replace(/\(.*?\)/g, ' ').split(/[\/,&]/).map((x) => x.trim()).filter((x) => x.length > 2);
    const f = toks(fromName), t = toks(toName);
    const has = (text, list) => list.some((x) => String(text || '').toLowerCase().includes(x));
    const score = (l) => (has(l.from, f) ? 1 : 0) + (has(l.to, t) ? 1 : 0) + (has(l.to, f) ? 0.5 : 0) + (has(l.from, t) ? 0.5 : 0);
    const best = Math.max.apply(null, legs.map(score));
    const pool = best > 0 ? legs.filter((l) => score(l) === best) : legs;
    return pool.reduce((a, b) => (legMinutes(b) > legMinutes(a) ? b : a), pool[0]);
  }
  function modeStyle(mode) {
    const m = String(mode || '');
    if (/ktx|itx|srt|mugunghwa|rail|train/i.test(m)) return 'rail';
    if (/bus/i.test(m)) return 'bus';
    if (/fl(y|ight)|air(?!port)/i.test(m)) return 'flight';
    if (/ferry|boat|ship/i.test(m)) return 'ferry';
    if (/car|drive|taxi/i.test(m)) return 'car';
    return 'rail';
  }
  const STYLE_LABEL = { rail: 'Rail', bus: 'Bus', flight: 'Flight', ferry: 'Ferry', car: 'Car' };

  function buildModel(option) {
    const route = (option.route || []).filter((r) => isNum(r.lat) && isNum(r.lon));
    const bases = [], byKey = new Map();
    route.forEach((r) => {
      const key = baseKey(r.base);
      let b = byKey.get(key);
      if (!b) { b = { key, name: r.base, lat: r.lat, lon: r.lon, nights: [] }; byKey.set(key, b); bases.push(b); }
      b.nights.push(r.nights);
    });
    const links = [], seen = new Map();
    for (let i = 0; i < route.length - 1; i++) {
      const a = byKey.get(baseKey(route[i].base)), b = byKey.get(baseKey(route[i + 1].base));
      if (a === b) continue;
      const date = route[i + 1].from;
      const leg = pickLeg(option, date, a.name, b.name);
      const style = leg ? modeStyle(leg.mode) : 'rail';
      const pair = a.key < b.key ? a.key + '|' + b.key : b.key + '|' + a.key;
      const prior = seen.get(pair) || [];
      if (prior.includes(style)) continue;            // same pair, same style: already drawn
      links.push({ a, b, style, leg, date, bend: prior.length });
      prior.push(style);
      seen.set(pair, prior);
    }
    const icnTargets = [];
    if (route.length) {
      const first = byKey.get(baseKey(route[0].base)), last = byKey.get(baseKey(route[route.length - 1].base));
      icnTargets.push(first);
      if (last !== first) icnTargets.push(last);
    }
    return { bases, links, icnTargets };
  }

  function nightsLabel(b) {
    return b.nights.length === 1 ? plural(b.nights[0], 'night') : b.nights.join(' + ') + ' nights';
  }

  function dayModel(option, date) {
    const day = option && (option.days || []).find((d) => d.date === date);
    if (!day) return null;
    const located = [];
    (day.items || []).forEach((it, idx) => {
      if (isNum(it.lat) && isNum(it.lon)) located.push({ item: it, idx, rank: located.length + 1 });
    });
    const groups = [], byPos = new Map();
    located.forEach((l) => {
      const key = l.item.lat.toFixed(4) + ',' + l.item.lon.toFixed(4);
      let g = byPos.get(key);
      if (!g) { g = { key, lat: l.item.lat, lon: l.item.lon, entries: [] }; byPos.set(key, g); groups.push(g); }
      g.entries.push(l);
    });
    groups.forEach((g) => { g.label = groupLabel(g.entries.map((e) => e.rank)); });
    const food = (day.food || []).filter((f) => isNum(f.lat) && isNum(f.lon));
    return { day, located, groups, food };
  }
  function groupLabel(ranks) {
    if (ranks.length === 1) return String(ranks[0]);
    if (ranks.length <= 3) return ranks.join('·');
    return ranks[0] + '–' + ranks[ranks.length - 1];
  }

  /* ----- build / destroy ------------------------------------------------------------------------------------------------------------------ */
  function destroyMap() {
    if (!M) return;
    try { M.ro && M.ro.disconnect(); } catch (e) { /* ignore */ }
    clearTimeout(M.resizeTimer);
    clearTimeout(M.hintTimer);
    if (M.root && M.root.parentNode) M.root.parentNode.removeChild(M.root);
    M = null;
  }

  function initMap(container) {
    if (!container || !d3) return;
    destroyMap();
    container.classList.add('vz-host');

    const root = h('div', { class: 'vz-map' });
    const svg = s('svg', {
      class: 'vz-svg', role: 'group', 'aria-label': 'Route map of South Korea',
      preserveAspectRatio: 'xMidYMid meet', width: '100%', height: '100%',
    });
    const sea = s('rect', { class: 'vz-sea', x: 0, y: 0, width: 10, height: 10 });
    const world = s('g', { class: 'vz-world' });
    const L = {};
    ['neighbors', 'prov', 'muni', 'han', 'links', 'bases', 'conn', 'food', 'pins'].forEach((n) => {
      L[n] = s('g', { class: 'vz-l-' + n });
      world.appendChild(L[n]);
    });
    svg.appendChild(sea);
    svg.appendChild(world);

    const card = h('div', { class: 'vz-card', role: 'tooltip', id: 'vz-card' });
    const hint = h('div', { class: 'vz-hint', 'aria-hidden': 'true', text: 'Hold Ctrl (⌘) and scroll to zoom the map' });
    const legend = h('ul', { class: 'vz-maplegend', 'aria-label': 'Line styles' });

    const btn = (id, label, text, cls, fn) => h('button', { type: 'button', id, class: 'vz-btn ' + cls, 'aria-label': label, onclick: fn, text });
    const ctl = h('div', { class: 'vz-ctl', role: 'group', 'aria-label': 'Map zoom' }, [
      btn('vz-zoom-whole', 'Zoom to whole trip', 'Whole trip', 'vz-btn--wide', () => goTo(viewWhole(), true)),
      btn('vz-zoom-in', 'Zoom in', '+', '', () => nudge(1.7)),
      btn('vz-zoom-out', 'Zoom out', '−', '', () => nudge(1 / 1.7)),
    ]);

    root.appendChild(svg);
    root.appendChild(ctl);
    root.appendChild(legend);
    root.appendChild(hint);
    root.appendChild(card);
    container.appendChild(root);

    M = {
      host: container, root, svg, sea, world, L, card, hint, legend,
      w: 0, h: 0, ready: false, proj: null, path: null,
      t: d3.zoomIdentity, zoomed: false, muniBuilt: false, drewOnce: false,
      model: null, routeItems: [], dayItems: [], pins: [], dayData: null,
      shownPin: null, animFor: undefined, resizeTimer: 0, hintTimer: 0,
    };

    M.zoom = d3.zoom()
      .scaleExtent([1, MAX_ZOOM])
      .filter((ev) => {
        if (ev.type === 'wheel') {           // plain scrolling keeps scrolling the page; Ctrl/⌘ + wheel (and trackpad pinch) zooms
          if (ev.ctrlKey || ev.metaKey) return true;
          flashHint();
          return false;
        }
        return !ev.ctrlKey && !ev.button;
      })
      .on('start', () => hideCard())
      .on('zoom', onZoom)
      .on('end', () => { relaxPins(); });
    d3.select(svg).call(M.zoom);
    svg.addEventListener('pointerdown', (e) => { if (!e.target.closest || !e.target.closest('.vz-pin')) hideCard(); });
    svg.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCard(); });

    M.model = S.option ? buildModel(S.option) : null;
    if ('ResizeObserver' in window) {
      M.ro = new ResizeObserver(() => { clearTimeout(M.resizeTimer); M.resizeTimer = setTimeout(layout, 120); });
      M.ro.observe(container);
    } else {
      window.addEventListener('resize', debounce(layout, 150));
    }
    layout(true);
  }

  function flashHint() {
    if (!M) return;
    M.hint.classList.add('is-on');
    clearTimeout(M.hintTimer);
    M.hintTimer = setTimeout(() => M && M.hint.classList.remove('is-on'), 1400);
  }

  /* ----- layout (runs on init and when the container is resized) --------------------------------------------------------------- */
  function layout(force) {
    if (!M) return;
    const r = M.host.getBoundingClientRect();
    const w = Math.round(r.width), hgt = Math.round(r.height);
    if (w < 40 || hgt < 40) { M.ready = false; return; }
    if (M.ready && !force && Math.abs(w - M.w) < 2 && Math.abs(hgt - M.h) < 2) return;
    M.w = w; M.h = hgt; M.ready = true;
    M.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    M.sea.setAttribute('width', w); M.sea.setAttribute('height', hgt);
    M.zoom.extent([[0, 0], [w, hgt]]).translateExtent([[-w * 0.3, -hgt * 0.3], [w * 1.3, hgt * 1.3]]);
    projectGeo();
    drawStatic();
    drawRoute();
    drawDay();
    applyView(M.drewOnce && !force);
    M.drewOnce = true;
  }

  function projectGeo() {
    const pad = 16, GEO = window.GEO;
    let proj = d3.geoMercator();
    if (GEO && GEO.provinces && GEO.provinces.features) {
      proj = proj.fitExtent([[pad, pad], [M.w - pad, M.h - pad]], { type: 'FeatureCollection', features: GEO.provinces.features });
    } else {
      proj = proj.center([127.8, 36]).scale(M.h * 7).translate([M.w / 2, M.h / 2]);
    }
    M.proj = proj;
    // Planar path through the projection. geo.js polygons are not wound for d3's spherical rules
    // (neighbors/municipalities/han), so we skip the spherical machinery and fill with evenodd in CSS.
    const tf = d3.geoTransform({ point(x, y) { const p = proj([x, y]); if (p) this.stream.point(p[0], p[1]); } });
    M.path = d3.geoPath(tf);
  }

  const proj1 = (lon, lat) => M.proj([lon, lat]);

  function drawStatic() {
    const GEO = window.GEO || {}, L = M.L, path = M.path;
    if (!L.neighbors.firstChild && GEO.neighbors) {
      GEO.neighbors.features.forEach((f) => L.neighbors.appendChild(s('path', { class: 'vz-neighbor' })));
    }
    if (!L.prov.firstChild && GEO.provinces) {
      GEO.provinces.features.forEach((f) => L.prov.appendChild(s('path', { class: 'vz-prov' })));
    }
    if (!L.han.firstChild && GEO.hanRiver) L.han.appendChild(s('path', { class: 'vz-han' }));
    if (GEO.neighbors) [...L.neighbors.children].forEach((p, i) => p.setAttribute('d', path(GEO.neighbors.features[i]) || ''));
    if (GEO.provinces) [...L.prov.children].forEach((p, i) => p.setAttribute('d', path(GEO.provinces.features[i]) || ''));
    if (GEO.hanRiver && L.han.firstChild) L.han.firstChild.setAttribute('d', path(GEO.hanRiver) || '');
    M.L.muni.replaceChildren();
    M.muniBuilt = false;                               // rebuilt lazily for the new projection
    if (M.zoomed) ensureMuni();
  }
  function buildMuni() {
    const GEO = window.GEO || {};
    M.L.muni.replaceChildren();
    if (!GEO.municipalities) return;
    M.L.muni.appendChild(s('path', { class: 'vz-muni', d: M.path(GEO.municipalities) || '' }));
    M.muniBuilt = true;
  }
  function ensureMuni() { if (!M.muniBuilt) buildMuni(); }

  /* ----- route: bases, links, ICN -------------------------------------------------------------------------------------------------- */
  function linkD(p0, p1, style, bend) {
    const x0 = p0[0], y0 = p0[1], x1 = p1[0], y1 = p1[1];
    if (style !== 'flight' && !bend) return 'M' + x0 + ',' + y0 + 'L' + x1 + ',' + y1;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; }                      // bulge toward the north
    const amt = (style === 'flight' ? 0.2 : 0.14) * len * (bend ? (bend % 2 ? 1 : -1) : 1);
    const cx = (x0 + x1) / 2 + nx * amt, cy = (y0 + y1) / 2 + ny * amt;
    return 'M' + x0 + ',' + y0 + 'Q' + cx + ',' + cy + ' ' + x1 + ',' + y1;
  }

  function drawRoute() {
    const L = M.L;
    L.links.replaceChildren();
    L.bases.replaceChildren();
    M.routeItems = [];
    M.legend.replaceChildren();
    const model = M.model;
    if (!model || !model.bases.length) { applyScale(); return; }

    const icnP = proj1(ICN.lon, ICN.lat);
    const used = new Set();
    // ICN dotted links first (drawn under the real links)
    model.icnTargets.forEach((b) => {
      const p = proj1(b.lon, b.lat);
      L.links.appendChild(s('path', { class: 'vz-link vz-link--icn', d: linkD(icnP, p, 'rail', 0) }, [s('title', { text: 'Incheon Airport (ICN) to ' + b.name })]));
    });
    model.links.forEach((lk) => {
      const pa = proj1(lk.a.lon, lk.a.lat), pb = proj1(lk.b.lon, lk.b.lat);
      const leg = lk.leg;
      const tip = lk.a.name + ' → ' + lk.b.name + ' · ' + (leg ? [leg.mode, leg.dep && leg.arr ? leg.dep + '–' + leg.arr : '', leg.duration].filter(Boolean).join(' ') : STYLE_LABEL[lk.style]);
      L.links.appendChild(s('path', { class: 'vz-link vz-link--' + lk.style, d: linkD(pa, pb, lk.style, lk.bend) }, [s('title', { text: tip })]));
      used.add(lk.style);
    });

    // base markers
    model.bases.forEach((b) => {
      const p = proj1(b.lon, b.lat);
      const g = s('g', { class: 'vz-base' });
      const text = s('text', { class: 'vz-label', x: 12, y: 0, 'text-anchor': 'start', 'dominant-baseline': 'central' }, [
        s('tspan', { class: 'vz-label-name', text: b.name }),
        s('tspan', { class: 'vz-label-sub', text: ' · ' + nightsLabel(b) }),
      ]);
      g.appendChild(s('title', { text: b.name + ' · ' + nightsLabel(b) }));
      g.appendChild(s('circle', { class: 'vz-base-dot', r: 6.5 }));
      g.appendChild(text);
      L.bases.appendChild(g);
      let lw = 0;
      try { lw = text.getComputedTextLength(); } catch (e) { /* not rendered yet */ }
      if (!lw) lw = b.name.length * 7.6 + nightsLabel(b).length * 6.6 + 14;
      M.routeItems.push({ el: g, x: p[0], y: p[1], label: text, side: 'right', lw });
    });
    // ICN marker
    {
      const g = s('g', { class: 'vz-base vz-icn' });
      const text = s('text', { class: 'vz-label vz-label--icn', x: -10, y: 0, 'text-anchor': 'end', 'dominant-baseline': 'central', text: ICN.code });
      g.appendChild(s('title', { text: ICN.name + ' (' + ICN.code + ')' }));
      g.appendChild(s('circle', { class: 'vz-icn-dot', r: 4.5 }));
      g.appendChild(text);
      L.bases.appendChild(g);
      M.routeItems.push({ el: g, x: icnP[0], y: icnP[1], label: text, side: 'left', fixed: true });
    }

    // legend: only the line styles in use
    const sw = (cls, label) => h('li', { class: 'vz-maplegend-item' }, [h('span', { class: 'vz-swatch vz-swatch--' + cls, 'aria-hidden': 'true' }), label]);
    ['rail', 'bus', 'flight', 'ferry', 'car'].forEach((k) => { if (used.has(k)) M.legend.appendChild(sw(k, STYLE_LABEL[k])); });
    M.legend.appendChild(sw('icn', 'Airport'));
    applyScale();
  }

  /* ----- day focus: pins, connector, food ---------------------------------------------------------------------------------------- */
  function drawDay() {
    const L = M.L;
    L.conn.replaceChildren(); L.food.replaceChildren(); L.pins.replaceChildren();
    M.dayItems = []; M.pins = []; M.dayData = null;
    hideCard();
    M.root.classList.remove('vz-focused');
    if (!S.option || !S.focus) { applyScale(); return; }
    const dm = dayModel(S.option, S.focus);
    if (!dm) { applyScale(); return; }
    M.dayData = dm;
    if (!dm.groups.length) { applyScale(); return; }
    M.root.classList.add('vz-focused');

    // connector polyline in item order (consecutive duplicates collapsed)
    const pts = [];
    dm.located.forEach((l) => {
      const p = proj1(l.item.lon, l.item.lat);
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 1e-6) pts.push(p);
    });
    if (pts.length > 1) L.conn.appendChild(s('path', { class: 'vz-connector', d: 'M' + pts.map((p) => p[0] + ',' + p[1]).join('L') }));

    // food stops (small dots, no numbers)
    dm.food.forEach((f) => {
      const p = proj1(f.lon, f.lat);
      const g = s('g', { class: 'vz-food' }, [
        s('title', { text: (f.meal ? f.meal.charAt(0).toUpperCase() + f.meal.slice(1) + ': ' : '') + f.name + (f.name_ko ? ' (' + f.name_ko + ')' : '') }),
        s('circle', { class: 'vz-food-dot', r: 4.5 }),
      ]);
      L.food.appendChild(g);
      M.dayItems.push({ el: g, x: p[0], y: p[1] });
    });

    // numbered pins
    dm.groups.forEach((grp) => {
      const p = proj1(grp.lon, grp.lat);
      const pill = grp.label.length > 2;
      const wPill = pill ? Math.round(14 + grp.label.length * 6.4) : 22;
      const body = s('g', { class: 'vz-pin-body' });
      body.appendChild(pill
        ? s('rect', { class: 'vz-pin-ring', x: -wPill / 2 - 4, y: -15, width: wPill + 8, height: 30, rx: 15 })
        : s('circle', { class: 'vz-pin-ring', r: 15 }));
      body.appendChild(pill
        ? s('rect', { class: 'vz-pin-bg', x: -wPill / 2, y: -11, width: wPill, height: 22, rx: 11 })
        : s('circle', { class: 'vz-pin-bg', r: 11 }));
      body.appendChild(s('text', { class: 'vz-pin-num', x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', text: grp.label }));
      const stem = s('line', { class: 'vz-pin-stem', x1: 0, y1: 0, x2: 0, y2: 0 });
      const dot = s('circle', { class: 'vz-pin-dot', r: 2.5 });
      const aria = grp.entries.map((e) => e.rank + '. ' + (e.item.time ? e.item.time + ' ' : '') + e.item.title).join('; ');
      const g = s('g', { class: 'vz-pin', tabindex: 0, role: 'button', 'aria-label': aria }, [stem, dot, body]);
      const pin = { grp, el: g, body, stem, dot, x: p[0], y: p[1], dx: 0, dy: 0, r: pill ? wPill / 2 : 11 };
      g.addEventListener('pointerenter', (e) => { pin.ptr = e.pointerType; showCard(pin); });
      g.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && M.shownPin === pin && document.activeElement !== g) hideCard(); });
      g.addEventListener('focus', () => showCard(pin));
      g.addEventListener('blur', () => { if (M.shownPin === pin) hideCard(); });
      g.addEventListener('click', (e) => { e.stopPropagation(); showCard(pin); activatePin(pin); });
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCard(pin); activatePin(pin); }
        else if (e.key === 'Escape') { hideCard(); }
      });
      L.pins.appendChild(g);
      M.pins.push(pin);
      M.dayItems.push({ el: g, x: p[0], y: p[1] });
    });
    applyScale();
  }

  function activatePin(pin) {
    const fn = window.Viz && window.Viz.onPin;
    if (typeof fn === 'function') {
      try { fn(S.focus, pin.grp.entries[0].idx); } catch (err) { console.error(err); }
    }
  }

  /* Pins that would overlap on screen are nudged apart (in screen px), with a stem back to the true location. */
  function relaxPins(t) {
    if (!M || !M.pins.length) return;
    t = t && t.k ? t : M.t;
    const k = t.k;
    const P = M.pins.map((p) => ({ x: p.x * k, y: p.y * k, dx: 0, dy: 0, r: p.r }));
    for (let it = 0; it < 60; it++) {
      let moved = false;
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          let ax = P[i].x + P[i].dx - (P[j].x + P[j].dx), ay = P[i].y + P[i].dy - (P[j].y + P[j].dy);
          let dist = Math.hypot(ax, ay);
          const min = P[i].r + P[j].r + 3;
          if (dist >= min) continue;
          if (dist < 0.01) { const a = (i * 2.399) + j; ax = Math.cos(a); ay = Math.sin(a); dist = 1; }
          const push = (min - dist) / 2 + 0.01, ux = ax / dist, uy = ay / dist;
          P[i].dx += ux * push; P[i].dy += uy * push;
          P[j].dx -= ux * push; P[j].dy -= uy * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
    M.pins.forEach((pin, i) => {
      let dx = P[i].dx, dy = P[i].dy;
      const mag = Math.hypot(dx, dy);
      if (mag > 70) { dx *= 70 / mag; dy *= 70 / mag; }
      // keep the displaced pin inside the visible map
      const m = pin.r + 6;
      dx = clamp(t.applyX(pin.x) + dx, m, M.w - m) - t.applyX(pin.x);
      dy = clamp(t.applyY(pin.y) + dy, m, M.h - m) - t.applyY(pin.y);
      pin.dx = dx; pin.dy = dy;
      pin.body.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')');
      pin.stem.setAttribute('x2', dx.toFixed(1)); pin.stem.setAttribute('y2', dy.toFixed(1));
      pin.el.classList.toggle('is-displaced', Math.hypot(dx, dy) > 4);
    });
  }

  /* ----- hover / focus card -------------------------------------------------------------------------------------------------------------- */
  function showCard(pin) {
    const card = M.card;
    M.shownPin = pin;
    card.replaceChildren();
    const entries = pin.grp.entries.slice(0, 3);
    const many = pin.grp.entries.length > 1;
    entries.forEach((e) => {
      const it = e.item;
      const time = (it.time || '') + (it.end ? '–' + it.end : '');
      card.appendChild(h('div', { class: 'vz-card-item' }, [
        h('div', { class: 'vz-card-time', text: e.rank + (time ? ' · ' + time : '') }),
        h('div', { class: 'vz-card-title', text: it.title || '' }),
        it.kind ? h('div', { class: 'vz-card-kind', text: it.kind }) : null,
        it.detail ? h('p', { class: 'vz-card-detail', text: clip(it.detail, many ? 90 : 140) }) : null,
      ]));
    });
    if (pin.grp.entries.length > entries.length) card.appendChild(h('div', { class: 'vz-card-kind', text: '+' + (pin.grp.entries.length - entries.length) + ' more here' }));
    card.classList.add('is-on');
    pin.el.setAttribute('aria-describedby', 'vz-card');
    positionCard(pin);
  }
  function positionCard(pin) {
    const card = M.card, W = M.w, H = M.h;
    const sx = M.t.applyX(pin.x) + pin.dx, sy = M.t.applyY(pin.y) + pin.dy;
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = pin.r + 10;
    let left = sx - cw / 2;
    let top = sy - ch - gap;
    if (top < 8) top = sy + gap;                               // not enough room above: go below
    if (top + ch > H - 8) top = Math.max(8, H - ch - 8);
    left = clamp(left, 8, Math.max(8, W - cw - 8));
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
  }
  function hideCard() {
    if (!M) return;
    M.card.classList.remove('is-on');
    if (M.shownPin) { M.shownPin.el.removeAttribute('aria-describedby'); M.shownPin = null; }
  }

  /* ----- zoom handling --------------------------------------------------------------------------------------------------------------------- */
  function onZoom(ev) {
    M.t = ev.transform;
    M.world.setAttribute('transform', M.t.toString());
    const z = M.t.k > MUNI_K;
    if (z !== M.zoomed) { M.zoomed = z; M.root.classList.toggle('vz-zoomed', z); }
    if (z) ensureMuni();
    applyScale();
  }
  function applyScale() {
    if (!M) return;
    const inv = 1 / M.t.k, W = M.w;
    const place = (n) => n.el.setAttribute('transform', 'translate(' + n.x.toFixed(2) + ' ' + n.y.toFixed(2) + ') scale(' + inv.toFixed(5) + ')');
    M.routeItems.forEach((n) => {
      place(n);
      if (n.label && !n.fixed) {                       // keep base labels inside the map: flip to the left near the right edge
        const side = M.t.applyX(n.x) + 12 + n.lw + 8 > W ? 'left' : 'right';
        if (side !== n.side) {
          n.side = side;
          n.label.setAttribute('x', side === 'right' ? 12 : -12);
          n.label.setAttribute('text-anchor', side === 'right' ? 'start' : 'end');
        }
      }
    });
    M.dayItems.forEach(place);
  }
  function nudge(f) {
    if (!M) return;
    const sel = d3.select(M.svg);
    if (reducedMotion()) sel.call(M.zoom.scaleBy, f); else sel.transition().duration(250).call(M.zoom.scaleBy, f);
  }
  function goTo(t, animate) {
    if (!M || !M.ready || !t) return;
    const sel = d3.select(M.svg);
    sel.interrupt();
    if (animate && !reducedMotion()) sel.transition().duration(ZOOM_MS).ease(d3.easeCubicInOut).call(M.zoom.transform, t);
    else sel.call(M.zoom.transform, t);
  }

  /* Transform that fits a set of world points (k = 1 coordinates) into the padded viewport. */
  function fitPoints(pts, pad, maxK, singleK) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    const aw = Math.max(40, M.w - pad.l - pad.r), ah = Math.max(40, M.h - pad.t - pad.b);
    const dx = x1 - x0, dy = y1 - y0;
    let k;
    if (dx < 1e-6 && dy < 1e-6) k = singleK;
    else k = Math.min(maxK, dx < 1e-6 ? Infinity : aw / dx, dy < 1e-6 ? Infinity : ah / dy);
    k = clamp(k, 1, MAX_ZOOM);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return d3.zoomIdentity.translate(pad.l + aw / 2 - k * cx, pad.t + ah / 2 - k * cy).scale(k);
  }
  function viewWhole() {
    const pts = [proj1(ICN.lon, ICN.lat)];
    if (M.model) M.model.bases.forEach((b) => pts.push(proj1(b.lon, b.lat)));
    if (pts.length === 1 && window.GEO && window.GEO.provinces) return d3.zoomIdentity;
    const lab = M.routeItems.reduce((m, n) => (n.lw && !n.fixed ? Math.max(m, n.lw) : m), 0);
    const padR = clamp(lab + 30, 70, M.w * 0.45);
    return fitPoints(pts, { l: Math.min(44, M.w * 0.1), r: padR, t: 60, b: 48 }, MAX_TRIP_K, 4);
  }
  function viewDay() {
    const dm = M.dayData;
    if (!dm || !dm.groups.length) return null;
    const pts = dm.groups.map((g) => proj1(g.lon, g.lat));
    const px = Math.min(48, M.w * 0.1);
    return fitPoints(pts, { l: px, r: px, t: 60, b: 52 }, MAX_DAY_K, SINGLE_PIN_K);
  }
  /* Apply the view for the current state: day pins if a day is focused, otherwise the whole trip. */
  function applyView(animate) {
    if (!M || !M.ready) return;
    const t = (S.focus && viewDay()) || viewWhole();
    M.animFor = S.focus || null;
    // positions of pins depend on the zoom they will be seen at
    relaxPins(t);
    goTo(t, animate);
  }

  /* ----- public map API ---------------------------------------------------------------------------------------------------------------- */
  function setOption(option) {
    S.option = option || null;
    S.focus = null;
    if (!M) return;
    M.model = S.option ? buildModel(S.option) : null;
    if (!M.ready) return;
    drawRoute();
    drawDay();
    applyView(M.drewOnce);
    M.drewOnce = true;
  }
  function focusDay(date) {
    const next = date || null;
    const same = next === S.focus && M && M.animFor === next;
    S.focus = next;
    if (!M || !M.ready) return;
    if (same && next && M.pins.length) return;           // already showing this day
    drawDay();
    applyView(true);
  }

  /* ================================================================== FOLIAGE CHART ================================================================== */

  const FOL = { selected: null };
  let measureCtx = null;
  function textWidth(text, font) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }
  function wrapText(text, maxW, font, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    words.forEach((wd) => {
      const t = cur ? cur + ' ' + wd : wd;
      if (!cur || textWidth(t, font) * 1.05 <= maxW) cur = t; else { lines.push(cur); cur = wd; }
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      let last = lines.slice(maxLines - 1).join(' ');
      while (last.length > 1 && textWidth(last + '…', font) * 1.05 > maxW) last = last.slice(0, -1).trimEnd();
      lines.length = maxLines;
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }
  function bodyFont() {
    const f = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim();
    return f || 'system-ui, sans-serif';
  }

  function foliageKind(k) {
    return k === 'ginkgo' ? 'ginkgo' : k === 'silver-grass' ? 'grass' : 'maple';
  }

  /* Which dates does `option` put you at this foliage row? place_id match, or any located item within 20 km. */
  function visitedDates(option, row) {
    const out = [];
    if (!option) return out;
    const ids = row.place_ids || [];
    (option.days || []).forEach((day) => {
      const hit = (day.items || []).some((it) => (it.place_id && ids.includes(it.place_id))
        || (isNum(it.lat) && isNum(it.lon) && isNum(row.lat) && isNum(row.lon) && haversineKm(it.lat, it.lon, row.lat, row.lon) <= 20));
      if (hit) out.push(day.date);
    });
    return out;
  }

  function renderFoliage(container, option) {
    if (!container) return;
    const draw = () => drawFoliage(container, option);
    draw();
    watchWidth(container, draw);
  }

  function drawFoliage(container, option) {
    const T = trip();
    const rows = (T.foliage || []).slice().sort((a, b) => String(a.peak_start).localeCompare(String(b.peak_start)) || String(a.first_color).localeCompare(String(b.first_color)));
    container.replaceChildren();
    const root = h('div', { class: 'vz-fol' });
    container.appendChild(root);

    const year = T.meta && T.meta.start ? new Date(utc(T.meta.start)).getUTCFullYear() : 2026;
    const t0 = Date.UTC(year, 9, 1), t1 = Date.UTC(year, 10, 21);    // Oct 1 .. end of Nov 20
    const tripA = T.meta && T.meta.start ? utc(T.meta.start) : Date.UTC(year, 9, 17);
    const tripB = (T.meta && T.meta.end ? utc(T.meta.end) : Date.UTC(year, 9, 25)) + DAY_MS;

    // visited + summary
    const visited = new Map();
    rows.forEach((r) => visited.set(r.id, visitedDates(option, r)));
    const inWindow = (r) => visited.get(r.id).some((d) => d >= r.first_color && d <= r.peak_end);
    const atPeak = (r) => visited.get(r.id).some((d) => d >= r.peak_start && d <= r.peak_end);
    const nWin = rows.filter(inWindow).length, nPeak = rows.filter(atPeak).length;
    let summary;
    if (!option) summary = 'Pick a route to see which of these places it passes during their color window.';
    else if (!nWin) summary = 'This route does not pass any of these places during their color window.';
    else summary = 'This route visits ' + nWin + ' of these places during their color window' + (nPeak ? ' (' + nPeak + ' at peak).' : '.');
    root.appendChild(h('p', { class: 'vz-fol-summary', text: summary }));

    // legend
    const key = (cls, label) => h('li', { class: 'vz-key' }, [h('span', { class: 'vz-key-sw ' + cls, 'aria-hidden': 'true' }), label]);
    root.appendChild(h('ul', { class: 'vz-keys', 'aria-label': 'Chart key' }, [
      key('vz-key-sw--early', 'Early color'),
      key('vz-key-sw--maple', 'Peak: maple / mixed'),
      key('vz-key-sw--ginkgo', 'Peak: ginkgo'),
      key('vz-key-sw--grass', 'Peak: silver grass'),
      key('vz-key-sw--trip', 'Your trip'),
      key('vz-key-sw--visit', 'Visited'),
    ]));

    const scroll = h('div', { class: 'vz-scroll' });
    root.appendChild(scroll);
    const detail = h('div', { class: 'vz-detail', 'aria-live': 'polite' });
    detail.hidden = true;
    root.appendChild(detail);

    // geometry
    const cw = Math.round(scroll.getBoundingClientRect().width) || container.clientWidth || 0;
    const W = Math.max(cw, 640);
    const labelW = W < 760 ? 172 : clamp(Math.round(W * 0.23), 190, 250);
    const padR = 16;
    const x0 = labelW, x1 = W - padR, plotW = x1 - x0;
    const xOf = (ms) => x0 + clamp((ms - t0) / (t1 - t0), 0, 1) * plotW;
    const nameFont = '600 12.5px ' + bodyFont();
    const topH = 48;
    const barH = 14;

    // rows
    let y = topH;
    const layoutRows = rows.map((r) => {
      const lines = wrapText(r.name, labelW - 14, nameFont, 2);
      const rowH = lines.length * 15 + 15 + 12;
      const out = { r, lines, y, rowH };
      y += rowH;
      return out;
    });
    const plotBottom = y;
    const H = plotBottom + 26;

    const svg = s('svg', { class: 'vz-fol-svg', width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': 'Foliage calendar. ' + summary });
    svg.appendChild(s('title', { text: 'Foliage calendar, Oct 1 to Nov 20' }));

    // trip band
    const bx0 = xOf(tripA), bx1 = xOf(tripB);
    const band = s('g', { class: 'vz-band' }, [
      s('title', { text: 'Your trip: ' + monthDayRange(tripA, tripB - DAY_MS) }),
      s('rect', { class: 'vz-band-rect', x: bx0, y: 18, width: bx1 - bx0, height: plotBottom - 18 }),
      s('text', { class: 'vz-band-label', x: (bx0 + bx1) / 2, y: 11, 'text-anchor': 'middle', text: 'Your trip' }),
    ]);
    svg.appendChild(band);

    // weekly grid + ticks (Mondays)
    const grid = s('g', { class: 'vz-grid' });
    for (let ms = t0; ms < t1; ms += DAY_MS) {
      if (new Date(ms).getUTCDay() !== 1) continue;
      const x = xOf(ms);
      grid.appendChild(s('line', { class: 'vz-gridline', x1: x, x2: x, y1: 34, y2: plotBottom }));
      grid.appendChild(s('text', { class: 'vz-tick', x, y: 28, 'text-anchor': 'middle', text: monthDay(ms) }));
      grid.appendChild(s('text', { class: 'vz-tick', x, y: plotBottom + 17, 'text-anchor': 'middle', text: monthDay(ms) }));
    }
    grid.appendChild(s('line', { class: 'vz-axis', x1: x0, x2: x1, y1: 34, y2: 34 }));
    grid.appendChild(s('line', { class: 'vz-axis', x1: x0, x2: x1, y1: plotBottom, y2: plotBottom }));
    svg.appendChild(grid);

    // rows
    const rowEls = new Map();
    layoutRows.forEach((lr) => {
      const r = lr.r, kind = foliageKind(r.kind), vd = visited.get(r.id);
      const cy = lr.y + lr.rowH / 2;
      const a = utc(r.first_color), b = utc(r.peak_start), c = utc(r.peak_end) + DAY_MS;
      const xa = xOf(a), xb = xOf(b), xc = xOf(c);
      const tip = r.name + (r.name_ko ? ' (' + r.name_ko + ')' : '') + '\n'
        + 'First color ' + monthDay(a) + ', peak ' + monthDayRange(b, c - DAY_MS) + '\n'
        + (r.note ? r.note + '\n' : '') + 'Confidence: ' + (r.confidence || 'n/a')
        + (vd.length ? '\nYour route is here: ' + vd.map((d) => monthDay(utc(d))).join(', ') : '');
      const g = s('g', {
        class: 'vz-fol-row vz-k-' + kind + (vd.length ? ' is-visited' : '') + (FOL.selected === r.id ? ' is-selected' : ''),
        tabindex: 0, role: 'button', 'aria-pressed': FOL.selected === r.id ? 'true' : 'false',
        'aria-label': r.name + ', ' + (r.region || '') + '. First color ' + monthDay(a) + ', peak ' + monthDayRange(b, c - DAY_MS) + (vd.length ? '. Visited on your route.' : '') + ' Press for notes.',
      });
      g.appendChild(s('title', { text: tip }));
      g.appendChild(s('rect', { class: 'vz-fol-hit', x: 0, y: lr.y, width: W, height: lr.rowH }));
      g.appendChild(s('line', { class: 'vz-rowline', x1: 0, x2: W, y1: lr.y + lr.rowH, y2: lr.y + lr.rowH }));
      // label
      const name = s('text', { class: 'vz-fol-name', x: 6, y: lr.y + 8 });
      lr.lines.forEach((ln, i) => name.appendChild(s('tspan', { x: 6, y: lr.y + 8 + 12 + i * 15, text: ln })));
      g.appendChild(name);
      g.appendChild(s('text', { class: 'vz-fol-region', x: 6, y: lr.y + 8 + 12 + lr.lines.length * 15 + 1, text: clip(r.region || '', Math.floor((labelW - 12) / 5.6)) }));
      // bars
      if (xb > xa) g.appendChild(s('rect', { class: 'vz-bar-soft', x: xa, y: cy - barH / 2, width: Math.max(0, xb - xa), height: barH }));
      if (xc > xb) g.appendChild(s('rect', { class: 'vz-bar-peak', x: xb, y: cy - barH / 2, width: Math.max(2, xc - xb), height: barH }));
      // peak dates beside the bar
      const label = monthDayRange(b, c - DAY_MS), lw = label.length * 6 + 4;
      if (xc + 6 + lw <= x1) g.appendChild(s('text', { class: 'vz-fol-dates', x: xc + 6, y: cy, 'dominant-baseline': 'central', text: label }));
      else if (xa - 6 - lw >= x0) g.appendChild(s('text', { class: 'vz-fol-dates', x: xa - 6, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'central', text: label }));
      // visited diamonds
      vd.forEach((d) => {
        const x = xOf(utc(d) + DAY_MS / 2);
        g.appendChild(s('path', { class: 'vz-visit', d: 'M' + x + ',' + (cy - 6) + 'L' + (x + 6) + ',' + cy + 'L' + x + ',' + (cy + 6) + 'L' + (x - 6) + ',' + cy + 'Z' }, [s('title', { text: 'Your route is here on ' + monthDay(utc(d)) })]));
      });
      const toggle = () => {
        FOL.selected = FOL.selected === r.id ? null : r.id;
        rowEls.forEach((el, id) => { el.classList.toggle('is-selected', id === FOL.selected); el.setAttribute('aria-pressed', id === FOL.selected ? 'true' : 'false'); });
        fillFoliageDetail(detail, FOL.selected ? r : null, vd);
      };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      svg.appendChild(g);
      rowEls.set(r.id, g);
    });

    scroll.appendChild(svg);
    const sel = rows.find((r) => r.id === FOL.selected);
    fillFoliageDetail(detail, sel || null, sel ? visited.get(sel.id) : []);
  }

  function fillFoliageDetail(box, r, vd) {
    box.replaceChildren();
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    const a = utc(r.first_color), b = utc(r.peak_start), c = utc(r.peak_end);
    box.appendChild(h('div', { class: 'vz-detail-head' }, [
      h('strong', { class: 'vz-detail-name', text: r.name }),
      r.name_ko ? h('span', { class: 'vz-detail-ko', text: r.name_ko }) : null,
    ]));
    box.appendChild(h('div', { class: 'vz-detail-meta', text: [r.region, 'first color ' + monthDay(a), 'peak ' + monthDayRange(b, c), r.confidence ? 'confidence ' + r.confidence : ''].filter(Boolean).join(' · ') }));
    if (r.note) box.appendChild(h('p', { class: 'vz-detail-note', text: r.note }));
    if (vd && vd.length) box.appendChild(h('p', { class: 'vz-detail-note', text: 'Your route is here on ' + vd.map((d) => monthDay(utc(d))).join(', ') + '.' }));
  }

  /* ================================================================== EVENTS STRIP =================================================================== */

  const EV = { all: false, selected: null };
  const KIND_LABEL = { festival: 'Festival', show: 'Show', closure: 'Closure', season: 'Season', 'free-entry': 'Free entry' };
  // Place-name groups: a base in any group also matches events in the others.
  const CITY_GROUPS = [
    ['sokcho', 'seorak', 'seoraksan', 'yangyang', 'gangwon'],
    ['gangneung', 'gangwon'],
    ['jeju', 'seogwipo'],
  ];
  const AIRPORT = /^(icn|gmp|pus|cju|incheon|gimpo|airport|incheon airport)$/;

  function cityTokens(str) {
    return String(str || '').toLowerCase().replace(/\(.*?\)/g, ' ').split(/[\/,&+→·]|\band\b|\bto\b/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  function baseKeys(base) {
    const keys = new Set();
    cityTokens(base).filter((t) => !AIRPORT.test(t)).forEach((t) => {
      keys.add(t);
      CITY_GROUPS.forEach((g) => { if (g.some((n) => t.includes(n) || n.includes(t))) g.forEach((n) => keys.add(n)); });
    });
    return [...keys];
  }
  function cityMatches(eventCity, keys) {
    if (/nationwide|all korea|everywhere/i.test(eventCity || '')) return true;
    const toks = cityTokens(eventCity);
    return toks.some((t) => keys.some((k) => k.length >= 3 && t.length >= 3 && (t.includes(k) || k.includes(t))));
  }
  const canonicalCity = (base) => {
    const t = cityTokens(base).filter((x) => !AIRPORT.test(x))[0] || '';
    const g = CITY_GROUPS.find((gr) => gr.slice(0, 3).some((n) => t.includes(n)));
    return g ? g[0] : t;
  };

  function renderEvents(container, option) {
    if (!container) return;
    container.replaceChildren();
    const T = trip();
    const root = h('div', { class: 'vz-ev' });
    container.appendChild(root);

    const cb = h('input', { type: 'checkbox', id: 'events-all', class: 'vz-check-input' });
    cb.checked = !!EV.all;
    const note = h('span', { class: 'vz-ev-note', 'aria-live': 'polite' });
    root.appendChild(h('div', { class: 'vz-ev-bar' }, [
      h('label', { class: 'vz-check', for: 'events-all' }, [cb, h('span', { text: 'Show all cities' })]),
      note,
    ]));
    const scroll = h('div', { class: 'vz-ev-scroll' });
    const grid = h('div', { class: 'vz-ev-grid' });
    scroll.appendChild(grid);
    root.appendChild(scroll);
    const detail = h('div', { class: 'vz-detail', 'aria-live': 'polite' });
    detail.hidden = true;
    root.appendChild(detail);

    cb.addEventListener('change', () => { EV.all = cb.checked; fill(); });
    fill();

    function fill() {
      grid.replaceChildren();
      const meta = T.meta || {};
      const start = utc(meta.start || '2026-10-17'), end = utc(meta.end || '2026-10-25');
      const days = [];
      for (let ms = start; ms <= end; ms += DAY_MS) days.push(ms);
      grid.style.setProperty('--vz-cols', days.length);
      const events = T.events || [];
      const hiddenIds = new Set();
      let prevCanon = null;
      const byId = new Map();
      events.forEach((e) => byId.set(e.id, e));

      days.forEach((ms) => {
        const iso = isoOf(ms), dow = new Date(ms).getUTCDay();
        const day = option && (option.days || []).find((d) => d.date === iso);
        const base = day ? day.base : '';
        const keys = baseKeys(base);
        const canon = base ? canonicalCity(base) : null;
        const travel = !!day && ((prevCanon != null && canon !== prevCanon) || /→/.test(base));
        const prevBase = prevCanon;
        if (canon != null) prevCanon = canon;

        let list = events.filter((e) => e.start <= iso && iso <= e.end);
        const rank = (e) => (e.kind === 'closure' ? 0 : e.kind === 'festival' || e.kind === 'show' ? 1 : 2);
        const here = (e) => !!day && cityMatches(e.city, keys);
        if (!EV.all) {
          const kept = list.filter(here);
          list.forEach((e) => { if (!kept.includes(e)) hiddenIds.add(e.id); });
          list = kept;
        }
        list = list.map((e, i) => ({ e, i })).sort((p, q) => rank(p.e) - rank(q.e) || p.i - q.i).map((p) => p.e);

        const head = h('div', { class: 'vz-ev-head' + (travel ? ' vz-ev-head--travel' : '') }, [
          h('div', { class: 'vz-ev-datebox' }, [
            h('span', { class: 'vz-ev-date', text: DOW[dow].toUpperCase() + ' ' + new Date(ms).getUTCDate() }),
            h('span', { class: 'vz-ev-ko', lang: 'ko', text: DOW_KO[dow] }),
          ]),
          h('div', { class: 'vz-ev-base', title: travel ? 'Travel day: the route changes base' : null }, [
            travel ? h('span', { class: 'vz-ev-arrow', 'aria-hidden': 'true', text: '→ ' }) : null,
            travel ? h('span', { class: 'vz-sr', text: 'Travel day: ' }) : null,
            base || '—',
          ]),
        ]);

        const ul = h('ul', { class: 'vz-ev-list' });
        const mkChip = (e) => {
          const away = EV.all && !here(e);
          const b = h('button', {
            type: 'button', class: 'vz-chip vz-chip--' + (e.kind || 'season') + (away ? ' vz-chip--away' : '') + (EV.selected === e.id ? ' is-selected' : ''),
            title: [e.name_ko, e.times, e.note].filter(Boolean).join(' · '), 'aria-pressed': EV.selected === e.id ? 'true' : 'false',
            'data-ev': e.id,
          }, [
            h('span', { class: 'vz-chip-kind', text: (KIND_LABEL[e.kind] || e.kind || '') + (away && e.city ? ' · ' + e.city : '') }),
            h('span', { class: 'vz-chip-name', text: e.name }),
            e.times ? h('span', { class: 'vz-chip-times', text: e.times }) : null,
          ]);
          b.addEventListener('click', () => {
            EV.selected = EV.selected === e.id ? null : e.id;
            grid.querySelectorAll('.vz-chip').forEach((el) => { const on = el.getAttribute('data-ev') === EV.selected; el.classList.toggle('is-selected', on); el.setAttribute('aria-pressed', on ? 'true' : 'false'); });
            fillEventDetail(detail, EV.selected ? e : null);
          });
          return h('li', { class: 'vz-ev-item' }, b);
        };
        list.slice(0, 5).forEach((e) => ul.appendChild(mkChip(e)));
        if (list.length > 5) {
          const rest = h('ul', { class: 'vz-ev-list vz-ev-list--more' });
          list.slice(5).forEach((e) => rest.appendChild(mkChip(e)));
          ul.appendChild(h('li', { class: 'vz-ev-item' }, h('details', { class: 'vz-more' }, [h('summary', { text: '+' + (list.length - 5) + ' more' }), rest])));
        }
        if (!list.length) ul.appendChild(h('li', { class: 'vz-ev-empty', text: day ? 'Nothing listed' : 'Not on this route' }));

        grid.appendChild(h('section', { class: 'vz-ev-col', 'aria-label': DOW[dow] + ' ' + monthDay(ms) + (base ? ', ' + base : '') }, [head, ul]));
      });

      note.textContent = EV.all
        ? 'Dashed chips are in other cities.'
        : 'Showing events in the city your route is in each day' + (hiddenIds.size ? ' (' + hiddenIds.size + ' listings elsewhere are hidden).' : '.');
      const sel = EV.selected && byId.get(EV.selected);
      const present = sel && grid.querySelector('[data-ev="' + EV.selected + '"]');
      fillEventDetail(detail, present ? sel : null);
    }
  }

  function fillEventDetail(box, e) {
    box.replaceChildren();
    if (!e) { box.hidden = true; return; }
    box.hidden = false;
    const a = utc(e.start), b = utc(e.end);
    box.appendChild(h('div', { class: 'vz-detail-head' }, [
      h('strong', { class: 'vz-detail-name', text: e.name }),
      e.name_ko ? h('span', { class: 'vz-detail-ko', lang: 'ko', text: e.name_ko }) : null,
    ]));
    box.appendChild(h('div', { class: 'vz-detail-meta', text: [KIND_LABEL[e.kind] || e.kind, e.city, monthDayRange(a, b), e.times, e.cost, e.confidence ? 'confidence ' + e.confidence : ''].filter(Boolean).join(' · ') }));
    if (e.note) box.appendChild(h('p', { class: 'vz-detail-note', text: e.note }));
  }

  /* ================================================================== export ================================================================== */
  window.Viz = {
    initMap,
    setOption,
    focusDay,
    renderFoliage,
    renderEvents,
    onPin: null,
    // read-only debug hook for the dev harness
    _debug: () => (M ? { ready: M.ready, k: M.t.k, x: M.t.x, y: M.t.y, w: M.w, h: M.h, pins: M.pins.length, food: M.dayItems.length - M.pins.length, focus: S.focus, links: M.model ? M.model.links.map((l) => l.a.name + '>' + l.b.name + ':' + l.style) : [] } : null),
  };
})();
