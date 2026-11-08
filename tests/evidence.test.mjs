import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSUMPTIONS,LAND_USE} from '../src/model.js';
import {ENERGY_DEFAULTS,WATER_DEFAULTS,simulateEnergy,simulateWater} from '../src/scenario.js';
import {BUILDINGS,calculateBuilding} from '../src/blueprint.js';
import {SETBACKS,estimateAtlas} from '../src/atlas.js';
import {seedLayout,composeMetrics,CANVAS} from '../src/district.js';
import {evaluateNeighborhood} from '../src/neighborhood.js';
import {runInfrastructure} from '../src/infrastructure.js';
import {
 EVIDENCE_SCHEMA,DOMAINS,KINDS,REVIEW_GATES,buildEvidenceLedger,
 validateEvidenceLedger,evidenceExport
} from '../src/evidence.js';
const ledger=buildEvidenceLedger();
const get=id=>ledger.find(r=>r.id===id);
const close=(v,n,e=.01)=>assert.ok(Math.abs(v-n)<=e,'Expected '+v+' near '+n);

test('evidence schema and all canonical model domains are represented',()=>{
 assert.equal(EVIDENCE_SCHEMA,'canopy.evidence.v1');
 assert.ok(ledger.length>=30);
 assert.equal(new Set(ledger.map(r=>r.id)).size,ledger.length);
 assert.deepEqual(new Set(ledger.map(r=>r.domain)),new Set(DOMAINS.map(d=>d.id)));
 assert.deepEqual(new Set(ledger.map(r=>r.kind)),new Set(KINDS.map(k=>k.id)));
});

test('ledger only claims repository traceability, never independent observations',()=>{
 const audit=validateEvidenceLedger(ledger);
 assert.equal(audit.ok,true,audit.errors.join('; '));
 assert.equal(audit.unverified,ledger.length);
 assert.equal(audit.constructionClearance,false);
 assert.equal(audit.unverifiedGates,audit.gates);
 assert.ok(ledger.every(r=>r.source.externalEvidence===false));
 assert.ok(ledger.every(r=>r.siteEvidence==='not-verified'));
});

test('real-world gates are scoped and cannot be marked approved in this feature',()=>{
 assert.equal(REVIEW_GATES.length,8);
 assert.ok(REVIEW_GATES.every(g=>g.status==='not-verified'&&g.deliverable&&g.responsible));
 const tampered=REVIEW_GATES.map(g=>({...g,status:g.id==='water'?'verified':'not-verified'}));
 const audit=validateEvidenceLedger(ledger,tampered);
 assert.equal(audit.ok,false);
 assert.ok(audit.errors.some(e=>e.includes('Gate status')));
 assert.equal(audit.constructionClearance,false);
});

test('city planning values are linked to the canonical reference model',()=>{
 assert.equal(get('CITY-001').value,ASSUMPTIONS.studyAreaKm2);
 assert.equal(get('CITY-002').value,ASSUMPTIONS.population);
 assert.equal(get('CITY-004').value,LAND_USE.find(x=>x.key==='habitat').percent);
 assert.equal(get('CITY-006').value,100);
 assert.equal(get('CITY-001').kind,'assumption');
});

test('hourly-model electricity totals match current scenario output, not stale copy',()=>{
 const e=simulateEnergy(ENERGY_DEFAULTS);
 close(get('EN-003').value,e.annualDemandGWh);
 close(get('EN-004').value,e.generationGWh);
 close(get('EN-005').value,e.gridImportGWh);
 close(get('EN-006').value,e.localSharePct);
 assert.equal(get('EN-007').value,ENERGY_DEFAULTS.batteryMWh);
 assert.ok(get('EN-005').value>0,'Annual generation parity does not remove the grid import');
});

test('source-linked water scenarios preserve conservation and reuse distinction',()=>{
 const w=simulateWater(WATER_DEFAULTS);
 assert.equal(get('WA-001').value,8);
 close(get('WA-002').value,w.grossUseML);
 close(get('WA-003').value,w.reclaimedML);
 close(get('WA-004').value,w.freshwaterRequiredML);
 close(get('WA-002').value,get('WA-003').value+get('WA-004').value);
 assert.ok(get('WA-004').verificationRequired.includes('rights'));
});

