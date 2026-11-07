import test from 'node:test';
import assert from 'node:assert/strict';
import {DISTRICTS,LAND_USE} from '../src/model.js';
import {ATLAS_SCHEMA,SITE,SETBACKS,HABITAT,WETLANDS,RIVER_HALF_WIDTH_PCT,
  metersToPercentX,riparianHalfWidthPct,riverCenterX,insideEllipse,
  classifyPoint,assessDistrict,estimateAtlas,riverPath,atlasExport} from '../src/atlas.js';

test('reference atlas is explicitly local and un-georeferenced',()=>{
  assert.equal(ATLAS_SCHEMA,'canopy.atlas.v1');
  assert.equal(SITE.status,'ILLUSTRATIVE / UNGEOREFERENCED');
  assert.equal(SITE.widthKm*SITE.heightKm,SITE.areaKm2);
  assert.equal(DISTRICTS.length,6);
  assert.equal(SETBACKS.reference,120);
});

test('x-axis setback conversion is documented and bounded',()=>{
  assert.equal(metersToPercentX(40),1);
  assert.equal(metersToPercentX(120),3);
  assert.equal(riparianHalfWidthPct(120),RIVER_HALF_WIDTH_PCT+3);
  assert.throws(()=>metersToPercentX(-4),RangeError);
  assert.throws(()=>metersToPercentX(Infinity),RangeError);
  assert.ok(Number.isFinite(riverCenterX(17)));
});

test('habitat, wetland and river classify as schematic exclusions',()=>{
  for(const a of HABITAT)assert.equal(classifyPoint(a.x,a.y).reason,'habitat');
  for(const a of WETLANDS)assert.equal(classifyPoint(a.x,a.y).reason,'wetland');
  assert.equal(classifyPoint(riverCenterX(50),50).reason,'riparian');
  assert.equal(classifyPoint(0,50).class,'unmapped');
  assert.equal(insideEllipse(1,1,{x:1,y:1,rx:2,ry:2}),true);
});

test('river edge review belt does not pretend to be mapped flood hazard',()=>{
  const y=40,x=riverCenterX(y)+riparianHalfWidthPct(120)+2;
  const result=classifyPoint(x,y,120);
  assert.equal(result.class,'review');
  assert.equal(result.zone,'unverified-river-review-belt');
  assert.throws(()=>classifyPoint(NaN,40),RangeError);
});

test('district test only returns sampled review flags and never approval',()=>{
 for(const d of DISTRICTS){
   const r=assessDistrict(d,120);
   assert.equal(r.totalSamples,109);
   assert.equal(r.exclusionSamples+r.reviewSamples<=109,true);
   assert.ok(['review-overlap','proximity-review','not-flagged'].includes(r.status));
   assert.notEqual(r.status,'approved');
 }
});

test('larger schematic setback never decreases excluded union area',()=>{
 const low=estimateAtlas(40),mid=estimateAtlas(120),high=estimateAtlas(320);
 assert.ok(high.excludedPct>=mid.excludedPct);
 assert.ok(mid.excludedPct>=low.excludedPct);
 assert.ok(low.excludedPct>0);
 assert.ok(high.excludedPct<100);
 assert.ok(Math.abs(mid.excludedPct+mid.reviewPct+mid.unmappedPct-100)<.2);
 assert.equal(mid.districts.length,6);
 assert.equal(mid.overlapReviewCount,mid.districts.filter(x=>x.status==='review-overlap').length);
 assert.equal(LAND_USE.find(x=>x.key==='habitat').percent,48);
});

test('river shapes use only local positive viewbox coordinates',()=>{
 const path=riverPath(riparianHalfWidthPct(120));
 assert.ok(path.startsWith('M'));
 assert.ok(path.endsWith(' Z'));
 assert.ok(path.includes(' L'));
 assert.throws(()=>riverPath(-1),RangeError);
});

test('JSON atlas export declares assumptions and rejects interpretation as GIS',()=>{
 const data=JSON.parse(atlasExport(160));
 assert.equal(data.schema,ATLAS_SCHEMA);
 assert.match(data.status,/NOT REAL GIS/);
 assert.match(data.disclaimer,/Do not use for permitting/);
 assert.equal(data.methodology.riparianSetbackMeters,160);
 assert.equal(data.result.districts.length,6);
 assert.equal(data.coordinateSystem.status,SITE.status);
 assert.equal(data.conceptualLandBudget.reduce((a,b)=>a+b.percent,0),100);
 assert.equal(data.zones.habitat.length,HABITAT.length);
});
