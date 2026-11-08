import test from 'node:test';
import assert from 'node:assert/strict';
import {CANVAS,seedLayout,validateLayout} from '../src/district.js';
import {INFRA_SCHEMA,DEFAULT_INFRA,UTILITIES,NODES,LINKS,nearestHub,normalizeInfrastructure,
 districtUtilityLoads,runInfrastructure,infrastructureExport} from '../src/infrastructure.js';

const near=(a,b,eps=.005)=>assert.ok(Math.abs(a-b)<=eps,'Expected '+a+' close to '+b);

test('four independently accounted utility flows share a documented five-node schematic',()=>{
 assert.equal(INFRA_SCHEMA,'canopy.infrastructure.v1');
 assert.deepEqual(UTILITIES.map(s=>s.id),['potable','sewer','thermal','drainage']);
 assert.equal(NODES.length,5);
 assert.equal(LINKS.length,8);
 assert.ok(LINKS.every(e=>e.water>0&&e.sewer>0&&e.thermal>0&&e.drainage>0));
 assert.equal(CANVAS.areaM2,360000);
 assert.equal(nearestHub({x:100,y:301}).id,'west');
});

test('loads inherit all four prototype types with consistent mass and unit accounting',()=>{
 const layout=seedLayout('garden');
 assert.equal(validateLayout(layout).ok,true);
 const l=districtUtilityLoads(layout);
 assert.equal(l.buildings.length,layout.length);
 near(Object.values(l.nodes).reduce((s,n)=>s+n.water,0),l.grossWaterM3d);
 near(Object.values(l.nodes).reduce((s,n)=>s+n.sewer,0),l.sewerInfluentM3d);
 near(Object.values(l.nodes).reduce((s,n)=>s+n.thermal,0),l.thermalPeakMW);
 near(l.sewerInfluentM3d,l.grossWaterM3d*.82);
 assert.ok(l.grossWaterM3d>0&&l.thermalPeakMW>0);
 assert.ok(l.buildings.every(b=>b.connectionDistanceM>=0&&NODES.some(n=>n.id===b.hubId)));
});

test('water reuse derives from collected wastewater, not invented supply',()=>{
 const r=runInfrastructure(seedLayout('west'));
 const b=r.waterBalance;
 assert.ok(b.reclaimedPotentialM3d>=0);
 assert.ok(b.reclaimedPotentialM3d<=DEFAULT_INFRA.reuseCapacityM3d+.001);
 assert.ok(b.reclaimedPotentialM3d<=b.collectedSewageM3d*.28+.01);
 assert.ok(b.reclaimedPotentialM3d<=r.demands.grossWaterM3d*.30+.01);
 near(b.freshwaterRequiredM3d+b.reclaimedPotentialM3d,r.demands.grossWaterM3d,.02);
 assert.ok(r.systems.sewer.required>=r.systems.sewer.delivered);
});

test('zero wastewater plant produces no recycled water',()=>{
 const r=runInfrastructure(seedLayout('garden'),{...DEFAULT_INFRA,wastewaterPlantM3d:0});
 assert.equal(r.waterBalance.reclaimedPotentialM3d,0);
 assert.equal(r.systems.sewer.delivered,0);
 assert.ok(r.systems.sewer.shortfall>0);
});

test('zero supply and zero thermal plant cannot satisfy live buildings',()=>{
 const layout=seedLayout('garden');
 const r=runInfrastructure(layout,{...DEFAULT_INFRA,freshwaterCapacityM3d:0,reuseCapacityM3d:0,thermalPlantMW:0});
 assert.equal(r.systems.potable.delivered,0);
 assert.equal(r.systems.thermal.delivered,0);
 assert.ok(r.systems.potable.shortfall>0);
 assert.ok(r.systems.thermal.shortfall>0);
 assert.ok(r.alerts.length>=2);
});

test('delivered loads remain bounded by demand and modeled facility constraints',()=>{
 for(const id of ['west','ridge','east','meadow','garden','river']){
  const r=runInfrastructure(seedLayout(id));
  for(const value of Object.values(r.systems)){
   assert.ok(value.required>=0&&value.delivered>=0&&value.shortfall>=0);
   assert.ok(value.delivered<=value.required+.01);
   assert.ok(value.delivered<=value.plantCapacity+.01);
   assert.ok(value.servedPct>=0&&value.servedPct<=100);
   near(value.delivered+value.shortfall,value.required,.015);
  }
 }
});

