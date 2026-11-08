import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS} from '../src/blueprint.js';
import {DISTRICTS} from '../src/model.js';
import {SETBACKS,estimateAtlas} from '../src/atlas.js';
import {DEFAULT_CAPACITY,evaluateNeighborhood} from '../src/neighborhood.js';
import {DEFAULT_INFRA,runInfrastructure} from '../src/infrastructure.js';
import {composeMetrics,validateLayout,footprint} from '../src/district.js';
import {buildEvidenceLedger,validateEvidenceLedger,REVIEW_GATES} from '../src/evidence.js';
import {WORKSPACE_SCHEMA,PREVIOUS_SCHEMA,STORAGE_KEY,PREVIOUS_STORAGE_KEY,referenceSnapshot,createWorkspace,
 validateSnapshot,activeRevision,commitWorkspace,serializeWorkspace,parseWorkspace,compareSnapshots} from '../src/workspace.js';

const next=(snapshot,fields)=>({...snapshot,...fields});
const lookup=(claims,id)=>claims.find(c=>c.id===id);
test('City Twin v2 snapshot tracks every previously isolated panel setting',()=>{
 const s=referenceSnapshot();
 assert.equal(WORKSPACE_SCHEMA,'canopy.workspace.v2');
 assert.equal(PREVIOUS_SCHEMA,'canopy.workspace.v1');
 assert.notEqual(STORAGE_KEY,PREVIOUS_STORAGE_KEY);
 assert.equal(s.atlasSetbackM,SETBACKS.reference);
 assert.deepEqual(s.community,DEFAULT_CAPACITY);
 assert.deepEqual(s.infrastructure,DEFAULT_INFRA);
 assert.deepEqual(s.prototypes,BUILDINGS);
 assert.equal(Object.keys(s.layouts).length,DISTRICTS.length);
 assert.equal(validateSnapshot(s),true);
});
test('raising residential prototype floors updates housing, loads and source-linked evidence',()=>{
 const s=referenceSnapshot();
 const base=s.prototypes.courtyard;
 const upgraded={...s,prototypes:{...s.prototypes,courtyard:{...base,floors:base.floors+1}}};
 assert.equal(validateSnapshot(upgraded),true);
 const layout=s.layouts.garden;
 const before=composeMetrics(layout,s.prototypes),after=composeMetrics(layout,upgraded.prototypes);
 assert.ok(after.grossFloorAreaM2>before.grossFloorAreaM2);
 assert.ok(after.housingUnits>=before.housingUnits);
 const utBefore=runInfrastructure(layout,s.infrastructure,s.prototypes);
 const utAfter=runInfrastructure(layout,upgraded.infrastructure,upgraded.prototypes);
 assert.ok(utAfter.demands.thermalPeakMW>utBefore.demands.thermalPeakMW);
 const source=buildEvidenceLedger(upgraded);
 assert.equal(lookup(source,'BL-002').value>lookup(buildEvidenceLedger(s),'BL-002').value,true);
 assert.equal(lookup(source,'DI-003').value,after.estimatedResidents);
 assert.equal(lookup(source,'UT-003').value,utAfter.demands.thermalPeakMW);
 assert.equal(validateEvidenceLedger(source).constructionClearance,false);
 assert.ok(REVIEW_GATES.every(g=>g.status==='not-verified'));
});
test('changing roof solar allocation flows into all related district totals',()=>{
 const s=referenceSnapshot(),p=s.prototypes.courtyard;
 const modified=next(s,{prototypes:{...s.prototypes,courtyard:{...p,solarRoofShare:p.solarRoofShare+5}}});
 assert.equal(validateSnapshot(modified),true);
 const before=composeMetrics(s.layouts.garden,s.prototypes),after=composeMetrics(s.layouts.garden,modified.prototypes);
 assert.ok(after.pvAnnualMWh>before.pvAnnualMWh);
 assert.ok(after.greenRoofAreaM2===before.greenRoofAreaM2);
 assert.ok(compareSnapshots(s,modified).metrics.some(m=>m.key==='District rooftop PV'&&m.delta>0));
});
test('resize edits cannot collide with any protected district or an adjacent building',()=>{
 const s=referenceSnapshot(),b=s.prototypes.courtyard;
 const unsafe=next(s,{prototypes:{...s.prototypes,courtyard:{...b,widthM:110}}});
 assert.throws(()=>validateSnapshot(unsafe),/Invalid .*layout|Too close|Reserved zone/);
 const before=footprint(s.layouts.garden.find(x=>x.template==='courtyard'),s.prototypes);
 assert.equal(before.w,b.widthM);
 assert.equal(validateLayout(s.layouts.garden,s.prototypes).ok,true);
});
test('Atlas buffer revision changes ecological overlay calculation without fabricating GIS',()=>{
 const s=referenceSnapshot();
 const wider=next(s,{atlasSetbackM:SETBACKS.reference+40});
 assert.equal(validateSnapshot(wider),true);
 const d=compareSnapshots(s,wider).metrics.find(x=>x.key==='Atlas schematic exclusions');
 assert.equal(d.after,estimateAtlas(wider.atlasSetbackM).excludedPct);
 assert.ok(d.delta>=0);
 assert.equal(lookup(buildEvidenceLedger(wider),'EC-001').value,wider.atlasSetbackM);
 assert.throws(()=>validateSnapshot(next(s,{atlasSetbackM:125})),RangeError);
});
test('community seats and utility throughput propagate into services and flow warnings',()=>{
 const s=referenceSnapshot(),l=s.layouts.garden;
 const changed=next(s,{community:{...s.community,schoolSeats:0},
  infrastructure:{...s.infrastructure,thermalPlantMW:0}});
 assert.equal(validateSnapshot(changed),true);
 const baseServices=evaluateNeighborhood(l,s.community,s.prototypes).services.school;
 const laterServices=evaluateNeighborhood(l,changed.community,changed.prototypes).services.school;
 assert.ok(laterServices.gap>=baseServices.gap);
 const twin=runInfrastructure(l,changed.infrastructure,changed.prototypes);
 assert.equal(twin.systems.thermal.delivered,0);
 assert.ok(twin.systems.thermal.shortfall>0);
 const diff=compareSnapshots(s,changed);
 assert.ok(diff.metrics.some(m=>m.key==='School seat shortfall'&&m.delta>=0));
 assert.ok(diff.metrics.some(m=>m.key==='District peak thermal load'&&m.delta===0));
});
test('v1 JSON imports preserve original revision IDs, layouts, undo cursor and new defaults',()=>{
 const a=createWorkspace(),s=activeRevision(a).snapshot;
 const {prototypes,atlasSetbackM,community,infrastructure,...legacy}=s;
 const v1={schema:PREVIOUS_SCHEMA,status:a.status,cursor:0,nextRevision:1,
  history:[{revision:0,label:'Old user scenario',snapshot:legacy}]};
 const migrated=parseWorkspace(JSON.stringify(v1));
 assert.equal(migrated.schema,WORKSPACE_SCHEMA);
 assert.equal(migrated.cursor,0);
 assert.equal(migrated.history[0].label,'Old user scenario');
 assert.deepEqual(migrated.history[0].snapshot.energy,s.energy);
 assert.deepEqual(migrated.history[0].snapshot.layouts,s.layouts);
 assert.deepEqual(migrated.history[0].snapshot.prototypes,BUILDINGS);
 assert.equal(migrated.history[0].snapshot.atlasSetbackM,SETBACKS.reference);
 assert.equal(parseWorkspace(serializeWorkspace(migrated)).schema,WORKSPACE_SCHEMA);
 const revised=commitWorkspace(migrated,{...activeRevision(migrated).snapshot,atlasSetbackM:160},'River update');
 assert.equal(activeRevision(revised).revision,1);
});
test('v1 imported approvals and malformed additional fields are rejected',()=>{
 const s=referenceSnapshot();
 const {prototypes,atlasSetbackM,community,infrastructure,...legacy}=s;
 const old={schema:PREVIOUS_SCHEMA,status:'APPROVED',cursor:0,nextRevision:1,history:[{revision:0,label:'Unsafe',snapshot:legacy}]};
 assert.throws(()=>parseWorkspace(JSON.stringify(old)),RangeError);
 const broken={...old,status:'SYNTHETIC / UNVERIFIED / NOT FOR CONSTRUCTION',
  history:[{revision:0,label:'Unsafe',snapshot:{...legacy,certified:true}}]};
 assert.throws(()=>parseWorkspace(JSON.stringify(broken)),RangeError);
 const spoof={...s,prototypes:{...s.prototypes,courtyard:{...s.prototypes.courtyard,approved:true}}};
 assert.throws(()=>validateSnapshot(spoof),RangeError);
 assert.throws(()=>validateSnapshot({...s,infrastructure:{...s.infrastructure,failedLink:'trust me'}}),RangeError);
 assert.throws(()=>validateSnapshot({...s,community:{...s.community,schoolSeats:NaN}}),RangeError);
});
test('v2 revision history replays architectural and ecological changes deterministically',()=>{
 const a=createWorkspace(),s=activeRevision(a).snapshot;
 const n=commitWorkspace(a,{...s,prototypes:{...s.prototypes,courtyard:{...s.prototypes.courtyard,floors:7}}},'Raised courtyard floors');
 const two=commitWorkspace(n,{...activeRevision(n).snapshot,atlasSetbackM:160},'Wider river reserve');
 const recovered=parseWorkspace(serializeWorkspace(two));
 assert.equal(recovered.cursor,2);
 assert.equal(activeRevision(recovered).snapshot.prototypes.courtyard.floors,7);
 assert.equal(activeRevision(recovered).snapshot.atlasSetbackM,160);
 assert.equal(validateSnapshot(activeRevision(recovered).snapshot),true);
 assert.equal(compareSnapshots(s,activeRevision(recovered).snapshot).metrics.length>8,true);
});
