import test from 'node:test';
import assert from 'node:assert/strict';
import {ENERGY_DEFAULTS,simulateEnergy,simulateWater} from '../src/scenario.js';
import {composeMetrics} from '../src/district.js';
import {runInfrastructure} from '../src/infrastructure.js';
import {buildEvidenceLedger,validateEvidenceLedger,evidenceExport,REVIEW_GATES} from '../src/evidence.js';
import {
 WORKSPACE_SCHEMA,WORKSPACE_STATUS,STORAGE_KEY,HISTORY_LIMIT,MAX_IMPORT_CHARS,
 referenceSnapshot,validateSnapshot,createWorkspace,validateWorkspace,activeRevision,
 commitWorkspace,moveWorkspaceCursor,selectWorkspaceRevision,serializeWorkspace,parseWorkspace,
 compareSnapshots
} from '../src/workspace.js';

const initial=()=>createWorkspace();
function energyChange(workspace,patch){
 const old=activeRevision(workspace).snapshot;
 return commitWorkspace(workspace,{...old,energy:{...old.energy,...patch}},'Energy variant');
}

test('canonical reference starts with six independently valid district layouts',()=>{
 const w=initial(),s=activeRevision(w).snapshot;
 assert.equal(w.schema,WORKSPACE_SCHEMA);
 assert.equal(w.status,WORKSPACE_STATUS);
 assert.equal(w.history.length,1);
 assert.equal(w.nextRevision,1);
 assert.equal(w.cursor,0);
 assert.equal(s.districtId,'garden');
 assert.equal(Object.keys(s.layouts).length,6);
 assert.ok(Object.values(s.layouts).every(l=>l.length>=7));
 assert.equal(validateSnapshot(s),true);
 assert.equal(validateWorkspace(w),true);
 assert.equal(STORAGE_KEY,'canopy:scenario-workspace:v1');
});

test('energy edits are immutable revisions with derived model deltas',()=>{
 const original=initial(),next=energyChange(original,{solarMW:80});
 assert.equal(activeRevision(original).snapshot.energy.solarMW,105);
 assert.equal(activeRevision(next).snapshot.energy.solarMW,80);
 assert.equal(next.history.length,2);
 assert.equal(next.history[1].revision,1);
 assert.equal(next.nextRevision,2);
 const diff=compareSnapshots(referenceSnapshot(),activeRevision(next).snapshot);
 assert.ok(diff.metrics.find(m=>m.key==='Annual renewable generation').delta<0);
 assert.ok(diff.metrics.find(m=>m.key==='Grid import requirement').delta>0);
 assert.equal(diff.disclaimer.includes('synthetic'),true);
});

test('water conservation travels through the shared reference calculator',()=>{
 const before=initial(),s=activeRevision(before).snapshot;
 const changed={...s,water:{...s.water,conservationPct:30}};
 const next=commitWorkspace(before,changed,'Conserve');
 const water=simulateWater(activeRevision(next).snapshot.water);
 assert.ok(water.grossUseML<simulateWater(s.water).grossUseML);
 assert.ok(compareSnapshots(s,activeRevision(next).snapshot).metrics.some(m=>m.key==='Freshwater requirement'&&m.delta<0));
});

test('district changes recompute housing and their linked infrastructure assumptions',()=>{
 const first=initial(),s=activeRevision(first).snapshot;
 const before=s.layouts.garden,after=before.slice(1);
 const changed={...s,layouts:{...s.layouts,garden:after}};
 const next=commitWorkspace(first,changed,'Remove one building');
 const current=activeRevision(next).snapshot;
 assert.equal(current.layouts.garden.length,before.length-1);
 assert.ok(composeMetrics(current.layouts.garden).estimatedResidents<composeMetrics(before).estimatedResidents);
 assert.ok(runInfrastructure(current.layouts.garden).demands.grossWaterM3d<
  runInfrastructure(before).demands.grossWaterM3d);
 const rows=buildEvidenceLedger(current);
 const get=id=>rows.find(r=>r.id===id);
 assert.equal(get('DI-002').value,after.length);
 assert.equal(get('DI-003').value,composeMetrics(after).estimatedResidents);
 assert.equal(get('UT-001').value,runInfrastructure(after).demands.grossWaterM3d);
 assert.equal(get('EN-005').value,simulateEnergy(current.energy).gridImportGWh);
 assert.equal(get('DI-002').siteEvidence,'not-verified');
 assert.equal(validateEvidenceLedger(rows).ok,true);
});

test('changing district context updates comparisons and evidence records without losing other layouts',()=>{
 const w=initial(),s=activeRevision(w).snapshot;
 const next=commitWorkspace(w,{...s,districtId:'west'},'View West Grove');
 const active=activeRevision(next).snapshot;
 assert.equal(active.districtId,'west');
 assert.equal(active.layouts.garden.length,s.layouts.garden.length);
 assert.equal(compareSnapshots(s,active).districtId,'west');
 assert.equal(buildEvidenceLedger(active).find(x=>x.id==='DI-002').value,s.layouts.west.length);
});

