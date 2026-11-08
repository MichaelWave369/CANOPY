import React,{useMemo,useState} from 'react';
import {useWorkspace} from './WorkspaceContext.jsx';
import {compareSnapshots,referenceSnapshot,serializeWorkspace,MAX_IMPORT_CHARS} from './workspace.js';
import {DISTRICTS} from './model.js';
import './workspace.css';

const labelNum=(n)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const signed=n=>n>0?'+'+labelNum(n):labelNum(n);
function exportFile(workspace){
 const url=URL.createObjectURL(new Blob([serializeWorkspace(workspace)],{type:'application/json'}));
 const a=document.createElement('a');
 a.href=url;a.download='CANOPY-shared-scenario-workspace-v1.json';
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
export default function WorkspacePanel(){
 const {workspace,revision,snapshot,message,setMessage,undo,redo,reset,goTo,importText,canUndo,canRedo}=useWorkspace();
 const [busy,setBusy]=useState(false);
 const diff=useMemo(()=>compareSnapshots(referenceSnapshot(),snapshot),[snapshot]);
 const district=DISTRICTS.find(d=>d.id===snapshot.districtId)?.name||snapshot.districtId;
 async function load(e){
  const file=e.target.files?.[0];
  if(!file)return;
  setBusy(true);
  try{
   if(file.size>MAX_IMPORT_CHARS)throw new Error('File exceeds the 1 MB local scenario import limit.');
   const contents=await file.text();
   importText(contents);
  }catch(error){
   setMessage('Import rejected. The existing workspace is unchanged: '+error.message);
  }finally{
   e.target.value='';
   setBusy(false);
  }
 }
 function resetIfConfirmed(){
  if(window.confirm('Reset CANOPY shared scenario and its local revision history? Export JSON first if you need a backup.'))reset();
 }
 return <div className="workspace-shell">
  <div className="workspace-intro">
   <div>
    <span className="eyebrow">12 / MISSION EIGHT · SHARED SCENARIO CORE</span>
    <h2>One scenario.<br/><em>A thousand questions.</em></h2>
    <p>Energy, water, architecture, schematic ecology, district composition, community capacity, infrastructure and the Evidence Engine now share a versioned local planning workspace. Compare assumptions, inspect revisions and restore an earlier model without elevating the results to verified facts.</p>
   </div>
   <div className="workspace-revision-stamp"><span>ACTIVE REVISION</span><strong>{revision.revision}</strong><small>{revision.label}</small></div>
  </div>
  <div className="workspace-boundary"><strong>LOCAL + SYNTHETIC</strong><span>Browser-only persistence, not cloud backup or a signed audit ledger. No real land has been surveyed and no construction, ecology, legal or utility approvals follow from these revisions.</span></div>
  <div className="workspace-actions">
   <button type="button" onClick={undo} disabled={!canUndo}>← Undo change</button>
   <button type="button" onClick={redo} disabled={!canRedo}>Redo change →</button>
   <button type="button" className="workspace-primary" onClick={()=>exportFile(workspace)}>Export full history ↗</button>
   <label className="workspace-import">Import JSON
    <input type="file" accept=".json,application/json" onChange={load} disabled={busy} aria-label="Import previously exported CANOPY scenario workspace JSON"/>
   </label>
   <button type="button" onClick={resetIfConfirmed} className="workspace-reset">Reset local workspace</button>
  </div>
  <p className="workspace-message" role="status" aria-live="polite">{message}</p>
  <div className="workspace-content">
   <div className="workspace-history">
    <div className="workspace-part-head"><span>REVISION HISTORY</span><span>{workspace.history.length} SAVED</span></div>
    <p>Click a revision to restore that snapshot. If you edit afterward, future redo entries are replaced by the new branch. The latest 20 local revisions are retained.</p>
    <div className="workspace-revision-list">
     {workspace.history.map((r,i)=><button type="button" key={r.revision} className={'workspace-revision-row'+(i===workspace.cursor?' active':'')} aria-pressed={i===workspace.cursor} onClick={()=>goTo(i)}>
      <span>REV {r.revision}</span><strong>{r.label}</strong><small>{i===workspace.cursor?'CURRENT':i>workspace.cursor?'REDO AVAILABLE':'RESTORABLE'}</small>
     </button>)}
    </div>
   </div>
   <div className="workspace-comparison">
    <div className="workspace-part-head"><span>BASELINE COMPARISON</span><span>{district.toUpperCase()}</span></div>
    <p>These differences are produced from the same synthetic energy, water and district models used throughout CANOPY. The baseline uses canonical defaults; both sides are unverified planning scenarios.</p>
    <div className="workspace-comparison-table" role="table" aria-label="Comparison with canonical reference inputs">
     <div className="workspace-comparison-head" role="row">
      <span role="columnheader">Metric</span><span role="columnheader">Reference</span><span role="columnheader">Current</span><span role="columnheader">Difference</span>
     </div>
     {diff.metrics.map(m=><div className="workspace-comparison-row" role="row" key={m.key}>
      <span role="cell"><strong>{m.key}</strong><small>{m.unit}</small></span>
      <span role="cell">{labelNum(m.before)}</span>
      <span role="cell">{labelNum(m.after)}</span>
      <span role="cell" className={m.delta!==0?'changed':''}>{signed(m.delta)}</span>
     </div>)}
    </div>
    <p className="workspace-comparison-note">Selected district comparisons always use the same named district on each side. A different selected district changes the *comparison context*, not the model's six-district geography. These totals do not certify hourly resilience, potable quality, live public services or real site buildability.</p>
   </div>
  </div>
  <div className="workspace-footer"><strong>SCOPE OF LIVE CONNECTIONS</strong><span>Shared now: energy and water sliders, four Blueprint Studio prototypes, the schematic Atlas river buffer, all six district layouts, school/clinic/civic capacity, utility assumptions, and Evidence Engine records. Local browser revisions are not approvals; the fictional Atlas and 36-hectare Composer are still separate spatial canvases.</span><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/SHARED-SCENARIOS.md" target="_blank" rel="noreferrer">Model contract ↗</a></div>
 </div>;
}
