const fs=require('fs');const topo=require('topojson-client');
const R=n=>Math.round(n*1e4)/1e4;
const rnd=c=>typeof c[0]==='number'?[R(c[0]),R(c[1])]:c.map(rnd);
const slim=(fc,keys)=>({type:'FeatureCollection',features:fc.features.map(f=>({type:'Feature',properties:Object.fromEntries(keys.map(k=>[k,f.properties[k]])),geometry:{type:f.geometry.type,coordinates:rnd(f.geometry.coordinates)}}))});
const prov=slim(require('../skorea_provinces_geo_simple.json'),['name','name_eng']);
const muni=slim(require('./m_0.5.json'),['name','name_eng','code']);
// neighbors
const w=require('../countries-10m.json');
const all=topo.feature(w,w.objects.countries).features;
const keep=all.filter(f=>['North Korea','Japan','China'].includes(f.properties.name));
fs.writeFileSync('nb_in.json',JSON.stringify({type:'FeatureCollection',features:keep.map(f=>({type:'Feature',properties:{name:f.properties.name},geometry:f.geometry}))}));
// han
const h=require('./han.json');
const polys=[];
for(const f of h.features){ if(f.geometry.type==='LineString')continue;
  const flat=JSON.stringify(f.geometry.coordinates).match(/-?\d+\.?\d*/g).map(Number);
  let mnx=1e9,mxx=-1e9;for(let i=0;i<flat.length;i+=2){mnx=Math.min(mnx,flat[i]);mxx=Math.max(mxx,flat[i]);}
  if(f.properties.name==='한강'||(!f.properties.name&&mxx-mnx>0.03))polys.push(f);}
console.error('han polys',polys.length);
fs.writeFileSync('han_in.json',JSON.stringify({type:'FeatureCollection',features:polys.map(f=>({type:'Feature',properties:{},geometry:f.geometry}))}));
fs.writeFileSync('part1.json',JSON.stringify({prov,muni}));
