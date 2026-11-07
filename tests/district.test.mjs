import test from 'node:test';
import assert from 'node:assert/strict';
import {DISTRICTS} from '../src/model.js';
import {BUILDINGS,calculateBuilding} from '../src/blueprint.js';
import {
  COMPOSER_SCHEMA,CANVAS,CENTERS,SLOTS,RESERVED,TRANSIT_STOPS,
  getSlot,footprint,exclusionHits,validatePlacement,validateLayout,
  composeMetrics,seedLayout,districtExport
} from '../src/district.js';

const near=(a,b,e=.1)=>assert.ok(Math.abs(a-b)<=e,'Expected '+a+' near '+b);

test('fictional study is 36 ha with 7 by 7 accessible grid cells',()=>{
  assert.equal(CANVAS.areaM2,360000);
  assert.equal(CANVAS.widthM*CANVAS.heightM,CANVAS.areaM2);
  assert.equal(SLOTS.length,49);
  assert.equal(CENTERS.length,7);
  assert.equal(TRANSIT_STOPS.length,3);
  assert.ok(RESERVED.some(z=>z.category==='ecology'));
  assert.deepEqual(getSlot(2,4),{col:2,row:4,x:220,y:380,id:'4-2'});
  assert.throws(()=>getSlot(7,1),RangeError);
});

test('all four typologies share Blueprint Studio dimensions and rotate correctly',()=>{
 for(const key of Object.keys(BUILDINGS)){
  const p={id:'test-'+key,template:key,col:2,row:1,rotation:0};
  const a=footprint(p),b=footprint({...p,rotation:90}),building=BUILDINGS[key];
  assert.equal(a.w,building.widthM);assert.equal(a.h,building.depthM);
  assert.equal(b.w,building.depthM);assert.equal(b.h,building.widthM);
  assert.equal(a.cx,220);assert.equal(a.cy,140);
 }
 assert.throws(()=>footprint({id:'bad',template:'fictional',col:2,row:1,rotation:0}),RangeError);
 assert.throws(()=>footprint({id:'bad',template:'courtyard',col:2,row:1,rotation:270}),RangeError);
});

test('protected grove, ecological corridor, farm, and transit remain exclusions',()=>{
 const cases=[
  {id:'grove',col:0,row:0,template:'courtyard',rotation:0},
  {id:'river',col:6,row:2,template:'terrace',rotation:0},
  {id:'food',col:1,row:6,template:'garden',rotation:0},
  {id:'tram',col:2,row:3,template:'maker',rotation:0},
  {id:'walk',col:3,row:1,template:'courtyard',rotation:0}
 ];
 for(const p of cases){
   const check=validatePlacement([],p);
   assert.equal(check.ok,false,p.id);
   assert.ok(check.reasons.some(r=>r.startsWith('Reserved zone:')),p.id);
   assert.ok(exclusionHits(footprint(p)).length>0);
 }
 assert.equal(validatePlacement([],{id:'valid',template:'courtyard',col:2,row:1,rotation:0}).ok,true);
 assert.deepEqual(validatePlacement([],{id:'out',template:'courtyard',col:7,row:1,rotation:0}).reasons,['Outside editable 7 × 7 grid']);
});

test('prototypes cannot occupy same place or violate separation',()=>{
 const one={id:'first',template:'courtyard',col:2,row:1,rotation:0};
 const same={id:'second',template:'terrace',col:2,row:1,rotation:0};
 assert.equal(validatePlacement([one],same).ok,false);
 assert.equal(validatePlacement([one],{...one,rotation:90}).ok,true);
 const overlap=validateLayout([one,same]);
 assert.equal(overlap.ok,false);
 assert.ok(overlap.problems.some(x=>x.includes('Too close')));
 assert.equal(validateLayout([one,one]).ok,false);
 assert.throws(()=>validatePlacement(null,one),TypeError);
});

test('every district template creates a valid independent preliminary quarter',()=>{
 const ids=new Set();
 for(const d of DISTRICTS){
   const p=seedLayout(d.id);
   assert.ok(p.length>=7,'Sparse example for '+d.id);
   assert.equal(validateLayout(p).ok,true,'Invalid example for '+d.id);
   assert.ok(p.every(x=>!ids.has(x.id)));
   p.forEach(x=>ids.add(x.id));
 }
});

test('district totals reconcile with building-level area, housing, PV and electricity',()=>{
 const plan=seedLayout('garden'),r=composeMetrics(plan);
 const gross=plan.reduce((sum,p)=>sum+calculateBuilding(BUILDINGS[p.template]).grossFloorAreaM2,0);
 const units=plan.reduce((sum,p)=>sum+calculateBuilding(BUILDINGS[p.template]).housingUnits,0);
 const water=r.estimatedResidents*110/1000000;
 near(r.grossFloorAreaM2,gross);
 assert.equal(r.housingUnits,units);
 near(r.domesticWaterMLPerDay,water,.0005);
 assert.ok(r.footprintM2>0&&r.footprintM2<CANVAS.areaM2);
 assert.ok(r.conceptualSiteCoveragePct>0&&r.conceptualSiteCoveragePct<100);
 assert.ok(r.maximumStraightLineToStopM>=r.averageStraightLineToStopM);
 assert.ok(r.pvAnnualMWh>0&&r.electricAnnualMWh>0);
 assert.equal(r.buildings.length,plan.length);
});

test('empty district reports zero, not fabricated homes or energy',()=>{
 const r=composeMetrics([]);
 assert.equal(r.housingUnits,0);
 assert.equal(r.estimatedResidents,0);
 assert.equal(r.domesticWaterMLPerDay,0);
 assert.equal(r.pvAnnualMWh,0);
 assert.equal(r.maximumStraightLineToStopM,0);
 assert.equal(r.averageStraightLineToStopM,0);
 assert.equal(r.buildingCount,0);
});

test('removal reduces inventory and totals, without modifying input arrays',()=>{
 const list=seedLayout('west'),before=composeMetrics(list);
 const after=composeMetrics(list.slice(1));
 assert.equal(after.buildingCount,before.buildingCount-1);
 assert.ok(after.grossFloorAreaM2<before.grossFloorAreaM2);
 assert.ok(after.estimatedResidents<=before.estimatedResidents);
 assert.equal(list.length,before.buildingCount);
});

test('export has a versioned unpermitted schema and discloses omitted utility demands',()=>{
 const plan=seedLayout('garden'),data=JSON.parse(districtExport('garden',plan));
 assert.equal(data.schema,COMPOSER_SCHEMA);
 assert.match(data.status,/NOT GIS/);
 assert.equal(data.canvas.areaM2,360000);
 assert.equal(data.placements.length,plan.length);
 assert.equal(data.metrics.estimatedResidents,composeMetrics(plan).estimatedResidents);
 assert.ok(data.warnings.some(x=>x.includes('straight-line')));
 assert.ok(data.warnings.some(x=>x.includes('public, commercial')));
 assert.ok(data.warnings.some(x=>x.includes('not actual setbacks')));
 assert.ok(data.reservedZones.some(z=>z.category==='ecology'));
 assert.ok(data.assumptions.waterPerResidentLPerDay===110);
});
