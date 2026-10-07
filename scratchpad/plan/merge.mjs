// Merge research/*.json into plan/catalog.json, deduping by id (followups win, then higher confidence).
import fs from 'node:fs';
const dir = 'research';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort((a, b) => (a.startsWith('followup') ? 1 : 0) - (b.startsWith('followup') ? 1 : 0));
const rank = { high: 3, medium: 2, low: 1 };
const out = { places: {}, lodging: {}, food: {}, events: {}, transport: [], tips: [], warnings: [], resolutions: {} };
const slug = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const src = f.replace('.json', '');
  const isFollow = src.startsWith('followup');
  for (const kind of ['places', 'lodging', 'food', 'events']) {
    for (const item of d[kind] || []) {
      const id = item.id || slug(item.name);
      const prev = out[kind][id];
      const better = !prev || isFollow || (rank[item.confidence] || 0) > (rank[prev.confidence] || 0);
      if (better) out[kind][id] = { ...(prev || {}), ...item, id, from: [...new Set([...(prev?.from || []), src])] };
      else prev.from = [...new Set([...prev.from, src])];
    }
  }
  for (const t of d.transport || []) out.transport.push({ ...t, from_file: src });
  for (const t of d.tips || []) out.tips.push(`[${src}] ${t}`);
  for (const t of d.warnings || []) out.warnings.push(`[${src}] ${t}`);
  if (d.resolution) out.resolutions[src] = d.resolution;
}
fs.writeFileSync('plan/catalog.json', JSON.stringify(out, null, 1));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length])));
