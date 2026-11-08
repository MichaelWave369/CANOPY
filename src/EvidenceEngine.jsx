import React,{useMemo,useState} from 'react';
import {DOMAINS,KINDS,REVIEW_GATES,buildEvidenceLedger,validateEvidenceLedger,evidenceExport} from './evidence.js';
import './evidence.css';

const pretty=v=>typeof v==='number'?v.toLocaleString('en-US',{maximumFractionDigits:2}):String(v);
const codeUrl=path=>'https://github.com/MichaelWave369/CANOPY/blob/main/'+path;

function saveRegister(records){
 const json=evidenceExport(records);
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='CANOPY-evidence-model-traceability-v1.json';
 document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
function Status({value}){return <span className="evidence-source-state">{value}</span>;}
function Summary({label,value,detail}){return <div className="evidence-count"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
export default function EvidenceEngine(){
 const records=useMemo(()=>buildEvidenceLedger(),[]);
 const audit=useMemo(()=>validateEvidenceLedger(records),[records]);
 const [domain,setDomain]=useState('all');
 const [kind,setKind]=useState('all');
 const [search,setSearch]=useState('');
 const [selectedId,setSelectedId]=useState('EN-005');
 const [showGates,setShowGates]=useState(false);
 const list=useMemo(()=>{
  const q=search.toLowerCase().trim();
  return records.filter(r=>(domain==='all'||r.domain===domain)&&(kind==='all'||r.kind===kind)&&
   (!q||[r.id,r.title,r.formula,r.source.path,r.verificationRequired,r.gate].some(v=>String(v).toLowerCase().includes(q))));
 },[records,domain,kind,search]);
 const detail=list.find(r=>r.id===selectedId)||list[0]||null;
 const gate=detail?REVIEW_GATES.find(g=>g.id===detail.gate):null;
 const domainName=id=>DOMAINS.find(d=>d.id===id)?.name||id;
 const kindName=id=>KINDS.find(k=>k.id===id)?.name||id;
 return <div className="evidence-shell">
  <div className="evidence-heading">
   <div>
    <span className="eyebrow">11 / MISSION SEVEN · EVIDENCE ENGINE</span>
    <h2>Make every claim<br/><em>show its work.</em></h2>
    <p>The source of truth isn't a gorgeous rendering or an optimistic spreadsheet. It's a versioned chain from assumption, to computation, to external proof. We only have the first two pieces so far.</p>
   </div>
   <button type="button" onClick={()=>saveRegister(records)} disabled={!audit.ok} className="evidence-export">Download model evidence ledger ↗</button>
  </div>
  <div className="evidence-disclaimer"><strong>TRACEABLE ≠ VERIFIED</strong><span>This registry links CANOPY's default reference values to repository code. It contains no site measurements, independent studies or approved professional decisions. All construction gates are blocked.</span></div>
  <div className="evidence-counter-grid">
   <Summary label="Traceable model records" value={records.length} detail="Internal code + formula lineage"/>
   <Summary label="Outside evidence reviewed" value="0" detail="No independent site records supplied"/>
   <Summary label="Approval gates verified" value={'0 / '+REVIEW_GATES.length} detail="Every real-site gate remains open"/>
   <Summary label="Internal register integrity" value={audit.ok?'PASS':'FAIL'} detail="Structural validation, not external accuracy"/>
  </div>
  <div className="evidence-controls">
   <label>Search claims
    <input value={search} type="search" onChange={e=>setSearch(e.target.value)} placeholder="Water, energy, flood, cost, source file…"/>
   </label>
   <label>System domain
    <select value={domain} onChange={e=>setDomain(e.target.value)}><option value="all">All systems</option>{DOMAINS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
   </label>
   <label>Claim category
    <select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">All categories</option>{KINDS.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}</select>
   </label>
  </div>
  <div className="evidence-workspace">
   <div className="evidence-claim-list">
    <div className="evidence-list-head"><span>REFERENCE RECORDS</span><span>{list.length} FOUND</span></div>
    {list.length===0&&<p className="evidence-empty">No records match those filters. The underlying register hasn't changed.</p>}
    {list.map(r=><button type="button" key={r.id} onClick={()=>setSelectedId(r.id)} aria-pressed={detail?.id===r.id} className={'evidence-record'+(detail?.id===r.id?' active':'')}>
      <span className="evidence-record-top"><span>{r.id}</span><span>{domainName(r.domain)}</span></span>
      <span className="evidence-record-title">{r.title}</span>
      <span className="evidence-record-value">{pretty(r.value)} <small>{r.unit}</small></span>
     </button>)}
   </div>
   <article className="evidence-detail" aria-live="polite">
    {detail?<>
     <div className="evidence-detail-heading"><span>{detail.id} / {domainName(detail.domain)}</span><Status value="NO SITE VERIFICATION"/></div>
     <h3>{detail.title}</h3>
     <div className="evidence-figure">{pretty(detail.value)} <small>{detail.unit}</small></div>
     <div className="evidence-description-grid">
      <div><span className="evidence-field-label">TYPE OF CLAIM</span><p>{kindName(detail.kind)}</p></div>
      <div><span className="evidence-field-label">SCENARIO SCOPE</span><p>{detail.context}</p></div>
     </div>
     <div className="evidence-separator"/>
     <span className="evidence-field-label">WHERE IT COMES FROM</span>
     <p>{detail.formula}</p>
     <a className="evidence-code-link" href={codeUrl(detail.source.path)} target="_blank" rel="noreferrer">{detail.source.path} · {detail.source.symbol} ↗</a>
     <div className="evidence-separator"/>
     <span className="evidence-field-label">WHAT WOULD VERIFY THIS IN THE REAL WORLD?</span>
     <p>{detail.verificationRequired}</p>
     <div className="evidence-gate-summary">
      <span className="evidence-field-label">BLOCKING REVIEW GATE / {gate?.id.toUpperCase()}</span>
      <strong>{gate?.label}</strong>
      <p>{gate?.deliverable}</p>
      <small>Reviewer: {gate?.responsible}</small>
      <Status value="NOT VERIFIED"/>
     </div>
     <p className="evidence-final-note">{detail.limitation}</p>
    </>:<div className="evidence-empty">Choose another domain or clear the search to inspect source-linked model records.</div>}
   </article>
  </div>
  <div className="evidence-gate-section">
   <div className="evidence-gate-header">
    <div><span className="evidence-field-label">EXTERNAL-REVIEW REQUIREMENTS</span><h3>Every permit needs proof.</h3>
     <p>Eight categories of professional, legal, environmental and community evidence. None can be approved by clicking a switch in this software.</p>
    </div>
    <button type="button" onClick={()=>setShowGates(v=>!v)} aria-expanded={showGates}>{showGates?'Hide':'Show'} all {REVIEW_GATES.length} review gates {showGates?'−':'+'}</button>
   </div>
   {showGates&&<div className="evidence-gates">{REVIEW_GATES.map((g,i)=><div className="evidence-gate-row" key={g.id}>
    <span>{String(i+1).padStart(2,'0')}</span><div><strong>{g.label}</strong><p>{g.deliverable}</p><small>{g.responsible}</small></div><Status value="NOT VERIFIED"/>
   </div>)}</div>}
  </div>
  <div className="evidence-scope">
   <div><span className="evidence-field-label">VERSIONED, READ-ONLY BASELINE</span><h3>Traceability first. External evidence next.</h3></div>
   <p>The register is assembled from **default/reference** inputs in each CANOPY model. Changing sliders in another panel does not yet alter this baseline. A future shared-scenario store can provide versioned live lineage; outside evidence will need authenticated sources, consent and independent verification before any readiness status can change.</p>
   <a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/EVIDENCE-ENGINE.md" target="_blank" rel="noreferrer">Read the evidence contract ↗</a>
  </div>
 </div>;
}