test('undo and redo restore exact historical snapshots and stop at edges',()=>{
 const a=initial(),b=energyChange(a,{solarMW:90}),c=energyChange(b,{solarMW:60});
 assert.equal(activeRevision(c).snapshot.energy.solarMW,60);
 const back=moveWorkspaceCursor(c,-1);
 assert.equal(activeRevision(back).snapshot.energy.solarMW,90);
 assert.equal(activeRevision(moveWorkspaceCursor(back,-1)).snapshot.energy.solarMW,105);
 assert.equal(activeRevision(moveWorkspaceCursor(back,1)).snapshot.energy.solarMW,60);
 assert.strictEqual(moveWorkspaceCursor(a,-1),a);
 assert.strictEqual(moveWorkspaceCursor(c,1),c);
 assert.throws(()=>moveWorkspaceCursor(c,2),RangeError);
});

test('choosing an older revision then editing branches history without recycling revision IDs',()=>{
 const a=initial(),b=energyChange(a,{solarMW:90}),c=energyChange(b,{solarMW:60});
 const previous=selectWorkspaceRevision(c,0);
 assert.equal(activeRevision(previous).revision,0);
 const fresh=energyChange(previous,{solarMW:140});
 assert.equal(activeRevision(fresh).revision,3);
 assert.equal(fresh.history.length,2);
 assert.equal(fresh.nextRevision,4);
 assert.equal(fresh.history.some(x=>x.revision===2),false);
 assert.throws(()=>selectWorkspaceRevision(fresh,-1),RangeError);
});

test('no-op edits do not create meaningless history entries',()=>{
 const w=initial(),s=activeRevision(w).snapshot;
 assert.strictEqual(commitWorkspace(w,structuredClone(s),'No-op'),w);
});

test('history remains bounded and import can restore an older revision pointer',()=>{
 let w=initial();
 for(let i=0;i<HISTORY_LIMIT+5;i++)w=energyChange(w,{solarMW:110+i});
 assert.equal(w.history.length,HISTORY_LIMIT);
 assert.equal(w.cursor,HISTORY_LIMIT-1);
 assert.equal(w.nextRevision,HISTORY_LIMIT+6);
 const older=selectWorkspaceRevision(w,1);
 const round= parseWorkspace(serializeWorkspace(older));
 assert.deepEqual(round,older);
 assert.equal(round.cursor,1);
 assert.equal(activeRevision(round).revision,older.history[1].revision);
});

test('export is versioned and local, and cannot import approvals or invented fields',()=>{
 const w=initial(),encoded=serializeWorkspace(w),parsed=parseWorkspace(encoded);
 assert.equal(parsed.schema,WORKSPACE_SCHEMA);
 assert.deepEqual(parsed,w);
 assert.match(encoded,/NOT FOR CONSTRUCTION/);
 assert.throws(()=>parseWorkspace(''),RangeError);
 assert.throws(()=>parseWorkspace('{broken'),SyntaxError);
 assert.throws(()=>parseWorkspace('x'.repeat(MAX_IMPORT_CHARS+1)),RangeError);
 const unknown={...w,approved:true};
 assert.throws(()=>parseWorkspace(JSON.stringify(unknown)),RangeError);
 const falseStatus={...w,status:'VERIFIED AND BUILDABLE'};
 assert.throws(()=>parseWorkspace(JSON.stringify(falseStatus)),RangeError);
});

test('validation denies invalid inputs, unknown keys, malformed buildings and fake certificates',()=>{
 const w=initial(),s=activeRevision(w).snapshot;
 assert.throws(()=>validateSnapshot({...s,energy:{...s.energy,solarMW:Infinity}}),RangeError);
 assert.throws(()=>validateSnapshot({...s,water:{...s.water,availableFreshML:-2}}),RangeError);
 assert.throws(()=>validateSnapshot({...s,energy:{...s.energy,label:'verified'}}),RangeError);
 assert.throws(()=>validateSnapshot({...s,layouts:{...s.layouts,garden:[...s.layouts.garden,{id:'fabricated',template:'courtyard',col:7,row:1,rotation:0}]}}),RangeError);
 assert.throws(()=>validateSnapshot({...s,verified:true}),RangeError);
 const changed={...w,history:[...w.history,{...w.history[0]}]};
 assert.throws(()=>validateWorkspace(changed),RangeError);
});

test('evidence snapshot export uses real shared inputs but keeps all review gates blocked',()=>{
 const w=energyChange(initial(),{windMW:0});
 const r=activeRevision(w);
 const claims=buildEvidenceLedger(r.snapshot);
 const data=JSON.parse(evidenceExport(claims,REVIEW_GATES,{revision:r.revision,snapshot:r.snapshot}));
 assert.equal(data.workspaceRevision,1);
 assert.deepEqual(data.baselineInputs.energy,r.snapshot.energy);
 assert.equal(data.baselineInputs.district,r.snapshot.districtId);
 assert.equal(data.records.find(row=>row.id==='EN-002').value,0);
 assert.equal(data.audit.constructionClearance,false);
 assert.equal(data.audit.unverifiedGates,REVIEW_GATES.length);
 assert.match(data.status,/NO FIELD VERIFICATION/);
});

test('baseline comparison uses same selected district and preserves separate unit labels',()=>{
 const s=referenceSnapshot();
 const diff=compareSnapshots(s,s);
 assert.equal(diff.districtId,'garden');
 assert.ok(diff.metrics.every(m=>m.delta===0));
 assert.ok(diff.metrics.some(m=>m.unit==='ML/day'));
 assert.ok(diff.metrics.some(m=>m.unit==='GWh'));
 assert.ok(diff.metrics.some(m=>m.unit==='people'));
});
