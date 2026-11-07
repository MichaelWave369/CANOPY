import test from 'node:test';
import assert from 'node:assert/strict';
import {ENERGY_DEFAULTS,WATER_DEFAULTS,ENERGY_PRESETS,WATER_PRESETS,simulateEnergy,simulateWater,scenarioExport} from '../src/scenario.js';
const near=(a,b,t=.001)=>assert.ok(Math.abs(a-b)<=t,String(a)+' != '+String(b));
test('annual generation follows assumed capacity factors',()=>{
 const r=simulateEnergy({...ENERGY_DEFAULTS,batteryMWh:0});
 near(r.generationGWh,(105*8760*.19+25*8760*.3)/1000,.005);
 near(r.annualDemandGWh,240);assert.equal(r.monthly.length,12);
 assert.equal(r.batteryChargedGWh,0);
 assert.ok(r.monthly.every(m=>m.demandGWh>0 && m.generationGWh>=0));
});
test('hourly dispatch conserves energy including storage losses',()=>{
 for(const p of Object.values(ENERGY_PRESETS)){
  const r=simulateEnergy(p);
  near(r.balanceErrorMWh,0,.000001);
  assert.ok(r.gridImportGWh>=0 && r.possibleSurplusGWh>=0 && r.batteryLossGWh>=0);
  assert.ok(r.localSharePct>=0 && r.localSharePct<=100);
  assert.ok(r.finalStorageMWh>=0 && r.finalStorageMWh<=r.inputs.batteryMWh);
 }
});
test('storage shifts energy but does not generate it',()=>{
 const a=simulateEnergy({...ENERGY_DEFAULTS,batteryMWh:0}),b=simulateEnergy(ENERGY_DEFAULTS);
 assert.ok(b.gridImportGWh<=a.gridImportGWh+.001);
 assert.ok(b.possibleSurplusGWh<=a.possibleSurplusGWh+.001);
 assert.ok(b.batteryLossGWh>0);
});
test('zero local generation still needs imports',()=>{
 const r=simulateEnergy({...ENERGY_DEFAULTS,solarMW:0,windMW:0,batteryMWh:0});
 near(r.gridImportGWh,r.annualDemandGWh);near(r.localSharePct,0);near(r.possibleSurplusGWh,0);
});
test('efficiency reduces demand, not generation',()=>{
 const a=simulateEnergy(ENERGY_DEFAULTS),b=simulateEnergy({...ENERGY_DEFAULTS,demandReductionPct:25});
 near(b.annualDemandGWh,180);near(b.generationGWh,a.generationGWh);
});
test('water reuse is limited by all treatment constraints',()=>{
 const r=simulateWater(WATER_DEFAULTS);
 near(r.grossUseML,7.2);near(r.reclaimedML,2.52);near(r.freshwaterRequiredML,4.68);
 near(r.reclaimedML+r.freshwaterRequiredML,r.grossUseML);near(r.hypotheticalWaterGapML,0);
});
test('drought reveals shortfall, not invented water',()=>{
 assert.ok(simulateWater(WATER_PRESETS.drought).hypotheticalWaterGapML>0);
 const r=simulateWater({...WATER_DEFAULTS,treatmentCapacityML:0,availableFreshML:0});
 near(r.reclaimedML,0);near(r.hypotheticalWaterGapML,r.grossUseML);
});
test('invalid values rejected and export is labeled synthetic',()=>{
 assert.throws(()=>simulateEnergy({...ENERGY_DEFAULTS,solarMW:Infinity}),RangeError);
 assert.throws(()=>simulateWater({...WATER_DEFAULTS,conservationPct:NaN}),RangeError);
 const x=JSON.parse(scenarioExport(ENERGY_DEFAULTS,WATER_DEFAULTS));
 assert.equal(x.schema,'canopy.scenario.v1');
 assert.equal(x.status,'SYNTHETIC_PLANNING_EXERCISE');
 assert.equal(x.energy.monthly.length,12);
 assert.equal(x.assumptions.baselineElectricityGWh,240);
});
