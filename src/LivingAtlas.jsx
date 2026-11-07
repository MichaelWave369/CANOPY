import React,{useMemo,useState} from 'react';
import {DISTRICTS,LAND_USE} from './model.js';
import {SITE,SETBACKS,HABITAT,WETLANDS,FARMS,TRANSIT,RIVER_HALF_WIDTH_PCT,estimateAtlas,riparianHalfWidthPct,riverPath,atlasExport} from './atlas.js';
import './atlas.css';

const LAYERS=[
  {id:'habitat',label:'Protected habitat',color:'#47795d'},
  {id:'riparian',label:'River setback',color:'#69aa95'},
  {id:'review',label:'River-edge review',color:'#d2a863'},
  {id:'food',label:'Production landscapes',color:'#a0b96c'},
  {id:'transit',label:'Transit connections',color:'#bc9f67'}
];
const DEFAULT_LAYERS={habitat:true,riparian:true,review:true,food:true,transit:true};
const pct=v=>Math.round(v*10)/10;
const trail=(pts)=>pts.map(([x,y],i)=>(i?'L':'M')+(x*10)+','+(y*7)).join(' ');
function AtlasMap({layers,setback,selected,onSelect,analysis}){
 const reserve=riparianHalfWidthPct(setback);
 const assessment=Object.fromEntries(analysis.districts.map(d=>[d.id,d]));
 return <div className="atlas-map-wrap">
   <div className="atlas-map-top"><span>SCHEMATIC REFERENCE / 4 × 3 KM</span><span>N ↑</span></div>
   <div className="atlas-map-stage">
    <svg viewBox="0 0 1000 700" role="img" aria-label="Illustrative CANOPY site showing six districts, central river and optional protection, water, farm and transit overlays. Shapes are not surveyed GIS features.">
     <defs>
       <linearGradient id="atlasGround" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9e2cc"/><stop offset="1" stopColor="#b7d0ae"/></linearGradient>
       <pattern id="atlasFarm" width="12" height="13" patternUnits="userSpaceOnUse"><rect width="12" height="13" fill="#c3d5a0"/><path d="M0 3H12M0 9H12" stroke="#91ac7b" strokeWidth="2"/></pattern>
       <filter id="atlasShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1d4630" floodOpacity=".17"/></filter>
     </defs>
     <rect width="1000" height="700" fill="url(#atlasGround)"/>
     <g fill="none" stroke="#879e89" strokeWidth="1" opacity=".24">
       <path d="M-55 120Q155 35 336 110T699 87T1090 153"/>
       <path d="M-90 156Q177 70 343 143T702 118T1100 182"/>
       <path d="M-60 571Q176 520 300 578T707 595T1064 557"/>
       <path d="M-40 609Q153 558 305 620T705 631T1100 591"/>
     </g>
     {layers.food&&<g stroke="#e6ebd0" strokeWidth="3" opacity=".88">{FARMS.map(a=><rect key={a.id} x={a.x*10} y={a.y*7} width={a.width*10} height={a.height*7} rx="8" fill="url(#atlasFarm)"/>)}</g>}
     {layers.review&&<path d={riverPath(reserve+3.5)} fill="#d8aa5b" opacity=".38"/>}
     {layers.riparian&&<path d={riverPath(reserve)} fill="#5b9e88" opacity=".43"/>}
     <path d={riverPath(RIVER_HALF_WIDTH_PCT)} fill="#63adb8" stroke="#398b9d" strokeWidth="2"/>
     {layers.habitat&&<g fill="#477c5c" opacity=".48" stroke="#2e6b53" strokeWidth="2">
       {HABITAT.map(a=><ellipse key={a.id} cx={a.x*10} cy={a.y*7} rx={a.rx*10} ry={a.ry*7}/>)}
       {WETLANDS.map(a=><ellipse key={a.id} cx={a.x*10} cy={a.y*7} rx={a.rx*10} ry={a.ry*7} fill="#4caaa1" stroke="#26777a"/>)}
     </g>}
     {layers.transit&&<g fill="none" strokeLinecap="round" strokeLinejoin="round">
       {TRANSIT.map((pts,i)=><path key={i} d={trail(pts)} stroke="#d0b077" strokeWidth="12"/>)}
       {TRANSIT.map((pts,i)=><path key={'inner'+i} d={trail(pts)} stroke="#faf0cb" strokeWidth="2" strokeDasharray="7 15"/>)}
     </g>}
     {DISTRICTS.map((d,i)=>{
       const state=assessment[d.id];
       return <g key={d.id} transform={'translate('+(d.x*10)+','+(d.y*7)+')'}>
         <ellipse rx="90" ry="84" fill="#f0f2e8" opacity=".75" stroke={selected===d.id?'#174b34':state.status==='review-overlap'?'#ad7b50':'#6c9680'} strokeWidth={selected===d.id?5:3} strokeDasharray={state.status==='review-overlap'?'9 5':'none'}/>
         <g fill="#709b84" opacity=".8">
           <rect x="-50" y="-44" width="26" height="25" rx="2"/>
           <rect x="-10" y="-50" width="26" height="24" rx="2"/>
           <rect x="28" y="-27" width="23" height="24" rx="2"/>
           <rect x="-53" y="6" width="23" height="27" rx="2"/>
           <rect x="17" y="24" width="27" height="24" rx="2"/>
           <rect x="-17" y="32" width="23" height="26" rx="2"/>
         </g>
         {selected===d.id&&<ellipse rx="96" ry="90" fill="none" stroke="#154a33" strokeWidth="2" strokeDasharray="5 6"/>}
         <circle r="16" fill={state.status==='review-overlap'?'#b88952':'#ddb979'} stroke="#fff8eb" strokeWidth="5"/>
         <text y="5" textAnchor="middle" fontSize="15" fill="#214734" fontWeight="bold">{i+1}</text>
       </g>;
     })}
     <g fill="#214b3c" fontSize="14" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="1.5" opacity=".83">
       <text x="36" y="41">UPLAND WOODLAND</text><text x="660" y="386">RIPARIAN RESERVE</text><text x="717" y="655">WETLAND CELL</text>
     </g>
     <g fill="#f4fbf0"><rect x="555" y="190" width="77" height="11" rx="2"/><rect x="571" y="489" width="77" height="11" rx="2"/></g>
    </svg>
    {DISTRICTS.map((d,i)=><button key={d.id} type="button" className={'atlas-map-pin'+(selected===d.id?' is-selected':'')} style={{left:d.x+'%',top:d.y+'%'}} onClick={()=>onSelect(d.id)} aria-label={'Select '+d.name} aria-pressed={selected===d.id}>{i+1}</button>)}
   </div>
   <div className="atlas-map-footer"><span><i className="atlas-scale-key"/> Conceptual boundaries</span><span><i className="atlas-amber-key"/> Flagged district outline</span><span>NO REAL GEOLOCATION</span></div>
 </div>;
}
function Download({setback}){
 function download(){
  const value=atlasExport(setback),blob=new Blob([value],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='CANOPY-schematic-atlas.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 }
 return <button type="button" className="atlas-download" onClick={download}>Export planning assumptions ↗</button>;
}
function Readiness(){
 const gates=[
  ['Site and land rights','No property or landowner approval on file'],
  ['Biodiversity and corridor survey','No local species baseline or protected habitats mapped'],
  ['Flood, fire and geotechnical studies','No terrain, return-period flood or site fire model'],
  ['Water rights and treatment','No verified municipal/regional water supply'],
  ['Community, Indigenous and housing review','No participatory site process or affordability approval'],
  ['Independent code and cost feasibility','No stamped engineering, permitting or budget']
 ];
 return <div className="atlas-readiness">
  <div className="atlas-mini-label">REAL SITE READINESS</div>
  <p>These are hard evidence gates. A pretty diagram cannot pass them.</p>
  {gates.map(([a,b])=><div className="atlas-gate" key={a}><span className="atlas-gate-dot" aria-hidden="true"/><div><strong>{a}</strong><span>{b}</span></div><span className="atlas-gate-status">NOT VERIFIED</span></div>)}
 </div>;
}
export default function LivingAtlas(){
 const [selected,setSelected]=useState('garden');
 const [setback,setSetback]=useState(SETBACKS.reference);
 const [layers,setLayers]=useState(DEFAULT_LAYERS);
 const report=useMemo(()=>estimateAtlas(setback),[setback]);
 const district=DISTRICTS.find(d=>d.id===selected);
 const assessment=report.districts.find(d=>d.id===selected);
 const toggle=id=>setLayers(prev=>({...prev,[id]:!prev[id]}));
 const total=LAND_USE.reduce((n,z)=>n+z.percent,0);
 return <div className="atlas-shell">
  <div className="atlas-header">
   <div><span className="eyebrow">06 / THE LIVING ATLAS</span><h2>Let the watershed<br/><em>draw the boundaries.</em></h2><p>A transparent schematic of conservation, transit, farmland and neighborhood footprints. Move the river-protection rule and watch what requires review.</p></div>
   <Download setback={setback}/>
  </div>
  <div className="atlas-caution"><strong>ILLUSTRATIVE, NOT GIS</strong><span>This is a 4 × 3 km fictional planning canvas. Colors, buffers and overlaps are hypothetical. They are NOT real flood maps, ecological survey results, or construction clearances.</span></div>
  <div className="atlas-grid">
   <AtlasMap layers={layers} setback={setback} selected={selected} onSelect={setSelected} analysis={report}/>
   <aside className="atlas-control-panel">
    <div className="atlas-mini-label">SHOW PLANNING LAYERS</div>
    <div className="atlas-layer-list">{LAYERS.map(l=><label key={l.id} className="atlas-layer">
      <input type="checkbox" checked={layers[l.id]} onChange={()=>toggle(l.id)}/>
      <span className="atlas-layer-swatch" style={{background:l.color}}/><span>{l.label}</span>
    </label>)}</div>
    <div className="atlas-separator"/>
    <div className="atlas-slider-head"><label htmlFor="atlas-setback">River-edge setback</label><output htmlFor="atlas-setback">{setback} m</output></div>
    <input id="atlas-setback" className="atlas-slider" type="range" min={SETBACKS.min} max={SETBACKS.max} step={SETBACKS.step} value={setback} onChange={e=>setSetback(Number(e.target.value))}/>
    <p className="atlas-help">Applied horizontally from a fictional channel outline. Actual legal and ecological setbacks vary by site, terrain and habitat.</p>
    <div className="atlas-metrics">
      <div><strong>{report.excludedPct}%</strong><span>Illustrated no-build overlays</span></div>
      <div><strong>{report.reviewPct}%</strong><span>Additional river-edge review</span></div>
      <div><strong>{report.overlapReviewCount}/6</strong><span>Districts with sampled overlap</span></div>
    </div>
    <p className="atlas-help">Grid-sampled diagram shares, not surveyed usable land. The separately planned <strong>{LAND_USE.find(l=>l.key==='habitat').percent}% habitat/water allocation</strong> is a design target, not this calculated overlay.</p>
   </aside>
  </div>
  <div className="atlas-lower">
   <div className="atlas-district-detail">
    <div className="atlas-mini-label">SELECTED DISTRICT / {DISTRICTS.findIndex(d=>d.id===selected)+1} OF 6</div>
    <div className="atlas-district-title"><h3>{district.name}</h3><span className={'atlas-review-tag '+assessment.status}>{assessment.status==='review-overlap'?'POSSIBLE OVERLAP':assessment.status==='proximity-review'?'PROXIMITY REVIEW':'NO OVERLAP DEPICTED'}</span></div>
    <p className="atlas-district-role">{district.role}</p>
    <p>{district.detail}</p>
    <div className="atlas-detail-facts"><div><strong>{assessment.exclusionSamples}</strong><span>Footprint samples in concept exclusions</span></div><div><strong>{assessment.reviewSamples}</strong><span>In river-edge review belt</span></div></div>
    <p className="atlas-help">Only {assessment.totalSamples} schematic samples per district; outlines are not parcels. No status is planning approval or a determination that land is safe.</p>
   </div>
   <Readiness/>
  </div>
  <div className="atlas-final-note"><span className="atlas-mini-label">DEVELOPMENT RULE</span><p>Protect first, test the social and ecological carrying capacity next, and only then place buildings. If an identified site cannot support the reference population without habitat damage, reduce the project or select another site.</p><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/ATLAS.md" target="_blank" rel="noreferrer">Read the model contract ↗</a></div>
 </div>;
}
