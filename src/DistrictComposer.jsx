import React,{useMemo,useRef,useState} from 'react';
import {DISTRICTS} from './model.js';
import NeighborhoodLab from './NeighborhoodLab.jsx';
import InfrastructureLab from './InfrastructureLab.jsx';
import {useWorkspace} from './WorkspaceContext.jsx';
import {BUILDINGS} from './blueprint.js';
import {CANVAS,SLOTS,RESERVED,TRANSIT_STOPS,footprint,validatePlacement,composeMetrics,seedLayout,districtExport} from './district.js';
import './district.css';

const TYPES={
  courtyard:{color:'#8eb7a5',short:'COURT'},
  terrace:{color:'#e0c58f',short:'CIVIC'},
  maker:{color:'#a3b2c8',short:'WORK'},
  garden:{color:'#aed39a',short:'FOOD'}
};
const format=(n,d=0)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
const transitRoute='M0 300H600';
const walkRoute='M300 0V600';
function saveBlob(name,content,type){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
function DrawReserved({show}){
 return <g>
  {RESERVED.map(z=>{
    if(!show[z.category])return null;
    const props={
      className:'district-zone '+z.category,
      key:z.id,fill:z.category==='ecology'?'#78ad8b':z.category==='food'?'#d3db9c':z.category==='transit'?'#aab5a5':z.category==='pedestrian'?'#c8d6c4':'#e9deb4',
      stroke:z.category==='ecology'?'#4f8b72':'#aec39f',strokeWidth:1.8,opacity:z.category==='ecology'?.7:.9
    };
    return z.kind==='rect'
      ?<rect {...props} x={z.x} y={z.y} width={z.w} height={z.h} rx={4}/>
      :<ellipse {...props} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}/>;
  })}
  {show.transit&&<g stroke="#597f78" strokeWidth="3" strokeDasharray="7 6"><path d={transitRoute}/></g>}
  {show.pedestrian&&<path d={walkRoute} stroke="#8aa995" strokeWidth="2" strokeDasharray="3 7"/>}
  <g>
   {TRANSIT_STOPS.map(s=><g key={s.name}>
     <circle cx={s.x} cy={s.y} r="12" fill="#fbf1d6" stroke="#4d8173" strokeWidth="2"/>
     <path d={'M'+(s.x-5)+' '+s.y+'h10'} stroke="#4d8173" strokeWidth="2"/>
   </g>)}
  </g>
 </g>;
}
function PlacementDrawing({placements,selected}){
 return <g>
 {placements.map((p,i)=>{
  const r=footprint(p),b=BUILDINGS[p.template],cw=p.rotation===90?b.courtDepthM:b.courtWidthM,ch=p.rotation===90?b.courtWidthM:b.courtDepthM;
  return <g key={p.id}>
   <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={TYPES[p.template].color} stroke={selected===p.id?'#133b2b':'#446b58'} strokeWidth={selected===p.id?4:2} rx="2"/>
   <rect x={r.cx-cw/2} y={r.cy-ch/2} width={cw} height={ch} fill="#dceada" stroke="#79aa82" strokeWidth="1.5"/>
   {selected===p.id&&<rect x={r.x-5} y={r.y-5} width={r.w+10} height={r.h+10} fill="none" stroke="#295c45" strokeWidth="2" strokeDasharray="5 4"/>}
   <text x={r.cx} y={r.cy+3} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="11" fill="#244939" fontWeight="700">{i+1}</text>
  </g>;
 })}
 </g>;
}
function ComposerMap({placements,selected,onSlot,tool,rotation,show}){
 const mapRef=useRef(null);
 const slots=useMemo(()=>SLOTS.map(s=>{
  const existing=placements.find(p=>p.col===s.col&&p.row===s.row);
  if(existing)return {...s,existing,ok:true,reason:''};
  const test=validatePlacement(placements,{id:'candidate',template:tool,col:s.col,row:s.row,rotation});
  return {...s,existing:null,ok:test.ok,reason:test.reasons.join('; ')};
 }),[placements,tool,rotation]);
 return <div className="district-map-paper">
  <div className="district-map-head"><strong>NEIGHBORHOOD COMPOSITION CANVAS</strong><span>600 × 600 m · LOCAL CONCEPT COORDINATES</span></div>
  <div ref={mapRef} className="district-map-stage">
   <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Interactive fictional 600-meter-square neighborhood map with reserved ecological zones, transit, a public commons, and editable building footprint blocks.">
    <defs><pattern id="composer-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#abc6af" strokeWidth="1" opacity=".5"/></pattern></defs>
    <rect width="600" height="600" fill="#eff2e9"/>
    <rect width="600" height="600" fill="url(#composer-grid)"/>
    <rect x="20" y="20" width="560" height="560" fill="none" stroke="#729c79" strokeWidth="2" strokeDasharray="6 5" opacity=".6"/>
    <DrawReserved show={show}/>
    <PlacementDrawing placements={placements} selected={selected}/>
    <g fontFamily="Arial,sans-serif" fill="#386a52" fontSize="12" fontWeight="700" opacity=".85">
     <text x="22" y="355">TRANSIT / EMERGENCY ROUTE</text>
     <text x="360" y="35">N ↑</text>
     {show.food&&<text x="32" y="551">FOOD LAND</text>}
     {show.ecology&&<text x="525" y="167" transform="rotate(90 525 167)">ECOLOGICAL CORRIDOR</text>}
    </g>
   </svg>
   {slots.map(s=><button key={s.id} type="button"
    className={'district-map-slot '+(s.existing?'occupied':s.ok?'available':'restricted')+(s.existing?.id===selected?' selected':'')}
    style={{left:(s.x/600*100)+'%',top:(s.y/600*100)+'%'}}
    title={s.existing?'Select '+BUILDINGS[s.existing.template].name:s.ok?'Place '+BUILDINGS[tool].name:s.reason}
    aria-label={s.existing?'Select building '+s.existing.id:s.ok?'Place '+BUILDINGS[tool].name+' at column '+(s.col+1)+', row '+(s.row+1):'Explain unavailable location at column '+(s.col+1)+', row '+(s.row+1)}
    aria-pressed={s.existing?.id===selected}
    onClick={()=>onSlot(s)}>
      {s.existing?String(placements.findIndex(p=>p.id===s.existing.id)+1):s.ok?'+':'·'}
   </button>)}
  </div>
  <div className="district-map-foot"><span><i className="slot-legend available"/> Click + to place</span><span><i className="slot-legend occupied"/> Numbered blocks to edit</span><span><i className="slot-legend restricted"/> Reserved / unavailable</span></div>
  <div className="district-map-scale">Drawing is schematic. Protected shapes are invented, not parcel or ecological measurements.</div>
 </div>;
}
function Metric({label,value,unit='',note}){
 return <div className="district-metric"><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{note}</p></div>;
}
export default function DistrictComposer(){
 const {snapshot,setDistrict:setDistrictId,setDistrictLayout}=useWorkspace();
 const districtId=snapshot.districtId;
 const layouts=snapshot.layouts;
 const [tool,setTool]=useState('courtyard');
 const [rotation,setRotation]=useState(0);
 const [selected,setSelected]=useState(null);
 const [notice,setNotice]=useState('Example layout loaded. Click a numbered building to edit it or + to add one.');
 const [show,setShow]=useState({ecology:true,food:true,transit:true,pedestrian:true,civic:true});
 const counter=useRef(1000);
 const layout=layouts[districtId]||[];
 const active=layout.find(p=>p.id===selected);
 const metrics=useMemo(()=>composeMetrics(layout),[layout]);
 const district=DISTRICTS.find(d=>d.id===districtId);
 const updateLayout=(next,msg)=>{setDistrictLayout(districtId,next);setNotice(msg);};
 function changeDistrict(id){setDistrictId(id);setSelected(null);setNotice('Selected '+DISTRICTS.find(d=>d.id===id).name+'. Each district is a separate editable reference sketch.');}
 function onSlot(slot){
  if(slot.existing){setSelected(slot.existing.id);setNotice('Selected '+BUILDINGS[slot.existing.template].name+'. Use movement and rotation tools below.');return;}
  let identifier;
  do{identifier=districtId+'-building-'+(++counter.current);}while(layout.some(p=>p.id===identifier));
  const candidate={id:identifier,template:tool,col:slot.col,row:slot.row,rotation};
  const test=validatePlacement(layout,candidate);
  if(!test.ok){setNotice('Cannot place here: '+test.reasons.join('; '));return;}
  updateLayout([...layout,candidate],BUILDINGS[tool].name+' placed in row '+(slot.row+1)+', column '+(slot.col+1)+'.');
  setSelected(candidate.id);
 }
 function transform(patch){
  if(!active)return;
  const candidate={...active,...patch};
  const check=validatePlacement(layout,candidate);
  if(!check.ok){setNotice('Change blocked: '+check.reasons.join('; '));return;}
  updateLayout(layout.map(p=>p.id===active.id?candidate:p),'Building updated. All constraints still pass in the schematic.');
 }
 function remove(){
  if(!active)return;
  updateLayout(layout.filter(p=>p.id!==active.id),'Selected building removed.');
  setSelected(null);
 }
 function resetDemo(){updateLayout(seedLayout(districtId),'Loaded an illustrative neighborhood layout.');setSelected(null);}
 function clear(){updateLayout([],'Canvas cleared. All reserved corridors and review constraints remain active.');setSelected(null);}
 function exportJSON(){saveBlob('CANOPY-'+districtId+'-concept-district.json',districtExport(districtId,layout),'application/json');setNotice('Export created and clearly marked as a non-georeferenced concept.');}
 function changeLayer(k){setShow(s=>({...s,[k]:!s[k]}));}
 const measures=[
  {label:'Conceptual residents',value:format(metrics.estimatedResidents),note:'Inherited typical occupancy assumptions'},
  {label:'Illustrative homes',value:format(metrics.housingUnits),note:'No verified unit mix or approvals'},
  {label:'Building coverage',value:format(metrics.conceptualSiteCoveragePct,2),unit:'%',note:'Footprints divided by 36 ha canvas'},
  {label:'Gross floors',value:format(metrics.grossFloorAreaM2),unit:' m²',note:'Four Blueprint Studio typologies'},
  {label:'Annual rooftop PV',value:format(metrics.pvAnnualMWh),unit:' MWh',note:'Assumed 19% capacity factor'},
  {label:'Annual electric use',value:format(metrics.electricAnnualMWh),unit:' MWh',note:'Prototype electric intensities'},
  {label:'Residential water',value:format(metrics.domesticWaterMLPerDay,3),unit:' ML/day',note:'110 L/person/day, excludes other uses'},
  {label:'Farthest transit proxy',value:format(metrics.maximumStraightLineToStopM),unit:' m',note:'Straight-line only, not walking distance'}
 ];
 return <div className="district-shell">
  <div className="district-intro"><div>
    <span className="eyebrow">08 / THE DISTRICT COMPOSER</span>
    <h2>From individual buildings<br/><em>to connected communities.</em></h2>
    <p>Place actual CANOPY prototype footprints onto a deliberately fictional neighborhood canvas. Protect the ecological buffers and shared corridors before measuring potential housing and infrastructure loads.</p>
   </div><div className="district-stamp"><strong>MISSION FOUR</strong><span>SCHEMATIC COMMUNITY PLANNING</span><span>NOT GIS · NOT FOR CONSTRUCTION</span></div>
  </div>
  <div className="district-topbar">
   <div><label htmlFor="composer-district">CONCEPT DISTRICT</label>
    <select id="composer-district" value={districtId} onChange={e=>changeDistrict(e.target.value)}>
     {DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
    </select></div>
   <div className="district-district-desc"><strong>{district.role}</strong><span>{district.feature}</span></div>
   <div className="district-top-actions">
    <button type="button" onClick={resetDemo}>Restore example</button>
    <button type="button" onClick={clear}>Clear blocks</button>
    <button className="primary" type="button" onClick={exportJSON}>Export neighborhood ↗</button>
   </div>
  </div>
  <div className="district-main-grid">
   <div className="district-map-column">
    <ComposerMap placements={layout} selected={selected} onSlot={onSlot} tool={tool} rotation={rotation} show={show}/>
    <div className="district-map-layer-list">
     {[
      ['ecology','Habitat + wetland'],['food','Food landscapes'],['transit','Transit'],
      ['pedestrian','Walk spine'],['civic','Public commons']
     ].map(([id,name])=><label key={id}><input type="checkbox" checked={show[id]} onChange={()=>changeLayer(id)}/>{name}</label>)}
    </div>
   </div>
   <aside className="district-editor">
    <div className="district-editor-title">BUILDING PALETTE <span>{metrics.buildingCount} PLACED</span></div>
    <div className="district-palette">{Object.entries(BUILDINGS).map(([key,b])=><button type="button" key={key} className={tool===key?'active':''} aria-pressed={tool===key} onClick={()=>{setTool(key);setSelected(null);setNotice(b.name+' is ready. Choose a + cell to place it.');}}>
      <i style={{background:TYPES[key].color}}/><span><strong>{b.name}</strong><small>{b.floors} floors · {b.widthM} × {b.depthM} m</small></span>
    </button>)}</div>
    <div className="district-edit-rule"/>
    <div className="district-editor-title">NEW BLOCK ORIENTATION</div>
    <div className="district-rotation"><button type="button" className={rotation===0?'active':''} aria-pressed={rotation===0} onClick={()=>setRotation(0)}>0°</button><button type="button" className={rotation===90?'active':''} aria-pressed={rotation===90} onClick={()=>setRotation(90)}>90°</button></div>
    {active?<div className="district-selected">
      <div className="district-edit-rule"/>
      <div className="district-editor-title">SELECTED BLOCK</div>
      <strong>{BUILDINGS[active.template].name}</strong>
      <p>Cell {active.col+1}, {active.row+1} · Rotation {active.rotation}°</p>
      <div className="district-move-controls" role="group" aria-label="Move selected building one grid cell">
       <button type="button" onClick={()=>transform({row:active.row-1})} aria-label="Move north">↑</button>
       <button type="button" onClick={()=>transform({col:active.col-1})} aria-label="Move west">←</button>
       <button type="button" onClick={()=>transform({col:active.col+1})} aria-label="Move east">→</button>
       <button type="button" onClick={()=>transform({row:active.row+1})} aria-label="Move south">↓</button>
      </div>
      <div className="district-edit-actions"><button type="button" onClick={()=>transform({rotation:active.rotation===0?90:0})}>Rotate 90°</button><button type="button" onClick={remove}>Remove</button></div>
    </div>:<p className="district-help">Click a numbered block to move, rotate, or remove it. Click a + to place the selected type. Blocked locations explain their constraints.</p>}
    <div className="district-feedback" aria-live="polite">{notice}</div>
    <div className="district-editor-title">DESIGN GUARDRAILS</div>
    <p className="district-help">10 m minimum *diagrammatic* building separation, 20 m outer reserve, protected conceptual habitat, transit, walking space, civic commons and food plots. Hiding a layer never disables its restriction.</p>
   </aside>
  </div>
  <div className="district-metric-grid">{measures.map(m=><Metric key={m.label} {...m}/>)}</div>
  <NeighborhoodLab layout={layout} districtId={districtId} selected={selected}/>
  <InfrastructureLab layout={layout} districtId={districtId} selected={selected}/>
  <div className="district-interpretation">
   <div><span className="district-overline">COMMUNITY EQUIPMENT / STUDY ONLY</span>
    <h3>One district, more than housing.</h3>
    <p>Transit, public commons, food plots, pedestrian access and reserved habitat are drawn as fixed planning relationships. Actual schools, clinics, accessibility, emergency operations and commerce require separate capacity studies.</p>
   </div>
   <div><span className="district-overline">WHAT THIS CAN AND CANNOT TELL US</span>
    <p>{format(metrics.estimatedResidents)} illustrative residents across {metrics.buildingCount} structures in a 36 ha fictional quarter. The original 60,000-person city and six 10,000-person districts remain independent planning targets, not results established by this tool.</p>
    <p>Annual generation and demand must eventually be joined to the hourly Living Systems Lab; proximity to transit must be checked using real accessible walking routes, not straight lines.</p>
   </div>
  </div>
  <div className="district-closure"><strong>NO SITE APPROVED</strong><span>Housing yield, setback protection, services, ecology and affordability are simulated from synthetic assumptions. Real-world siting needs survey, hydrology, land rights, public consent, professional engineering, and independent review.</span><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/DISTRICT-COMPOSER.md" target="_blank" rel="noreferrer">Read the method ↗</a></div>
 </div>;
}