test('atlas overlay metric does not imply surveyed land',()=>{
 const a=estimateAtlas(SETBACKS.reference);
 assert.equal(get('EC-001').value,SETBACKS.reference);
 close(get('EC-002').value,a.excludedPct);
 assert.match(get('EC-002').formula,/invented/);
});

test('prototype quantities use the same calculations as the blueprint UI',()=>{
 const b=calculateBuilding(BUILDINGS.courtyard);
 close(get('BL-001').value,b.footprintM2);
 close(get('BL-002').value,b.grossFloorAreaM2);
 assert.equal(get('BL-003').value,b.housingUnits);
 close(get('BL-004').value,b.pvAnnualMWh);
 assert.equal(get('BL-001').gate,'architecture');
});

test('district and community records are from the identical seed layout',()=>{
 const seed=seedLayout('garden'),d=composeMetrics(seed),n=evaluateNeighborhood(seed);
 assert.equal(get('DI-001').value,CANVAS.areaM2/10000);
 assert.equal(get('DI-002').value,d.buildingCount);
 assert.equal(get('DI-003').value,d.estimatedResidents);
 assert.equal(get('CO-001').value,n.pedestrian.within400m);
 assert.equal(get('CO-002').value,n.services.school.gap);
 close(get('CO-003').value,Number((n.costs.lowUsd/1000000).toFixed(2)));
});

test('district utility assumptions come from synthetic infrastructure engine',()=>{
 const i=runInfrastructure(seedLayout('garden'));
 close(get('UT-001').value,i.demands.grossWaterM3d);
 close(get('UT-002').value,i.waterBalance.reclaimedPotentialM3d);
 close(get('UT-003').value,i.demands.thermalPeakMW);
 close(get('UT-004').value,i.demands.stormRunoffM3);
 close(get('UT-005').value,i.systems.drainage.shortfall);
});

test('validator rejects duplicates, false external sources, missing methods and NaNs',()=>{
 const bad=ledger.map(r=>({...r,source:{...r.source}}));
 bad.push({...bad[0]});
 bad[1].source.externalEvidence=true;
 bad[2].siteEvidence='verified';
 bad[3].source.path='https://not-an-attested-external-study.com';
 bad[4].value=NaN;
 bad[5].verificationRequired='';
 const validation=validateEvidenceLedger(bad);
 assert.equal(validation.ok,false);
 for(const needle of ['Duplicate','invented external','status cannot','traceable model','non-finite','missing methodology']){
  assert.ok(validation.errors.some(e=>e.includes(needle)),needle);
 }
 assert.equal(validation.constructionClearance,false);
});

test('every record identifies a responsible verification gate and model source',()=>{
 const gateIds=new Set(REVIEW_GATES.map(g=>g.id));
 for(const r of ledger){
  assert.ok(gateIds.has(r.gate),r.id);
  assert.match(r.source.path,/^src\/[a-zA-Z-]+\.js$/);
  assert.ok(r.source.symbol,r.id);
  assert.ok(r.verificationRequired&&r.formula,r.id);
  assert.equal(r.context,'default reference scenario');
 }
});

test('JSON export is reproducible, rejects tampering and marks approval blocked',()=>{
 const raw=evidenceExport(ledger),p=JSON.parse(raw);
 assert.equal(p.schema,EVIDENCE_SCHEMA);
 assert.equal(p.status,'MODEL TRACEABILITY ONLY / NO FIELD VERIFICATION / NOT FOR CONSTRUCTION');
 assert.equal(p.audit.constructionClearance,false);
 assert.equal(p.records.length,ledger.length);
 assert.equal(p.gateStatus.length,8);
 assert.deepEqual(p.baselineInputs.energy,ENERGY_DEFAULTS);
 assert.deepEqual(p.baselineInputs.water,WATER_DEFAULTS);
 assert.ok(p.caveats.some(s=>s.includes('No external site observation')));
 assert.equal(evidenceExport(ledger),raw);
 assert.throws(()=>evidenceExport([{...ledger[0],siteEvidence:'verified'},...ledger.slice(1)]),/malformed evidence/);
});
