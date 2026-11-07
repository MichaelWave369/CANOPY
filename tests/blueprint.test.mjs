import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS,MATERIALS,FACTORS,BLUEPRINT_SCHEMA,calculateBuilding,blueprintExport} from '../src/blueprint.js';
import {DISTRICTS} from '../src/model.js';
const close=(a,b,eps=.01)=>assert.ok(Math.abs(a-b)<=eps, String(a)+' expected '+String(b));

test('all four reference typologies are internally consistent',()=>{
 assert.equal(Object.keys(BUILDINGS).length,4);
 for(const [id,b] of Object.entries(BUILDINGS)){
   const q=calculateBuilding(b);
   assert.equal(q.footprintM2+q.courtyardAreaM2,q.outerAreaM2,id);
   close(q.grossFloorAreaM2,q.footprintM2*b.floors);
   assert.ok(q.housingUnits>=0 && Number.isInteger(q.housingUnits));
   assert.ok(q.estimatedResidents>=0 && Number.isInteger(q.estimatedResidents));
   assert.ok(q.heightM>0 && q.checks.some(c=>c.state==='not-verified'));
   assert.ok(DISTRICTS.some(d=>d.id===b.districtId));
   assert.ok(MATERIALS[b.material]);
 }
});

test('reference courtyard footprint is voided, not an entire block',()=>{
 const b=BUILDINGS.courtyard,q=calculateBuilding(b);
 close(q.outerAreaM2,60*48);
 close(q.courtyardAreaM2,28*22);
 close(q.footprintM2,60*48-28*22);
 close(q.grossFloorAreaM2,q.footprintM2*6);
 close(q.heightM,20.4);
});

test('net homes and residents respond to floor count and dwelling size',()=>{
 const b=BUILDINGS.courtyard;
 const start=calculateBuilding(b),moreFloors=calculateBuilding({...b,floors:7});
 const largerHomes=calculateBuilding({...b,averageUnitM2:100});
 assert.ok(moreFloors.grossFloorAreaM2>start.grossFloorAreaM2);
 assert.ok(moreFloors.housingUnits>=start.housingUnits);
 assert.ok(largerHomes.housingUnits<start.housingUnits);
 assert.ok(start.estimatedResidents>0);
});

test('roof partition conserves areas with mandatory service access',()=>{
 for(const b of Object.values(BUILDINGS)){
  const x=calculateBuilding(b);
  close(x.solarAreaM2+x.greenRoofAreaM2+x.reservedRoofM2,x.footprintM2,.11);
  assert.ok(x.reservedRoofM2>=x.footprintM2*FACTORS.minimumRoofReservePct/100-.11);
 }
});

test('solar and energy arithmetic disclose synthetic assumptions',()=>{
 const b=BUILDINGS.courtyard,x=calculateBuilding(b);
 close(x.pvKWp,x.solarAreaM2*FACTORS.panelKwPerM2,.11);
 close(x.pvAnnualMWh,x.pvKWp*8760*.19/1000,.2);
 close(x.electricAnnualMWh,x.grossFloorAreaM2*b.annualEuiKwhM2/1000,.11);
 close(x.referencePvSharePct,x.pvAnnualMWh/x.electricAnnualMWh*100,.15);
});

test('solar allocation is not free electricity',()=>{
 const b=BUILDINGS.courtyard;
 const zero=calculateBuilding({...b,solarRoofShare:0});
 const some=calculateBuilding(b);
 assert.equal(zero.pvAnnualMWh,0);
 assert.equal(zero.pvKWp,0);
 assert.ok(some.pvAnnualMWh>zero.pvAnnualMWh);
 close(zero.electricAnnualMWh,some.electricAnnualMWh);
});

test('invalid geometry, roof shares and material references are rejected',()=>{
 const b=BUILDINGS.courtyard;
 assert.throws(()=>calculateBuilding({...b,courtWidthM:b.widthM}),RangeError);
 assert.throws(()=>calculateBuilding({...b,courtDepthM:b.depthM-1}),RangeError);
 assert.throws(()=>calculateBuilding({...b,solarRoofShare:75,greenRoofShare:40}),RangeError);
 assert.throws(()=>calculateBuilding({...b,widthM:Infinity}),RangeError);
 assert.throws(()=>calculateBuilding({...b,floors:4.4}),RangeError);
 assert.throws(()=>calculateBuilding({...b,material:'living-root-foundations'}),RangeError);
 assert.throws(()=>calculateBuilding(null),TypeError);
});

test('export is versioned, explicitly unpermitted, and keeps input source',()=>{
 const result=JSON.parse(blueprintExport(BUILDINGS.courtyard,'roof'));
 assert.equal(result.schema,BLUEPRINT_SCHEMA);
 assert.match(result.status,/NOT FOR CONSTRUCTION/);
 assert.equal(result.planLevel,'roof');
 assert.equal(result.coordinateSystem,'local meters only, no georeference and no parcel');
 assert.equal(result.assumptions.solar.includes('19%'),true);
 assert.equal(result.material.label,MATERIALS.timber.label);
 assert.equal(result.building.input.widthM,60);
 assert.ok(result.building.checks.some(c=>c.state==='not-verified'));
 assert.throws(()=>blueprintExport(BUILDINGS.courtyard,'certified'),RangeError);
});
