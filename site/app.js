/* app.js - state, rendering and interaction for the Korea Autumn 2026 trip planner.
 * Plain ES2020 script. Needs window.TRIP (data.js). Uses window.Viz (viz.js) when present; the page works without it. */
(function () {
  'use strict';

  const T = window.TRIP;
  if (!T || !Array.isArray(T.options) || !T.options.length) {
    const m = document.getElementById('main');
    if (m) m.innerHTML = '<p class="ph">The trip data did not load. Reload the page to try again.</p>';
    return;
  }

  /* ================================================================== helpers ================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('korea26:' + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('korea26:' + key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ }
    },
  };

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
  class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
  function val(v) {
    if (v == null || v === false) return '';
    if (v instanceof Raw) return v.s;
    if (Array.isArray(v)) return v.map(val).join('');
    return esc(v);
  }
  /* Tagged template: every interpolation is escaped unless it is itself the result of html``. */
  function html(strings, ...vals) {
    let out = strings[0];
    for (let i = 0; i < vals.length; i++) out += val(vals[i]) + strings[i + 1];
    return new Raw(out);
  }
  const put = (el, r) => { if (el) el.innerHTML = val(r); };

  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const cap = (s) => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const catLabel = (c) => cap(String(c || '').replace(/-/g, ' '));

  /* ---- dates and money ---- */
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    return { y, mo, d, dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(), utc: Date.UTC(y, mo - 1, d) };
  }
  const dayLabel = (s) => { const p = parseDate(s); return p ? `${DOW[p.dow]} ${p.d} ${MON[p.mo - 1]}` : String(s || ''); };
  const dayShort = (s) => { const p = parseDate(s); return p ? `${DOW[p.dow]} ${p.d}` : String(s || ''); };
  const timeOf = (s) => String(s || '').slice(11, 16);

  const NUM = new Intl.NumberFormat('en-US');
  const FX = (T.meta && T.meta.fx) || 1340;
  const TRAVELERS = (T.meta && T.meta.travelers) || 3;
  const PLACES_PREVIEW = 24;
  const BUDGET_USD = (T.meta && T.meta.budget_usd_pp) || 1000;
  const fxOf = (opt) => (opt && opt.budget && opt.budget.fx) || FX;
  const won = (n) => '₩' + NUM.format(Math.round(n));
  const usdn = (n, fx) => NUM.format(Math.round(n / (fx || FX)));
  const usd = (n, fx) => 'US$' + usdn(n, fx);
  const approx = (n, fx) => '≈ US$' + usdn(n, fx);

  const OPTION_LABEL = { classic: 'Classic', foliage: 'Foliage', grandloop: 'Grand loop', island: 'Island' };
  const optLabel = (id) => OPTION_LABEL[id] || (T.options.find((o) => o.id === id) || {}).name || id;

  function firstSentence(t, max = 130) {
    t = String(t || '').trim();
    const m = t.match(/^.*?[.!?](\s|$)/);
    let s = m ? m[0].trim() : t;
    if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
    return s;
  }

  /* ---- catalog lookups ---- */
  const placeOf = (id) => (id ? (T.places[id] || (T.lodging && T.lodging[id]) || null) : null);
  const isLodging = (pl) => !!pl && (pl.room_for_3 !== undefined || pl.highlights !== undefined);

  /* ---- vignettes ---- */
  const CAT_MOTIF = {
    palace: 'palace', temple: 'temple', nature: 'mountain', hike: 'hike', beach: 'coast', village: 'village',
    neighborhood: 'village', market: 'market', nightlife: 'nightlife', spa: 'spa', museum: 'museum',
    viewpoint: 'viewpoint', experience: 'viewpoint', 'day-trip': 'train', stay: 'stay',
  };
  function motifFor(kind, pl, name) {
    const nm = ((pl && pl.name) || name || '') + ' ' + ((pl && pl.id) || '');
    if (/silver.?grass|eulalia|억새/i.test(nm)) return 'grass';
    if (kind === 'transport') return 'train';
    if (kind === 'food') return /sushi|omakase|sashimi|\bhoe\b/i.test(nm) ? 'sushi' : 'food';
    if (kind === 'stay') return 'stay';
    if (kind === 'spa') return 'spa';
    if (kind === 'night') return 'nightlife';
    if (isLodging(pl)) return 'stay';
    if (pl && pl.category === 'neighborhood' && /myeongdong|gangnam|euljiro|yeouido|jamsil|dongdaemun|seomyeon|nampo/i.test(nm)) return 'city';
    return (pl && CAT_MOTIF[pl.category]) || 'viewpoint';
  }
  const vig = (m, cls = '') => html`<svg class="vig ${cls}" viewBox="0 0 120 90" aria-hidden="true" focusable="false"><use href="#v-${m}"></use></svg>`;
  /* If a real photo ever exists in TRIP.images it replaces the drawing (and is credited in the footer). */
  function pic(imageId, motif, alt) {
    const im = imageId && T.images && T.images[imageId];
    if (!im) return vig(motif);
    return html`<img class="vig" loading="lazy" src="${im.src}" alt="${im.alt || alt || ''}"${im.w ? html` width="${im.w}" height="${im.h}"` : ''}>`;
  }
  const glyph = (kind) => html`<svg class="it-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#k-${kind}"></use></svg>`;

  /* ---- map links ---- */
  function links(name, ko, lat, lon, withNaver = true) {
    const label = name || ko || '';
    const q = encodeURIComponent(ko || name || '');
    const a = (href, text) => html`<a href="${href}" target="_blank" rel="noopener" aria-label="${text}: ${label} (opens in a new tab)">${text}</a>`;
    const parts = [];
    if (withNaver && q) parts.push(a('https://map.naver.com/p/search/' + q, 'Naver Map'));
    if (typeof lat === 'number' && typeof lon === 'number') parts.push(a(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, 'Google Maps'));
    if (withNaver && q) parts.push(a('https://search.naver.com/search.naver?where=image&query=' + q, 'Photos'));
    return parts.length ? html`<div class="maplinks">${parts}</div>` : '';
  }

  /* ================================================================== state ================================================================== */
  const TIERS = ['value', 'sweet', 'splurge'];
  const TIER_LABEL = { value: 'Value', sweet: 'Sweet', splurge: 'Splurge' };
  const FALLBACK = { value: ['value', 'sweet', 'splurge'], sweet: ['sweet', 'value', 'splurge'], splurge: ['splurge', 'sweet', 'value'] };

  const savedPicks = store.get('tiers', {});
  const state = {
    opt: null,
    picks: savedPicks && typeof savedPicks === 'object' && !Array.isArray(savedPicks) ? savedPicks : {},
    oct16: store.get('oct16', true) !== false,
    checks: (() => { const c = store.get('checks', {}); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; })(),
    activeDay: null,
    lockUntil: 0,
    zone: 'all', cat: 'all', q: '', inplan: false,
  };

  const picksFor = (optId) => {
    if (!state.picks[optId] || typeof state.picks[optId] !== 'object') state.picks[optId] = {};
    return state.picks[optId];
  };
  const stopPick = (optId, stop) => { const p = picksFor(optId)[stop]; return TIERS.includes(p) ? p : 'sweet'; };
  function resolveChoice(stop, pick) {
    const ch = (stop && stop.choices) || [];
    for (const t of FALLBACK[pick] || FALLBACK.sweet) { const c = ch.find((x) => x.tier === t); if (c) return c; }
    return ch[0] || null;
  }
  const chosen = (opt, stop) => resolveChoice(stop, stopPick(opt.id, stop.stop));

  /* ---- Viz bridge: every call is guarded, Viz is optional ---- */
  function viz(name, ...args) {
    try {
      const V = window.Viz;
      if (V && typeof V[name] === 'function') return V[name](...args);
    } catch (err) { console.error('Viz.' + name + ' failed', err); }
    return undefined;
  }

  /* ================================================================== budget math ================================================================== */
  function calcBudget(opt, forcePick) {
    const b = opt.budget || {};
    const fx = fxOf(opt);
    let core = 0, oct16 = 0;
    for (const s of opt.stays || []) {
      const c = forcePick ? resolveChoice(s, forcePick) : chosen(opt, s);
      if (!c) continue;
      if (s.includes_oct16) {
        const night = c.oct16_krw ?? c.price_krw_per_night ?? 0;
        oct16 += night;
        core += (c.total_krw || 0) - night;
      } else core += c.total_krw || 0;
    }
    const parts = {
      lodging: core / TRAVELERS,
      oct16: state.oct16 ? oct16 / TRAVELERS : 0,
      transport: b.transport_krw_pp || 0,
      local: b.local_transit_krw_pp || 0,
      activities: b.activities_krw_pp || 0,
    };
    const krw = parts.lodging + parts.oct16 + parts.transport + parts.local + parts.activities;
    return { parts, krw, usd: krw / fx, fx, oct16Total: oct16 };
  }

  /* ================================================================== header ================================================================== */
  function renderHeader() {
    const m = T.meta || {};
    const s = parseDate(m.start), e = parseDate(m.end);
    const nights = s && e ? Math.round((e.utc - s.utc) / 864e5) : 8;
    const range = s && e ? (s.mo === e.mo ? `${MON[s.mo - 1]} ${s.d}–${e.d}, ${s.y}` : `${MON[s.mo - 1]} ${s.d} – ${MON[e.mo - 1]} ${e.d}, ${s.y}`) : '';
    $('#hdr-eyebrow').textContent = `${range} · ${m.travelers || 3} travelers · 상강 falls on Oct 23`;
    $('#hdr-title').textContent = m.title || 'Korea Autumn 2026';
    $('#hdr-lede').textContent = 'For three friends flying out of Newark: choose a route, set your hotel tiers, then follow the day-by-day plan with prices, bookings and map links.';
    put($('#hdr-passes'), (m.flights || []).map((f) => html`
      <article class="pass" aria-label="${f.dir === 'out' ? 'Outbound' : 'Return'} flight ${f.from} to ${f.to}">
        <div class="pass-main">
          <p class="micro">${f.dir === 'out' ? 'Outbound' : 'Return'} · ${f.airline}</p>
          <p class="pass-route">${f.from}<span aria-hidden="true">→</span><span class="sr-only"> to </span>${f.to}</p>
          <p class="pass-times">Departs ${dayLabel(f.dep)} ${timeOf(f.dep)} · lands ${dayLabel(f.arr)} ${timeOf(f.arr)}</p>
          <p class="pass-note">${f.note}</p>
        </div>
        <div class="pass-stub" aria-hidden="true"><span class="micro">Flight</span><b>${f.dir === 'out' ? 'OUT' : 'BACK'}</b></div>
      </article>`));
    $('#hdr-budget').textContent = `${nights} nights · budget US$${NUM.format(BUDGET_USD)} pp (lodging, transport, activities)`;
  }

  /* ================================================================== routes ================================================================== */
  function renderRoutes() {
    const hi = Math.max(BUDGET_USD, ...T.options.map((o) => ((o.budget || {}).per_person_usd || {}).splurge || 0));
    const scale = hi * 1.06;
    put($('#opts'), T.options.map((o) => optionCard(o, scale)));
    $('#routes-lede').textContent = T.options.length > 1
      ? 'Pick the route that fits the three of you. Everything below follows the one you select.'
      : 'This is the route the plan follows. More routes can be added to the picker.';
  }

  function optionCard(o, scale) {
    const pu = (o.budget || {}).per_person_usd || {};
    const pct = (v) => (v / scale * 100).toFixed(2) + '%';
    const hasCost = typeof pu.value === 'number' && typeof pu.splurge === 'number';
    const routeText = (o.route || []).map((r) => `${r.base} ${r.nights} ${r.nights === 1 ? 'night' : 'nights'}`).join(', ');
    return html`
      <article class="opt" id="opt-${o.id}" data-opt="${o.id}">
        <p class="micro">${optLabel(o.id)}</p>
        <h3 class="opt-name"><button type="button" class="opt-btn" id="pick-${o.id}" data-opt="${o.id}" aria-pressed="false">${o.name}</button></h3>
        <p class="opt-tag">${o.tagline}</p>
        <div class="rstrip" role="img" aria-label="Route: ${routeText}">
          ${(o.route || []).map((r) => html`<div class="rseg" style="--n:${r.nights}"><b title="${r.base}">${String(r.base).replace('Sokcho / Seoraksan', 'Seorak')}</b><span>${r.nights}</span></div>`)}
        </div>
        <div class="chips">
          ${o.recommended ? html`<span class="chip chip--cel">Recommended</span>` : ''}
          ${o.pace ? html`<span class="chip">${cap(o.pace)} pace</span>` : ''}
          ${typeof o.hotel_changes === 'number' ? html`<span class="chip">${o.hotel_changes} hotel ${o.hotel_changes === 1 ? 'change' : 'changes'}</span>` : ''}
        </div>
        ${hasCost ? html`
          <div class="cost">
            <p class="cost-nums">${usdRange(pu)} <small>per person</small></p>
            <div class="cbar" aria-hidden="true">
              <span class="cbar-range" style="--a:${pct(pu.value)};--w:${pct(pu.splurge - pu.value)}"></span>
              ${typeof pu.sweet === 'number' ? html`<span class="cbar-tick" style="--a:${pct(pu.sweet)}"></span>` : ''}
              <span class="cbar-mark" style="--a:${pct(BUDGET_USD)}"></span>
            </div>
            <p class="cost-legend"><span>Value to splurge</span><span class="mono">US$${NUM.format(BUDGET_USD)} line</span></p>
          </div>` : ''}
        <p class="opt-state" data-state>Choose this route</p>
      </article>`;
  }
  const usdRange = (pu) => `US$${NUM.format(pu.value)}–${NUM.format(pu.splurge)}`;

  function updateCards() {
    $$('.opt').forEach((el) => {
      const on = el.dataset.opt === state.opt.id;
      el.classList.toggle('is-selected', on);
      const btn = $('.opt-btn', el);
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const st = $('[data-state]', el);
      if (st) st.textContent = on ? 'Selected' : 'Choose this route';
    });
    put($('#picked'), html`<span>Showing the plan for <b>${state.opt.name}</b>.</span> <a href="#plan" id="go-plan">See the plan</a>`);
    const nav = $('#nav-opt');
    if (nav) nav.textContent = `${optLabel(state.opt.id)}: ${state.opt.name}`;
  }

  const dots = (n) => html`<span class="dots" role="img" aria-label="${n} of 5">${[1, 2, 3, 4, 5].map((i) => html`<i class="${i <= n ? 'on' : ''}"></i>`)}</span>`;
  const SCORE_KEYS = [['culture', 'Culture'], ['history', 'History'], ['nature', 'Nature'], ['city', 'City'], ['food', 'Food'], ['autumn', 'Autumn color'], ['ease', 'Ease']];

  function renderCompare() {
    const opts = T.options;
    const jnames = ((T.guide && T.guide.japan_matches) || []).map((j) => j.japan);
    const sel = (o) => (state.opt && o.id === state.opt.id ? 'is-sel' : '');
    put($('#compare-body'), html`
      <table class="tbl cmp">
        <thead><tr><th scope="col"><span class="sr-only">Measure</span></th>${opts.map((o) => html`<th scope="col" class="${sel(o)}" data-cmp="${o.id}">${optLabel(o.id)}<br><span style="text-transform:none;letter-spacing:0;font-weight:400">${o.name}</span></th>`)}</tr></thead>
        <tbody>
          ${SCORE_KEYS.map(([k, label]) => html`<tr><th scope="row">${label}</th>${opts.map((o) => html`<td>${dots((o.scores || {})[k] || 0)}</td>`)}</tr>`)}
          <tr><th scope="row">Pace</th>${opts.map((o) => html`<td>${cap(o.pace)}</td>`)}</tr>
          <tr><th scope="row">Hotel changes</th>${opts.map((o) => html`<td class="mono">${o.hotel_changes}</td>`)}</tr>
          <tr><th scope="row">Per person</th>${opts.map((o) => { const pu = (o.budget || {}).per_person_usd || {}; return html`<td class="mono">${typeof pu.value === 'number' ? usdRange(pu) : ''}</td>`; })}</tr>
          ${jnames.map((j) => html`<tr><th scope="row">${j}</th>${opts.map((o) => { const m = (o.japan_matches || []).find((x) => x.japan === j); return html`<td class="small">${m ? firstSentence(m.korea, 120) : html`<span class="muted">No close match</span>`}</td>`; })}</tr>`)}
          <tr><th scope="row">Trade-offs</th>${opts.map((o) => html`<td class="small"><ul>${(o.tradeoffs || []).map((t) => html`<li>${t}</li>`)}</ul></td>`)}</tr>
        </tbody>
      </table>`);
  }

  /* ================================================================== plan ================================================================== */
  function renderPlan() {
    const o = state.opt;
    $('#h-plan').textContent = `The plan: ${o.name}`;
    put($('#plan-intro'), html`
      <div>
        <p class="lead">${o.summary}</p>
        <p class="chips" style="margin-top:.7rem">
          ${(o.route || []).map((r) => html`<span class="chip chip--soft">${r.base} <small class="mono">${r.nights}</small></span>`)}
          ${o.pace ? html`<span class="chip">${cap(o.pace)} pace</span>` : ''}
        </p>
        ${(o.design_notes || []).length ? html`
          <details class="notes" id="design-notes"><summary>Why the plan looks this way</summary>
            <ul>${o.design_notes.map((n) => html`<li>${n}</li>`)}</ul>
          </details>` : ''}
      </div>
      <div><h3>Highlights</h3><ul class="hl" style="margin-top:.6rem">${(o.highlights || []).map((h) => html`<li>${h}</li>`)}</ul></div>
      <div><h3>Trade-offs</h3><ul class="hl hl--tr" style="margin-top:.6rem">${(o.tradeoffs || []).map((h) => html`<li>${h}</li>`)}</ul></div>`);

    put($('#daychips'), (o.days || []).map((d) => html`
      <button type="button" class="daychip" id="chip-${d.date}" data-date="${d.date}"><b>${dayShort(d.date)}</b><span>${d.base}</span></button>`));
    put($('#days'), (o.days || []).map(renderDay));
    updateSleepChips();
    observeDays();
  }

  function renderDay(d) {
    const p = parseDate(d.date) || { dow: 0, d: '', mo: 10 };
    const meals = d.food || [];
    const stay = (state.opt.stays || []).find((s) => s.stop === d.stay_stop);
    return html`
      <article class="day" id="day-${d.date}" data-date="${d.date}" aria-labelledby="dt-${d.date}">
        <div class="day-stub" aria-hidden="true">
          <span class="d-dow">${DOW[p.dow].toUpperCase()} ${p.d}</span>
          <span class="d-ko">${DOW_KO[p.dow]}</span>
          <span class="d-mon">${MON[p.mo - 1].toUpperCase()}</span>
        </div>
        <div class="day-body">
          <div class="day-head">
            <div class="chips"><span class="chip chip--soft">${d.base}</span><span class="sr-only">${dayLabel(d.date)}</span></div>
            <h3 class="day-title" id="dt-${d.date}">${d.title}</h3>
            <p class="day-sum">${d.summary}</p>
          </div>
          ${d.autumn_note ? html`<p class="autumn"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-leaf"></use></svg><span>${d.autumn_note}</span></p>` : ''}
          <ol class="tt">${(d.items || []).map((it, i) => html`<li>${renderItem(d, it, i)}</li>`)}</ol>
          ${meals.length ? html`<div class="meals"><h4>Food picks</h4>${meals.map(renderMeal)}</div>` : ''}
          ${d.rainy_swap ? html`<p class="rain"><span class="micro">If it rains</span> ${d.rainy_swap}</p>` : ''}
          ${stay ? html`<div class="day-foot"><a class="chip chip--gin sleep-chip" href="#stay-${stay.stop}" data-stop="${stay.stop}" data-out="${stay.check_out && stay.check_out <= d.date ? '1' : '0'}"><span class="sleep-label">${stay.check_out && stay.check_out <= d.date ? 'Check out' : 'Sleep'}:</span> <b class="sleep-name"></b> <small class="sleep-tier"></small></a></div>` : ''}
        </div>
      </article>`;
  }

  const KINDS = new Set(['transport', 'sight', 'walk', 'food', 'stay', 'night', 'rest', 'spa', 'shop']);
  function renderItem(d, it, i) {
    const pl = placeOf(it.place_id);
    const nm = pl ? pl.name : it.title;
    const ko = pl ? pl.name_ko : '';
    const naver = !!pl || !['transport', 'rest'].includes(it.kind);
    const lat = typeof it.lat === 'number' ? it.lat : (pl && pl.lat);
    const lon = typeof it.lon === 'number' ? it.lon : (pl && pl.lon);
    const kind = KINDS.has(it.kind) ? it.kind : 'sight';
    const cost = it.cost_krw_pp || 0;
    return html`
      <div class="it k-${kind} ${it.place_id ? '' : 'no-thumb'}" id="it-${d.date}-${i}">
        <div class="it-time">${it.time}${it.end ? html`<small>to ${it.end}</small>` : ''}</div>
        ${glyph(kind)}
        <div class="it-main">
          <p class="it-title">${it.title}<span class="sr-only"> (${kind})</span></p>
          ${it.detail ? html`<p class="it-detail">${it.detail}</p>` : ''}
          ${cost > 0 || it.cost_note ? html`<div class="it-chips">
            ${cost > 0 ? html`<span class="chip chip--gin mono">${won(cost)} <small>${approx(cost)} pp</small></span>` : ''}
            ${it.cost_note ? html`<span class="small muted">${it.cost_note}</span>` : ''}
          </div>` : ''}
          ${it.booking ? html`<p class="note note--book"><span class="micro">Book</span>${it.booking}</p>` : ''}
          ${it.tip ? html`<p class="note note--tip"><span class="micro">Tip</span>${it.tip}</p>` : ''}
          ${links(nm, ko, lat, lon, naver)}
          ${isLodging(pl) ? '' : aboutHtml(pl)}
        </div>
        ${it.place_id ? html`<div class="it-thumb">${pic(pl && pl.image, motifFor(it.kind, pl, it.title), nm)}</div>` : ''}
      </div>`;
  }

  const isNone = (s) => !s || /^none\b/i.test(String(s).trim());
  function costText(p) {
    if (typeof p.cost_krw !== 'number') return p.cost_note || '';
    const base = p.cost_krw === 0 ? 'Free' : `${won(p.cost_krw)} (${approx(p.cost_krw)})`;
    return p.cost_note && p.cost_note !== 'Free' ? `${base} · ${p.cost_note}` : base;
  }
  function aboutHtml(pl, cls = '') {
    if (!pl) return '';
    let rows;
    if (isLodging(pl)) {
      rows = [['Room for 3', pl.room_for_3], ['Good', pl.highlights], ['Less good', pl.drawbacks], ['Booking', pl.booking]];
    } else {
      const tips = Array.isArray(pl.tips) ? pl.tips : (pl.tips ? [pl.tips] : []);
      rows = [
        ['Hours', pl.hours], ['Closed', isNone(pl.closed) ? '' : pl.closed, 'is-closed'], ['Cost', costText(pl)],
        ['Why go', pl.why], ['Autumn', pl.autumn_note], ['Booking', isNone(pl.booking) ? '' : pl.booking],
        ['Tips', tips.length ? html`<ul>${tips.map((t) => html`<li>${t}</li>`)}</ul>` : ''],
      ];
    }
    const rs = rows.filter((r) => r[1]);
    if (!rs.length) return '';
    return html`<details class="about ${cls}"><summary>About this place</summary><dl>${rs.map(([k, v, c]) => html`<dt>${k}</dt><dd class="${c || ''}">${v}</dd>`)}</dl></details>`;
  }

  function renderMeal(f) {
    const fd = f.food_id && T.food && T.food[f.food_id];
    const ko = f.name_ko || (fd && fd.name_ko) || '';
    const lat = typeof f.lat === 'number' ? f.lat : (fd && fd.lat);
    const lon = typeof f.lon === 'number' ? f.lon : (fd && fd.lon);
    return html`
      <div class="meal">
        <span class="micro">${f.meal}</span>
        <div>
          <p class="meal-name">${f.name}${ko ? html` <span class="meal-ko">${ko}</span>` : ''}</p>
          ${f.price_krw_pp ? html`<p class="meal-price">${won(f.price_krw_pp)} pp · ${approx(f.price_krw_pp)}</p>` : ''}
          ${f.note ? html`<p class="small">${f.note}</p>` : ''}
          ${links(f.name, ko, lat, lon, true)}
        </div>
      </div>`;
  }

  function updateSleepChips() {
    const o = state.opt;
    $$('.sleep-chip').forEach((a) => {
      const s = (o.stays || []).find((x) => x.stop === a.dataset.stop);
      const c = s && chosen(o, s);
      $('.sleep-name', a).textContent = c ? c.name : '';
      $('.sleep-tier', a).textContent = c ? TIER_LABEL[c.tier] || c.tier : '';
    });
  }

  /* ---- day focus: the card nearest the viewport middle drives the map ---- */
  let dayObserver = null;
  function nearestDay() {
    const mid = window.innerHeight / 2;
    let best = null, bd = Infinity;
    for (const el of $$('.day')) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
      if (d < bd) { bd = d; best = el; }
    }
    return best;
  }
  function observeDays() {
    if (dayObserver) dayObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;
    dayObserver = new IntersectionObserver(() => {
      if (performance.now() < state.lockUntil) return;
      const el = nearestDay();
      if (el) setActive(el.dataset.date);
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
    $$('.day').forEach((el) => dayObserver.observe(el));
  }
  let scrollTick = 0;
  function onScrollSettle() {
    clearTimeout(scrollTick);
    scrollTick = setTimeout(() => {
      if (performance.now() < state.lockUntil) return;
      const g = $('#days');
      if (!g) return;
      const r = g.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const el = nearestDay();
      if (el) setActive(el.dataset.date);
    }, 120);
  }
  function setActive(date) {
    if (state.activeDay === date) return;
    state.activeDay = date;
    $$('.day').forEach((el) => el.classList.toggle('is-active', el.dataset.date === date));
    const row = $('#daychips');
    $$('.daychip').forEach((el) => {
      const on = el.dataset.date === date;
      el.classList.toggle('is-active', on);
      if (on) { el.setAttribute('aria-current', 'true'); if (row) row.scrollLeft = Math.max(0, el.offsetLeft - row.clientWidth / 2 + el.offsetWidth / 2); } else el.removeAttribute('aria-current');
    });
    viz('focusDay', date);
  }
  function lockScroll(ms) {
    state.lockUntil = performance.now() + (reduceMotion() ? 250 : ms);
    setTimeout(() => { if (performance.now() >= state.lockUntil) { const el = nearestDay(); if (el) setActive(el.dataset.date); } }, (reduceMotion() ? 250 : ms) + 60);
  }
  function scrollToEl(el, block = 'start') {
    lockScroll(1100);
    el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block });
  }
  function goDay(date) {
    const el = document.getElementById('day-' + date);
    if (!el) return;
    setActive(date);
    scrollToEl(el);
  }

  /* ================================================================== stays ================================================================== */
  function availInfo(text) {
    const a = String(text || '').trim();
    const l = a.toLowerCase();
    const i = a.indexOf(' · ');
    const rest = i >= 0 ? a.slice(i + 3) : '';
    if (l.startsWith('available')) return { cls: 'ok', label: 'Live-checked available', rest };
    if (l.includes('partly')) return { cls: 'part', label: 'Partly sold out', rest };
    if (l.includes('sold out')) return { cls: 'sold', label: 'Sold out', rest, sold: true };
    return { cls: 'unv', label: 'Unverified', rest };
  }

  const tierAll = (prefix) => html`
    <div class="seg" role="radiogroup" aria-label="Hotel tier for every stop">
      ${TIERS.map((t) => html`<label class="" for="${prefix}-${t}"><input type="radio" name="${prefix}" id="${prefix}-${t}" value="${t}" data-all="1">${TIER_LABEL[t]}</label>`)}
    </div>`;

  function renderStays() {
    const o = state.opt;
    const stops = o.stays || [];
    put($('#stays-body'), html`
      <div class="stays-bar">
        <div><p class="micro" style="margin-bottom:.3rem">Set every stop</p>${tierAll('tier-all')}</div>
        <p class="readout" id="stays-readout" aria-live="polite"></p>
      </div>
      <div class="stops">${stops.map(renderStop)}</div>`);
    syncStays();
  }

  function renderStop(s) {
    const nightsText = `${s.nights} ${s.nights === 1 ? 'night' : 'nights'}${s.includes_oct16 ? ' incl. Oct 16' : ''}`;
    return html`
      <article class="stop" id="stay-${s.stop}" aria-labelledby="sh-${s.stop}">
        <header class="stop-head">
          ${vig('stay')}
          <div>
            <h3 id="sh-${s.stop}">${s.base} <span class="muted" style="font-family:var(--font-body);font-weight:400;font-size:.9rem">· ${s.area}</span></h3>
            <p class="dates">${dayLabel(s.check_in)} → ${dayLabel(s.check_out)} · ${nightsText}</p>
            ${s.why_area ? html`<p class="why small">${s.why_area}</p>` : ''}
          </div>
        </header>
        <fieldset class="choices">
          <legend class="sr-only">Hotel tier for ${s.base}, ${dayLabel(s.check_in)} to ${dayLabel(s.check_out)}</legend>
          ${(s.choices || []).map((c) => renderChoice(s, c, nightsText))}
        </fieldset>
        <p class="stop-note" id="stop-note-${s.stop}"></p>
      </article>`;
  }

  function renderChoice(s, c, nightsText) {
    const av = availInfo(c.availability);
    const L = T.lodging && T.lodging[c.lodging_id];
    const hasExtra = !!L;
    return html`
      <div class="choice-wrap" data-stop="${s.stop}" data-tier="${c.tier}">
        <label class="choice" for="tier-${s.stop}-${c.tier}">
          <input type="radio" name="tier-${s.stop}" id="tier-${s.stop}-${c.tier}" value="${c.tier}" data-stop="${s.stop}">
          <span class="choice-main">
            <span class="choice-top">
              <span class="tier-tag">${TIER_LABEL[c.tier] || c.tier}</span>
              <span class="choice-name ${av.sold ? 'is-sold' : ''}">${c.name}</span>
              <span class="badge badge--${av.cls}">${av.label}</span>
            </span>
            ${c.room ? html`<span class="small">${c.room}</span>` : ''}
            ${c.why ? html`<span class="small">${c.why}</span>` : ''}
            ${av.rest ? html`<span class="small muted">${av.rest}</span>` : ''}
            ${c.price_basis ? html`<span class="small muted">${c.price_basis}</span>` : ''}
          </span>
          <span class="choice-price">
            <b>${won(c.price_krw_per_night)}</b> / night<br>
            ${nightsText} · ${won(c.total_krw)}<br>
            ${approx(c.total_krw / TRAVELERS, fxOf(state.opt))} pp
          </span>
        </label>
        ${hasExtra ? html`<div class="choice-extra">${links(c.name, L.name_ko, L.lat, L.lon)}${aboutHtml(L)}</div>` : ''}
      </div>`;
  }

  /* Sync radios, highlights, notes and the global control with state, then refresh everything that depends on the picks. */
  function syncStays() {
    const o = state.opt;
    for (const s of o.stays || []) {
      const pick = stopPick(o.id, s.stop);
      const c = resolveChoice(s, pick);
      $$('.choice-wrap').filter((w) => w.dataset.stop === s.stop).forEach((w) => {
        const on = !!c && w.dataset.tier === c.tier;
        w.classList.toggle('is-picked', on);
        const inp = $('input', w);
        if (inp) inp.checked = on;
      });
      const note = $('#stop-note-' + s.stop);
      if (note) note.textContent = c && c.tier !== pick ? `There is no ${TIER_LABEL[pick].toLowerCase()} option at this stop, so the ${TIER_LABEL[c.tier].toLowerCase()} room is used.` : '';
    }
    const picks = (o.stays || []).map((s) => stopPick(o.id, s.stop));
    const uniform = picks.length && picks.every((p) => p === picks[0]) ? picks[0] : null;
    $$('input[data-all]').forEach((inp) => {
      inp.checked = inp.value === uniform;
      inp.closest('label').classList.toggle('is-on', inp.checked);
    });
    updateBudget();
    updateSleepChips();
  }

  /* ================================================================== budget ================================================================== */
  function renderBudget() {
    const o = state.opt;
    const b = o.budget || {};
    const tr = o.transport || [];
    const acts = o.activities_paid || [];
    const trTotal = tr.reduce((a, t) => a + (t.cost_krw_pp || 0), 0);
    const acTotal = acts.reduce((a, t) => a + (t.cost_krw_pp || 0), 0);
    const fx = fxOf(o);
    put($('#budget-body'), html`
      <div class="bud-controls">
        <div><p class="micro" style="margin-bottom:.3rem">Hotel tier for every stop</p>${tierAll('tier-all-b')}</div>
        <label class="check" for="oct16"><input type="checkbox" id="oct16"><span><b>Book the night of Oct 16</b> (room ready at dawn). Adds the first stop's extra night to the total.</span></label>
      </div>
      <div id="bud-live"></div>
      <div class="sub">
        <h3>Intercity transport</h3>
        <p class="small muted" style="margin-bottom:.6rem">Prices are per person. Confirm departure times on the operator's site before you book.</p>
        <div class="scroll"><table class="tbl" style="min-width:44rem">
          <thead><tr><th>Date</th><th>Route</th><th>Mode</th><th>Time</th><th class="num">Per person</th><th>Booking and notes</th></tr></thead>
          <tbody>
            ${tr.map((t) => html`<tr>
              <td class="nowrap mono">${dayShort(t.date)}</td>
              <td>${t.from} → ${t.to}</td>
              <td class="nowrap">${t.mode}</td>
              <td class="nowrap mono">${t.dep}–${t.arr}${t.duration ? html`<br><span class="muted">${t.duration}</span>` : ''}</td>
              <td class="num">${won(t.cost_krw_pp || 0)}<br><span class="muted">${approx(t.cost_krw_pp || 0, fx)}</span></td>
              <td>${t.booking || ''}${t.note ? html`<span class="tt-small">${t.note}</span>` : ''}</td>
            </tr>`)}
            <tr><td colspan="4"><b>Total per person</b></td><td class="num"><b>${won(trTotal)}</b></td><td></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="sub">
        <h3>Paid activities</h3>
        <ul class="acts card" style="padding:.4rem .9rem">
          ${acts.map((a) => html`<li><span class="mono">${dayShort(a.date)}</span><span>${a.what}</span><span class="mono">${won(a.cost_krw_pp || 0)}</span></li>`)}
          <li><span></span><b>Total per person</b><b class="mono">${won(acTotal)}</b></li>
        </ul>
      </div>
      ${(b.notes || []).length ? html`<div class="sub"><h3>What is and isn't included</h3><ul class="notes-list" style="margin-top:.5rem">${b.notes.map((n) => html`<li>${n}</li>`)}</ul></div>` : ''}`);
    const box = $('#oct16');
    if (box) box.checked = state.oct16;
    syncStays();
  }

  function updateBudget() {
    const host = $('#bud-live');
    if (!host) return;
    const o = state.opt;
    const r = calcBudget(o);
    const fx = r.fx;
    const usdTotal = Math.round(r.usd);
    const gap = BUDGET_USD - usdTotal;
    const segs = [
      { key: 'lodging', label: 'Lodging, Oct 17–24', krw: r.parts.lodging, cls: 'sw-lodging' },
      ...(state.oct16 ? [{ key: 'oct', label: 'Lodging, night of Oct 16', krw: r.parts.oct16, cls: 'sw-oct' }] : []),
      { key: 'transport', label: 'Intercity transport', krw: r.parts.transport, cls: 'sw-transport' },
      { key: 'local', label: 'Local transit', krw: r.parts.local, cls: 'sw-local' },
      { key: 'act', label: 'Paid activities', krw: r.parts.activities, cls: 'sw-act' },
    ];
    const scale = Math.max(r.usd, BUDGET_USD) * 1.06;
    const w = (krw) => ((krw / fx) / scale * 100).toFixed(2) + '%';
    const markPct = BUDGET_USD / scale * 100;
    const alt = segs.map((s) => `${s.label} ${usd(s.krw, fx)}`).join(', ');
    const all = {};
    TIERS.forEach((t) => { all[t] = calcBudget(o, t).usd; });
    put(host, html`
      <div class="bud">
        <div>
          <p class="micro">Per person, current picks${state.oct16 ? ', with Oct 16' : ', without Oct 16'}</p>
          <p class="bud-usd" id="bud-usd">${usd(r.krw, fx)}</p>
          <p class="bud-krw" id="bud-krw">${won(r.krw)} <span>· ${TRAVELERS} travelers, rooms and taxis split evenly</span></p>
          <p class="bud-gap ${gap >= 0 ? 'is-under' : 'is-over'}" id="bud-gap">${gap >= 0 ? `US$${NUM.format(gap)} under` : `US$${NUM.format(-gap)} over`} the US$${NUM.format(BUDGET_USD)} budget</p>
          <div class="stack-wrap">
            <div class="stack" role="img" aria-label="Budget bar: ${alt}. Budget line at US$${NUM.format(BUDGET_USD)}.">
              ${segs.map((s) => html`<i class="${s.cls}" style="width:${w(s.krw)}"></i>`)}
              <span class="stack-mark" style="--a:${markPct.toFixed(2)}%"><span ${markPct > 72 ? html`style="left:auto;right:0;transform:none"` : ''}>US$${NUM.format(BUDGET_USD)}</span></span>
            </div>
          </div>
        </div>
        <div>
          <table class="legend">
            <tbody>
              ${segs.map((s) => html`<tr><td><span class="dot ${s.cls}"></span>${s.label}</td><td class="num">${won(s.krw)}</td><td class="num">${usd(s.krw, fx)}</td></tr>`)}
              <tr class="tot"><td>Total per person</td><td class="num">${won(r.krw)}</td><td class="num">${usd(r.krw, fx)}</td></tr>
            </tbody>
          </table>
          <p class="tiers-line">Same hotel tier at every stop: Value <b>${usd(all.value * fx, fx)}</b>, Sweet <b>${usd(all.sweet * fx, fx)}</b>, Splurge <b>${usd(all.splurge * fx, fx)}</b>. Exchange rate 1 USD = ${NUM.format(fx)} KRW.</p>
        </div>
      </div>`);
    const ro = $('#stays-readout');
    if (ro) ro.innerHTML = `Current picks: <b>${esc(usd(r.krw, fx))}</b> per person${state.oct16 ? ' with Oct 16' : ''}`;
  }

  /* ================================================================== autumn ================================================================== */
  function renderAutumn() {
    const o = state.opt;
    const f = $('#foliage-chart'), e = $('#events-strip');
    f.textContent = ''; e.textContent = '';
    if (!window.Viz) {
      put(f, html`<p class="ph">The chart did not load. First color, peak and the trip window are listed in the plan's autumn notes.</p>`);
      put(e, html`<p class="ph">The events strip did not load. Festivals and closures are listed day by day in the plan.</p>`);
      return;
    }
    viz('renderFoliage', f, o);
    viz('renderEvents', e, o);
  }

  /* ================================================================== Japan to Korea ================================================================== */
  function renderJapan() {
    const o = state.opt;
    const list = (T.guide && T.guide.japan_matches) || [];
    put($('#japan-body'), list.map((j) => {
      const mine = (o.japan_matches || []).find((m) => m.japan === j.japan);
      return html`
        <article class="card jcard" id="jp-${slug(j.japan)}">
          <div><h3>${j.japan}</h3><p class="why-loved">${j.why_loved}</p></div>
          <div>
            ${(j.korea || []).map((k) => {
              const pl = placeOf(k.place_id);
              const inSel = (k.options || []).includes(o.id);
              return html`
                <div class="jmatch ${inSel ? 'is-mine' : ''}">
                  ${pic(k.image || (pl && pl.image), motifFor(null, pl, k.name), k.name)}
                  <div>
                    <h4>${k.name}</h4>
                    <p class="where">${k.where}</p>
                    <p class="note-txt">${k.note}</p>
                    <div class="chips">${(k.options || []).map((id) => html`<span class="chip ${id === o.id ? 'chip--cel' : ''}">${optLabel(id)}</span>`)}</div>
                    ${pl ? links(pl.name, pl.name_ko, pl.lat, pl.lon) : ''}
                  </div>
                </div>`;
            })}
          </div>
          ${mine ? html`
            <div class="jmine">
              <p class="micro">In ${optLabel(o.id)}${mine.date ? ` · ${dayLabel(mine.date)}` : ''}</p>
              <p>${mine.korea}</p>
              ${mine.honest_note ? html`<p class="honest"><span class="micro">Honest note</span> ${mine.honest_note}</p>` : ''}
            </div>` : html`<div class="jmine"><p class="micro">In ${optLabel(o.id)}</p><p class="small muted">This route has no close match for ${j.japan}.</p></div>`}
        </article>`;
    }));
  }

  /* ================================================================== food ================================================================== */
  function renderFood() {
    const f = (T.guide && T.guide.food) || {};
    const o = state.opt;
    const bases = o ? (o.route || []).map((r) => String(r.base).toLowerCase()) : [];
    const regional = f.regional || [];
    const mine = regional.filter((r) => bases.some((b) => b.includes(String(r.city).toLowerCase())));
    const other = regional.filter((r) => !mine.includes(r));
    const region = (r) => html`<div class="reg"><h4>${r.city}</h4>
      <ul class="dish-list dish-grid">${(r.dishes || []).map((d) => html`<li><b>${d.dish}</b>${d.ko ? html`<span class="ko">${d.ko}</span>` : ''}<p class="meta">${d.where}</p><p class="meta mono">${d.price}</p></li>`)}</ul></div>`;
    put($('#food-body'), html`
      <div class="tiers">
        ${(f.tiers || []).map((t) => html`
          <article class="card tier"><h3>${t.tier} <span>${t.price}</span></h3>
            <ul class="ex-list">
              ${(t.examples || []).map((ex) => {
                const fd = ex.food_id && T.food && T.food[ex.food_id];
                return html`<li>
                  <p class="ex-name">${ex.name} <span class="ex-meta">${ex.city}</span></p>
                  <p class="ex-price">${ex.price}</p>
                  ${ex.note ? html`<p class="small">${ex.note}</p>` : ''}
                  <p class="ex-meta">Book: ${ex.booking}${ex.closed ? ` · ${ex.closed}` : ''}</p>
                  ${fd ? links(fd.name || ex.name, fd.name_ko, fd.lat, fd.lon) : ''}
                </li>`;
              })}
            </ul>
          </article>`)}
      </div>
      <div class="sub"><h3>What is in season</h3>
        <ul class="dish-list dish-grid" style="margin-top:.6rem">${(f.autumn || []).map((a) => html`<li><b>${a.item}</b>${a.ko ? html`<span class="ko">${a.ko}</span>` : ''}<p class="meta">${a.where}</p><p class="small">${a.note}</p></li>`)}</ul>
      </div>
      <div class="sub"><h3>Regional must-eats</h3>
        <div class="food-cols" style="margin-top:.6rem">${mine.map(region)}</div>
        ${other.length ? html`<details style="margin-top:1rem"><summary>Other regions in the catalog</summary><div class="food-cols" style="margin-top:.8rem">${other.map(region)}</div></details>` : ''}
      </div>
      <div class="sub"><h3>How to book</h3><ol class="steps" style="margin-top:.5rem">${(f.how_to_book || []).map((h) => html`<li>${h}</li>`)}</ol></div>`);
  }

  /* ================================================================== before you go ================================================================== */
  const PRI = { critical: 0, high: 1, normal: 2 };
  const sortPri = (list) => list.map((b, i) => [b, i]).sort((a, b) => ((PRI[a[0].priority] ?? 2) - (PRI[b[0].priority] ?? 2)) || a[1] - b[1]).map((x) => x[0]);

  function chkItem(b, scope, i) {
    const key = `${scope}|${b.what}`;
    const id = `chk-${scope}-${i}`;
    const pri = b.priority || 'normal';
    return html`
      <li class="chk chk--${pri}">
        <label for="${id}">
          <input type="checkbox" id="${id}" data-chk="${key}" ${state.checks[key] ? html`checked` : ''}>
          <span class="chk-body">
            <span class="what">${b.what}</span>
            <span class="chk-meta">
              ${pri === 'critical' ? html`<span class="chip chip--maple">Critical</span>` : pri === 'high' ? html`<span class="chip chip--gin">High</span>` : ''}
              ${b.when ? html`<span class="chip mono">${b.when}</span>` : ''}
            </span>
            ${b.how ? html`<span class="chk-how" style="display:block">${b.how}</span>` : ''}
          </span>
        </label>
      </li>`;
  }
  function updateProgress() {
    const boxes = $$('input[data-chk]');
    const done = boxes.filter((b) => b.checked).length;
    const el = $('#chk-progress');
    if (el) el.textContent = `${done} of ${boxes.length} done`;
  }

  function renderBefore() {
    const o = state.opt;
    const g = T.guide || {};
    const mine = sortPri(o.book_now || []);
    const also = sortPri(g.general_book_now || []);
    const w = g.weather || {};
    put($('#before-body'), html`
      <div class="cols2">
        <div>
          <h3>Book now</h3>
          <p class="progress" id="chk-progress" aria-live="polite"></p>
          <ul class="checks">${mine.map((b, i) => chkItem(b, o.id, i))}</ul>
          ${also.length ? html`<h4 style="margin:1.4rem 0 .6rem">Also</h4><ul class="checks">${also.map((b, i) => chkItem(b, 'all', i))}</ul>` : ''}
        </div>
        <div>
          ${(o.watch_outs || []).length ? html`<h3>Watch outs for this route</h3><ul class="warn" style="margin-top:.6rem">${o.watch_outs.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
          <h3 style="margin-top:1.75rem">Landing at 05:15</h3>
          <ol class="steps" style="margin-top:.6rem">${(g.arrival || []).map((x) => html`<li>${x}</li>`)}</ol>
          <h3 style="margin-top:1.75rem">Flying home Sunday</h3>
          <ol class="steps" style="margin-top:.6rem">${(g.departure || []).map((x) => html`<li>${x}</li>`)}</ol>
        </div>
      </div>
      <div class="sub"><h3>Money and apps</h3>
        <div class="scroll" style="margin-top:.6rem"><table class="tbl apps" style="min-width:34rem"><thead><tr><th>Name</th><th>What it does</th><th>Note</th></tr></thead>
          <tbody>${(g.money_apps || []).map((a) => html`<tr><td>${a.name}</td><td>${a.what}</td><td>${a.note}</td></tr>`)}</tbody></table></div>
      </div>
      <div class="sub cols2">
        <div><h3>Entry</h3><ul class="steps" style="margin-top:.6rem">${(g.entry || []).map((x) => html`<li>${x}</li>`)}</ul></div>
        <div><h3>Weather and packing</h3>
          ${w.summary ? html`<p style="margin-top:.6rem">${w.summary}</p>` : ''}
          ${w.temps ? html`<p class="small muted" style="margin-top:.5rem">${w.temps}</p>` : ''}
          ${(w.packing || []).length ? html`<ul class="pack" style="margin-top:.8rem">${w.packing.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
        </div>
      </div>`);
    updateProgress();
  }

  /* ================================================================== places ================================================================== */
  const ZONE_ORDER = ['Seoul', 'Gangwon coast', 'Gyeongju', 'Busan', 'Jeju', 'Elsewhere'];
  let placeItems = [];

  function renderPlaces() {
    const list = Object.values(T.places).filter((p) => p.hidden !== true);
    const zrank = (z) => { const i = ZONE_ORDER.indexOf(z); return i < 0 ? 99 : i; };
    list.sort((a, b) => zrank(a.zone) - zrank(b.zone) || String(a.name).localeCompare(String(b.name)));
    placeItems = list.map((p) => ({ p, q: [p.name, p.name_ko, p.area, p.zone, p.category, p.region, p.summary].filter(Boolean).join(' ').toLowerCase(), el: null }));
    const zones = [...new Set(list.map((p) => p.zone || 'Elsewhere'))].sort((a, b) => zrank(a) - zrank(b) || a.localeCompare(b));
    const cats = [...new Set(list.map((p) => p.category))].sort();
    const count = (key, v) => list.filter((p) => (key === 'zone' ? (p.zone || 'Elsewhere') : p.category) === v).length;
    put($('#places-body'), html`
      <div class="pl-bar">
        <div class="pl-row">
          <div class="field" style="flex:1 1 16rem;max-width:26rem"><label for="place-filter" class="micro">Filter by name, area or keyword</label><input type="search" id="place-filter" placeholder="Try palace, ramen, sunset" autocomplete="off"></div>
          <label class="check" for="place-inplan"><input type="checkbox" id="place-inplan"><span>In this plan only</span></label>
          <p class="pl-count" id="place-count" aria-live="polite"></p>
        </div>
        <div class="pl-row" role="group" aria-label="Region"><span class="label">Region</span>
          <div class="chips"><button type="button" class="chip chipbtn" id="zone-all" data-zone="all" aria-pressed="true">All <small class="mono">${list.length}</small></button>
          ${zones.map((z) => html`<button type="button" class="chip chipbtn" id="zone-${slug(z)}" data-zone="${z}" aria-pressed="false">${z} <small class="mono">${count('zone', z)}</small></button>`)}</div>
        </div>
        <div class="pl-row" role="group" aria-label="Category"><span class="label">Type</span>
          <div class="chips"><button type="button" class="chip chipbtn" id="cat-all" data-cat="all" aria-pressed="true">All</button>
          ${cats.map((c) => html`<button type="button" class="chip chipbtn" id="cat-${slug(c)}" data-cat="${c}" aria-pressed="false">${catLabel(c)} <small class="mono">${count('cat', c)}</small></button>`)}</div>
        </div>
      </div>
      <div class="pl-grid" id="pl-grid">${list.map(placeCard)}</div>
      <p class="pl-empty" id="pl-empty" hidden>No places match those filters.</p>
      <p class="pl-morewrap"><button type="button" class="linkbtn" id="pl-more-btn" hidden></button></p>`);
    $('#pl-more-btn').addEventListener('click', () => { state.placesAll = true; applyPlaceFilter(); });
    $$('#pl-grid .pl').forEach((el, i) => { placeItems[i].el = el; });
  }

  function placeCard(p) {
    const cost = costText(p);
    const hc = [p.hours, cost].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ');
    return html`
      <article class="card pl" id="pl-${p.id}" data-id="${p.id}">
        <div>${pic(p.image, motifFor(null, p), p.name)}</div>
        <div style="min-width:0">
          <h3>${p.name}</h3>
          ${p.name_ko ? html`<p class="ko">${p.name_ko}</p>` : ''}
          <p class="pl-meta">${[p.area, catLabel(p.category)].filter(Boolean).join(' · ')}</p>
          <p class="pl-sum">${p.summary}</p>
          ${hc ? html`<p class="pl-hc">${hc}</p>` : ''}
          ${links(p.name, p.name_ko, p.lat, p.lon)}
          <p class="pl-plan"></p>
        </div>
        ${aboutHtml(p, 'pl-more')}
      </article>`;
  }

  let planDays = new Map();
  function updatePlacesPlan() {
    planDays = new Map();
    for (const d of state.opt.days || []) for (const it of d.items || []) {
      if (!it.place_id) continue;
      if (!planDays.has(it.place_id)) planDays.set(it.place_id, []);
      const arr = planDays.get(it.place_id);
      if (!arr.includes(d.date)) arr.push(d.date);
    }
    for (const it of placeItems) {
      const tag = $('.pl-plan', it.el);
      if (!tag) continue;
      const days = planDays.get(it.p.id);
      put(tag, days ? html`<span class="chip chip--soft">In this plan: ${days.map(dayShort).join(', ')}</span>` : '');
    }
    applyPlaceFilter();
  }

  function applyPlaceFilter() {
    const q = state.q.trim().toLowerCase();
    // Unfiltered, the grid shows the first PLACES_PREVIEW cards with a "Show all" button; any filter shows every match.
    const filtered = !!q || state.zone !== 'all' || state.cat !== 'all' || state.inplan;
    const cap = filtered || state.placesAll ? Infinity : PLACES_PREVIEW;
    let n = 0, shown = 0;
    for (const it of placeItems) {
      const ok = (state.zone === 'all' || (it.p.zone || 'Elsewhere') === state.zone)
        && (state.cat === 'all' || it.p.category === state.cat)
        && (!q || it.q.includes(q))
        && (!state.inplan || planDays.has(it.p.id));
      if (ok) n++;
      const show = ok && shown < cap;
      if (show) shown++;
      it.el.hidden = !show;
    }
    const c = $('#place-count');
    if (c) c.textContent = shown < n ? `Showing ${shown} of ${n} places` : `Showing ${n} of ${placeItems.length} places`;
    const more = $('#pl-more-btn');
    if (more) { more.hidden = shown >= n; more.textContent = `Show all ${n} places`; }
    const e = $('#pl-empty');
    if (e) e.hidden = n > 0;
  }

  /* ================================================================== footer ================================================================== */
  function renderFooter() {
    const m = T.meta || {};
    const imgs = Object.values(T.images || {});
    put($('#footer'), html`
      <p>Prices were live-checked Oct 6–7, 2026. Recheck before booking: hotel rooms and trains sell out.</p>
      <p>Exchange rate used: 1 USD = ${NUM.format(m.fx || FX)} KRW.</p>
      <p>Map data: KOSTAT boundaries via southkorea-maps, Natural Earth via world-atlas, Han River © OpenStreetMap contributors (ODbL).</p>
      ${m.photos_note ? html`<p>${m.photos_note}</p>` : ''}
      ${imgs.length ? html`<div><p><b>Image credits</b></p><ul>${imgs.map((im) => html`<li>${im.alt || im.src}: ${im.author || 'unknown'}, ${im.license || ''}${im.source_url ? html` · <a href="${im.source_url}" target="_blank" rel="noopener">source</a>` : ''}</li>`)}</ul></div>` : ''}`);
  }

  /* ================================================================== events and routing ================================================================== */
  function optionFromHash() {
    let h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#/, '')); } catch (e) { h = ''; }
    return T.options.find((o) => o.id === h) || null;
  }
  function choose(id) {
    if (!T.options.some((o) => o.id === id)) return;
    if (location.hash.slice(1) === id) { if (!state.opt || state.opt.id !== id) applyOption(id); return; }
    try { location.hash = id; } catch (e) { /* ignore */ }
    setTimeout(() => { if (!state.opt || state.opt.id !== id) applyOption(id); }, 60);
  }

  function applyOption(id) {
    const opt = T.options.find((o) => o.id === id);
    if (!opt) return;
    state.opt = opt;
    state.activeDay = null;
    store.set('option', id);
    updateCards();
    renderCompare();
    renderPlan();
    renderStays();
    renderBudget();
    renderAutumn();
    renderJapan();
    renderFood();
    renderBefore();
    updatePlacesPlan();
    viz('setOption', opt);
    viz('focusDay', null);
  }

  function bindEvents() {
    window.addEventListener('scroll', onScrollSettle, { passive: true });
    window.addEventListener('hashchange', () => {
      const o = optionFromHash();
      if (o && (!state.opt || o.id !== state.opt.id)) applyOption(o.id);
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const pick = t.closest('.opt-btn');
      if (pick) { choose(pick.dataset.opt); return; }
      const chip = t.closest('.daychip');
      if (chip) { goDay(chip.dataset.date); return; }
      const zb = t.closest('[data-zone].chipbtn');
      if (zb) { state.zone = zb.dataset.zone; $$('[data-zone].chipbtn').forEach((b) => b.setAttribute('aria-pressed', String(b === zb))); applyPlaceFilter(); return; }
      const cb = t.closest('[data-cat].chipbtn');
      if (cb) { state.cat = cb.dataset.cat; $$('[data-cat].chipbtn').forEach((b) => b.setAttribute('aria-pressed', String(b === cb))); applyPlaceFilter(); return; }
      const a = t.closest('a[href^="#"]');
      if (a) {
        let id = '';
        try { id = decodeURIComponent(a.getAttribute('href').slice(1)); } catch (err) { id = ''; }
        if (!id || T.options.some((o) => o.id === id)) return;
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        scrollToEl(el);
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
        return;
      }
      const day = t.closest('.day');
      if (day && !t.closest('a,button,summary,input,label,details')) setActive(day.dataset.date);
    });

    document.addEventListener('change', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement)) return;
      if (t.id === 'oct16') { state.oct16 = t.checked; store.set('oct16', state.oct16); updateBudget(); return; }
      if (t.id === 'place-inplan') { state.inplan = t.checked; applyPlaceFilter(); return; }
      if (t.dataset.chk) {
        if (t.checked) state.checks[t.dataset.chk] = true; else delete state.checks[t.dataset.chk];
        store.set('checks', state.checks);
        updateProgress();
        return;
      }
      if (t.type === 'radio' && t.dataset.all) {
        const p = picksFor(state.opt.id);
        (state.opt.stays || []).forEach((s) => { p[s.stop] = t.value; });
        store.set('tiers', state.picks);
        syncStays();
        return;
      }
      if (t.type === 'radio' && t.dataset.stop) {
        picksFor(state.opt.id)[t.dataset.stop] = t.value;
        store.set('tiers', state.picks);
        syncStays();
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'place-filter') { state.q = e.target.value; applyPlaceFilter(); }
    });
  }

  /* ---- scroll spy for the section nav ---- */
  function setupNavSpy() {
    if (!('IntersectionObserver' in window)) return;
    const links = new Map($$('#secnav a').map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a, id) => { if (id === en.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        const a = links.get(en.target.id);
        const ul = a && a.closest('ul');
        if (ul) ul.scrollLeft = Math.max(0, a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2);
      });
    }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
    links.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---- map and pins ---- */
  function setupMap() {
    const host = $('#map');
    if (!host) return;
    if (!window.Viz) {
      put(host, html`<div class="map-ph">The map did not load. Each stop in the day cards still has Naver Map and Google Maps links.</div>`);
      return;
    }
    viz('initMap', host);
    if (!host.firstChild) put(host, html`<div class="map-ph">The map could not start. Each stop in the day cards still has Naver Map and Google Maps links.</div>`);
    window.Viz.onPin = (date, idx) => {
      const el = document.getElementById(`it-${date}-${idx}`);
      if (!el) return;
      setActive(date);
      scrollToEl(el, 'center');
      el.classList.add('is-hit');
      setTimeout(() => el.classList.remove('is-hit'), 2400);
    };
  }

  /* ================================================================== init ================================================================== */
  function init() {
    renderHeader();
    renderRoutes();
    renderPlaces();
    renderFooter();
    bindEvents();
    const first = optionFromHash()
      || T.options.find((o) => o.id === store.get('option', null))
      || T.options.find((o) => o.recommended)
      || T.options[0];
    if (!location.hash) { try { history.replaceState(null, '', '#' + first.id); } catch (e) { /* sandboxed */ } }
    const cmp = $('#compare');
    if (cmp && window.matchMedia) cmp.open = window.matchMedia('(min-width: 900px)').matches;
    setupMap();
    applyOption(first.id);
    setupNavSpy();
  }
  init();
})();