test('stormwater volume uses actual scenario rain and whole schematic catchment',()=>{
 const config={...DEFAULT_INFRA,rainMm:50,runoffCoefficient:.5,eventHours:6};
 const r=runInfrastructure([],config);
 near(r.demands.stormRunoffM3,50/1000*CANVAS.areaM2*.5);
 assert.equal(r.systems.potable.required,0);
 assert.equal(r.systems.sewer.required,0);
 assert.equal(r.systems.thermal.required,0);
 assert.ok(r.systems.drainage.required>0);
 assert.ok(r.systems.drainage.delivered<=config.detentionM3+(config.infiltrationM3h+config.safeOutletM3h)*config.eventHours+.01);
});

test('no rain yields zero storm demand, not fictitious overflow',()=>{
 const r=runInfrastructure([], {...DEFAULT_INFRA,rainMm:0});
 assert.equal(r.demands.stormRunoffM3,0);
 assert.equal(r.systems.drainage.required,0);
 assert.equal(r.systems.drainage.shortfall,0);
 assert.equal(r.systems.drainage.servedPct,100);
});

test('larger storm event cannot reduce stormwater collection deficit',()=>{
 const dry=runInfrastructure([], {...DEFAULT_INFRA,rainMm:30});
 const heavy=runInfrastructure([], {...DEFAULT_INFRA,rainMm:150});
 assert.ok(heavy.systems.drainage.shortfall>=dry.systems.drainage.shortfall);
 assert.ok(heavy.systems.drainage.required>dry.systems.drainage.required);
});

test('one link can be disconnected without creating capacity or negative flow',()=>{
 const layout=seedLayout('river');
 const intact=runInfrastructure(layout);
 const broken=runInfrastructure(layout,{...DEFAULT_INFRA,failedLink:'hub-east'});
 assert.ok(broken.alerts.some(x=>x.includes('hub-east')));
 assert.ok(broken.systems.potable.delivered<=intact.systems.potable.delivered+.001);
 assert.ok(broken.systems.sewer.delivered<=intact.systems.sewer.delivered+.001);
 assert.ok(broken.systems.thermal.delivered<=intact.systems.thermal.delivered+.001);
});

test('all partial and invalid inputs fail validation instead of silently inventing data',()=>{
 assert.throws(()=>normalizeInfrastructure({freshwaterCapacityM3d:10}),RangeError);
 assert.throws(()=>normalizeInfrastructure({...DEFAULT_INFRA,failedLink:'unknown'}),RangeError);
 assert.throws(()=>normalizeInfrastructure({...DEFAULT_INFRA,runoffCoefficient:1.9}),RangeError);
 assert.throws(()=>normalizeInfrastructure({...DEFAULT_INFRA,thermalPeakWm2:NaN}),RangeError);
 assert.throws(()=>normalizeInfrastructure(null),TypeError);
 assert.throws(()=>nearestHub({x:NaN,y:45}),RangeError);
 assert.throws(()=>runInfrastructure([{template:'courtyard',col:88,row:2,id:'invalid',rotation:0}]),RangeError);
});

test('export is versioned and rejects civil, fire, quality, and conservation claims',()=>{
 const data=JSON.parse(infrastructureExport('garden',seedLayout('garden')));
 assert.equal(data.schema,'canopy.infrastructure.v1');
 assert.match(data.status,/NOT FOR CONSTRUCTION/);
 assert.equal(data.scenario.graph.nodes.length,5);
 assert.equal(data.scenario.graph.links.length,8);
 assert.ok(data.scenario.graph.buildingConnections.length>0);
 assert.ok(data.limitations.some(t=>t.includes('no verified easement')));
 assert.ok(data.limitations.some(t=>t.includes('water pressure')));
 assert.ok(data.limitations.some(t=>t.includes('treatment')));
 assert.ok(data.study.status.includes('FICTIONAL'));
});
