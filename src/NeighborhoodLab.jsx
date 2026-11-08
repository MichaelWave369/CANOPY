import React,{useMemo,useState} from 'react';
import {BUILDINGS} from './blueprint.js';
import {RESERVED,TRANSIT_STOPS,footprint} from './district.js';
import {DEFAULT_CAPACITY,SERVICES,evaluateNeighborhood,neighborhoodExport} from './neighborhood.js';
import {useWorkspace} from './WorkspaceContext.jsx';
import './neighborhood.css';

const money=v=>'$'+(v/1000000).toLocaleString('en-US',{maximumFractionDigits:1})+'M';
const number=(n,decimals=0)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:decimals});
const TARGET_ITEMS=[{id:'transit',label:'Nearest tram stop'},...SERVICES.map(s=>({id:s.id,label:s.label}))];
const COLOR={courtyard:'#87ad9c',terrace:'#dfc08d',maker:'#9cacc1',garden:'#a7c98e'};
function download(name,text){
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function CorridorMap({layout,focus,route,target,templates=BUILDINGS}){
 const lines=route?.path?.map(p=>p.x+','+p.y).join(' ')||'';
 const selected=layout.find(b=>b.id===focus);
 const start=selected?footprint(selected,templates):null;
 const place=target?.id==='transit'? (route?.id?.startsWith('stop-')?TRANSIT_STOPS[Number(route.id.split('-')[1])]:null):SERVICES.find(s=>s.id===target?.id);
 return <svg className="neighborhood-route-svg" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="Fictional neighborhood route study: shaded reserves, prototype buildings, transit stops, and a synthetic pedestrian grid path. Not an accessible sidewalk or route certification.">
  <defs><pattern id="neighborhood-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" stroke="#9bbb9d" strokeWidth=".8" fill="none" opacity=".45"/></pattern></defs>
  <rect width="600" height="600" fill="#e9f0e6"/><rect width="600" height="600" fill="url(#neighborhood-grid)"/>
  {RESERVED.map(z=>z.kind==='rect'
   ?<rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h} fill={z.category==='ecology'?'#6e9c79':z.category==='food'?'#b9cf96':z.category==='transit'?'#b5c7ba':z.category==='pedestrian'?'#d7e5ce':'#e8d6ab'} opacity=".7"/>
   :<ellipse key={z.id} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={z.category==='ecology'?'#78a690':'#e7d5ad'} opacity=".7"/>)}
  <path d="M0 300H600" stroke="#557b67" strokeWidth="2" strokeDasharray="6 5"/>
  <path d="M300 0V600" stroke="#8ba68f" strokeWidth="2" strokeDasharray="3 8"/>
  {layout.map((b,i)=>{
   const r=footprint(b,templates),proto=templates[b.template];
   const cw=b.rotation===90?proto.courtDepthM:proto.courtWidthM,ch=b.rotation===90?proto.courtWidthM:proto.courtDepthM;
   return <g key={b.id}>
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill={COLOR[b.template]} stroke={b.id===focus?'#244f40':'#73958a'} strokeWidth={b.id===focus?3:1.5}/>
    <rect x={r.cx-cw/2} y={r.cy-ch/2} width={cw} height={ch} fill="#d9e9d8" stroke="#8eb59a" strokeWidth="1"/>
    <text x={r.cx} y={r.cy+4} textAnchor="middle" fill="#275444" fontFamily="Arial,sans-serif" fontSize="12" fontWeight="700">{i+1}</text>
   </g>;
  })}
  {TRANSIT_STOPS.map((s,i)=><circle key={'stop'+i} cx={s.x} cy={s.y} r="7" stroke="#275a48" strokeWidth="2" fill="#f5f5e2"/>)}
  {SERVICES.map(s=><g key={s.id}><circle cx={s.x} cy={s.y} r="9" fill="#eee0ae" stroke="#8b7a4c" strokeWidth="2"/><text x={s.x} y={s.y-15} fill="#4a654a" fontSize="11" textAnchor="middle">{s.label}</text></g>)}
  {route?.reachable&&<polyline points={lines} fill="none" stroke="#f4faf0" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity=".9"/>}
  {route?.reachable&&<polyline points={lines} fill="none" stroke="#24786a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>}
  {start&&<circle cx={start.cx} cy={start.cy} r="12" fill="#22543c" stroke="#f5f5e5" strokeWidth="3"/>}
  {place&&<circle cx={place.x} cy={place.y} r="13" fill="#e3bd75" stroke="#264f37" strokeWidth="3"/>}
  <text x="22" y="28" fontFamily="Arial,sans-serif" fill="#2a6042" fontSize="12" fontWeight="700">PEDESTRIAN NETWORK / STUDY ONLY</text>
  <text x="565" y="28" textAnchor="middle" fill="#2a6042" fontSize="12">N ↑</text>
 </svg>;
}
function Output({label,value,context,warning}){
 return <div className={'neighborhood-value'+(warning?' warning':'')}><span>{label}</span><strong>{value}</strong><small>{context}</small></div>;
}
function Setting({label,unit='',value,min,max,step=1,description,onChange}){
 const id='neighborhood-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 return <label className="neighborhood-setting" htmlFor={id}>
  <span>{label}<strong>{number(value,2)}{unit}</strong></span>
  <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
  <small>{description}</small>
 </label>;
}
export default function NeighborhoodLab({layout,districtId,selected,templates=BUILDINGS}){
 const {snapshot,setCommunity:setSettings}=useWorkspace();
 const settings=snapshot.community;
 const [referenceId,setReferenceId]=useState(null);
 const [destination,setDestination]=useState('transit');
 const analysis=useMemo(()=>evaluateNeighborhood(layout,settings,templates),[layout,settings,templates]);
 const pickedId=layout.some(x=>x.id===referenceId)?referenceId:layout.some(x=>x.id===selected)?selected:layout[0]?.id;
 const picked=analysis.routes.find(r=>r.buildingId===pickedId);
 const route=destination==='transit'?picked?.closestStop:picked?.services.find(s=>s.id===destination);
 const activeTarget=TARGET_ITEMS.find(x=>x.id===destination);
 const set=(key,v)=>setSettings(s=>({...s,[key]:v}));
 const gaps=analysis.services;
 return <div className="neighborhood-shell" id="neighborhood">
  <div className="neighborhood-heading">
   <div><span className="district-overline">09 / MISSION FIVE · LIVING NEIGHBORHOOD</span><h3>Design the connections.<br/><em>Account for the people.</em></h3>
    <p>Walkable routes, schools, a clinic, civic rooms, and development phasing built on the District Composer's current layout. No real land or utility service has been verified.</p>
   </div>
   <button type="button" onClick={()=>download('CANOPY-'+districtId+'-living-neighborhood.json',neighborhoodExport(districtId,layout,settings,templates))}>Export full neighborhood study ↗</button>
  </div>
  <div className="neighborhood-top-alert"><strong>HYPOTHETICAL NETWORK</strong><span>20-meter grid routing avoids the fictional protected zones and building envelopes. It does not demonstrate sidewalk accessibility, crossing safety, public service availability, or fire-apparatus access.</span></div>
  <div className="neighborhood-workspace">
   <div className="neighborhood-route-board">
    <div className="neighborhood-board-label">CONNECTIVITY VIEW / 600 × 600 M / UNGEOREFERENCED</div>
    <CorridorMap layout={layout} focus={pickedId} route={route} target={activeTarget} templates={templates}/>
    <div className="neighborhood-map-key">Dark marker = selected building · Gold marker = destination · Teal = schematic pedestrian route</div>
   </div>
   <div className="neighborhood-configuration">
    <span className="district-overline">BUILDING TO COMMUNITY</span>
    <label htmlFor="neighborhood-building">Start at building</label>
    <select id="neighborhood-building" value={pickedId||''} onChange={e=>setReferenceId(e.target.value)} disabled={!layout.length}>
     {!layout.length&&<option value="">No buildings placed</option>}
     {layout.map((p,i)=><option value={p.id} key={p.id}>{i+1}. {BUILDINGS[p.template].name}</option>)}
    </select>
    <label htmlFor="neighborhood-destination">Walk to</label>
    <select id="neighborhood-destination" value={destination} onChange={e=>setDestination(e.target.value)}>
     {TARGET_ITEMS.map(o=><option value={o.id} key={o.id}>{o.label}</option>)}
    </select>
    <div className="neighborhood-route-result">
     <span>{activeTarget.label.toUpperCase()}</span>
     <strong>{route?.reachable?number(route.routeM)+' m':'No routed path'}</strong>
     <p>{route?.reachable?'Includes approximate grid travel plus two unchecked building/facility access legs. Not real accessible walking distance.':(route?.reason||'Choose or place a building to see a route.')}</p>
    </div>
    <div className="neighborhood-route-stats">
     <div><strong>{analysis.pedestrian.buildingsWithRoutedStop}/{analysis.pedestrian.totalBuildings}</strong><span>Buildings with synthetic tram route</span></div>
     <div><strong>{analysis.pedestrian.within400m}</strong><span>Buildings within 400 m of simulated walking route</span></div>
     <div><strong>{number(analysis.emergency.axisDistanceMaxM)} m</strong><span>Maximum direct emergency-corridor distance proxy</span></div>
    </div>
    <p className="neighborhood-context">Emergency metric is geometrical only. It cannot certify fire access, turning radius, road load, vehicle travel or response time.</p>
   </div>
  </div>

  <div className="neighborhood-services">
   <div className="neighborhood-panel-title"><div><span className="district-overline">SHARED SERVICES / CAPACITY SCENARIO</span><h4>Give the neighborhood what it needs.</h4></div><p>Population-derived demand assumptions can be challenged. Slider capacity is planned capacity, not an operating school or clinic.</p></div>
   <div className="neighborhood-service-grid">
    <div className="neighborhood-service-controls">
     <Setting label="School seats" value={settings.schoolSeats} min={0} max={1200} step={20} description="Potential neighborhood school capacity" onChange={v=>set('schoolSeats',v)}/>
     <Setting label="Clinic visits/year" value={settings.clinicVisitsPerYear} min={0} max={30000} step={500} description="Annual appointment slots, not physicians or health outcomes" onChange={v=>set('clinicVisitsPerYear',v)}/>
     <Setting label="Community-room seats" value={settings.publicRoomSeats} min={0} max={1000} step={20} description="Simultaneous civic meeting seats" onChange={v=>set('publicRoomSeats',v)}/>
    </div>
    <div className="neighborhood-capacities">
     <Output label="Education seats" value={number(gaps.school.provided)+' / '+number(gaps.school.required)} context={'Gap: '+number(gaps.school.gap)+' seats'} warning={gaps.school.gap>0}/>
     <Output label="Annual clinic visits" value={number(gaps.clinic.provided)+' / '+number(gaps.clinic.required)} context={'Gap: '+number(gaps.clinic.gap)+' appointments'} warning={gaps.clinic.gap>0}/>
     <Output label="Community-room seats" value={number(gaps.publicRoom.provided)+' / '+number(gaps.publicRoom.required)} context={'Gap: '+number(gaps.publicRoom.gap)+' seats'} warning={gaps.publicRoom.gap>0}/>
    </div>
   </div>
   <p className="neighborhood-context">Assumed education seats: 0.13/resident; clinic appointments: 2.8/resident/year; public room seats: 0.06/resident. These ratios are illustrative, not a demographic forecast or legal staffing standard.</p>
  </div>

  <div className="neighborhood-costs">
   <div className="neighborhood-panel-title"><div><span className="district-overline">DEVELOPMENT PHASES / SANDBOX DOLLARS</span><h4>Let the costs enter the conversation.</h4></div><p>Unit rates are deliberately hypothetical scenario inputs, not quotes or present-day verified construction prices.</p></div>
   <Setting label="Construction cost factor" value={settings.constructionMultiplier} min={.5} max={2} step={.1} unit="×" description="Sensitivity multiplier to invented unit-rate assumptions" onChange={v=>set('constructionMultiplier',v)}/>
   <div className="neighborhood-cost-range">
    <Output label="Low sensitivity scenario" value={money(analysis.costs.lowUsd)} context="Illustrative capital allocation, includes 15% contingency"/>
    <Output label="High sensitivity scenario" value={money(analysis.costs.highUsd)} context="Illustrative capital allocation, includes 30% contingency"/>
   </div>
   <table className="neighborhood-phase-table"><thead><tr><th>Phase</th><th>Blocks</th><th>Residents*</th><th>Low model</th><th>High model</th></tr></thead>
    <tbody>{analysis.costs.phases.map(ph=><tr key={ph.phase}><th>0{ph.phase}</th><td>{ph.buildings}</td><td>{number(ph.estimatedResidents)}</td><td>{money(ph.lowUsd)}</td><td>{money(ph.highUsd)}</td></tr>)}</tbody>
   </table>
   <p className="neighborhood-context">*Each phase groups every third building by insertion order, not a construction schedule. Totals are rough development scenarios; there is no land purchase, finance, local codes, verified infrastructure scope, operating expense, taxes or inflation. The model assumes 1,200 m of connected infrastructure, 35,000 m² of improved public realm and per-resident service allowances.</p>
  </div>
  <div className="neighborhood-footer"><strong>NO APPROVED NEIGHBORHOOD</strong><span>The route, care, education and capital models share the same fictional buildings. Any real project must first establish land rights, ecological and flood studies, accessible circulation, demand demographics, utility capacity, costs and community consent.</span><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/LIVING-NEIGHBORHOOD.md" target="_blank" rel="noreferrer">Full methods ↗</a></div>
 </div>;
}
