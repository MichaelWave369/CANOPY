import React,{useMemo,useState} from 'react';
import {BUILDINGS} from './blueprint.js';
import {footprint} from './district.js';
import {DEFAULT_INFRA,INFRA_SCHEMA,NODES,LINKS,UTILITIES,runInfrastructure,infrastructureExport} from './infrastructure.js';
import './infrastructure.css';

const fmt=(n,decimals=1)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:decimals});
const SYSTEM_COLORS={potable:'#468cab',sewer:'#ab9071',thermal:'#c57558',drainage:'#619a94'};
const SETTINGS=[
 {id:'freshwaterCapacityM3d',label:'Freshwater intake',max:1400,min:0,step:20,unit:' m³/day',group:'potable'},
 {id:'reuseCapacityM3d',label:'Reuse treatment capacity',max:500,min:0,step:10,unit:' m³/day',group:'potable'},
 {id:'wastewaterPlantM3d',label:'Sewage plant capacity',max:1600,min:0,step:20,unit:' m³/day',group:'sewer'},
 {id:'thermalPlantMW',label:'Thermal hub capacity',max:30,min:0,step:.5,unit:' MW',group:'thermal'},
 {id:'thermalPeakWm2',label:'Thermal load intensity',max:100,min:20,step:5,unit:' W/m²',group:'thermal'},
 {id:'thermalStressFactor',label:'Thermal climate factor',max:2,min:.5,step:.1,unit:'×',group:'thermal'},
 {id:'rainMm',label:'Rainfall depth / event',max:160,min:0,step:5,unit:' mm',group:'drainage'},
 {id:'runoffCoefficient',label:'Runoff fraction',max:.9,min:.2,step:.05,unit:'',group:'drainage'},
 {id:'eventHours',label:'Storm event duration',max:24,min:1,step:1,unit:' h',group:'drainage'},
 {id:'detentionM3',label:'Detention volume',max:14000,min:0,step:250,unit:' m³',group:'drainage'},
 {id:'infiltrationM3h',label:'Infiltration allowance',max:400,min:0,step:10,unit:' m³/h',group:'drainage'},
 {id:'safeOutletM3h',label:'Outlet release limit',max:500,min:0,step:10,unit:' m³/h',group:'drainage'}
];
function saveFile(filename,contents){
 const blob=new Blob([contents],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function Controls({config,set,active}){
 return <div className="infra-sliders">
  {SETTINGS.filter(s=>s.group===active).map(s=><label className="infra-range" key={s.id}>
    <span>{s.label}<strong>{fmt(config[s.id],2)}{s.unit}</strong></span>
    <input type="range" min={s.min} max={s.max} step={s.step} value={config[s.id]} onChange={e=>set(s.id,Number(e.target.value))}/>
   </label>)}
 </div>;
}
function NetworkMap({layout,active,config,selectedId,result}){
 const color=SYSTEM_COLORS[active];
 return <svg viewBox="0 0 600 600" className="infra-map" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label={'Schematic '+UTILITIES.find(s=>s.id===active).name+' graph: center hub, four branch nodes, ring links, building connections and one selectable failed link. Not surveyed infrastructure.'}>
  <rect width="600" height="600" fill="#ebf1e9"/>
  <g fill="none" stroke="#9fbca7" strokeWidth="1" opacity=".4">
   {Array.from({length:14},(_,i)=><g key={i}><path d={'M'+(i+1)*40+' 0V600'}/><path d={'M0 '+(i+1)*40+'H600'}/></g>)}
  </g>
  <rect x="518" width="82" height="600" fill="#95bfa8" opacity=".42"/>
  <ellipse cx="77" cy="72" rx="69" ry="69" fill="#8eb39e" opacity=".44"/>
  <ellipse cx="525" cy="535" rx="69" ry="65" fill="#92bdb3" opacity=".44"/>
  <rect x="25" y="462" width="150" height="108" fill="#d0dfaf" opacity=".45"/>
  <rect x="0" y="283" width="600" height="34" fill="#c0d1c4" opacity=".6"/>
  <rect x="284" width="32" height="600" fill="#c5d9c4" opacity=".6"/>
  {LINKS.map(link=>{
    const a=NODES.find(n=>n.id===link.a),b=NODES.find(n=>n.id===link.b);
    const failed=link.id===config.failedLink;
    return <g key={link.id}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fffdf3" strokeWidth="13" strokeLinecap="round"/>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={failed?'#c4534f':color}
       strokeWidth={failed?4:7} strokeDasharray={failed?'9 10':undefined} strokeLinecap="round" opacity={failed ? 0.9 : 0.85}/>
    </g>;
  })}
  {layout.map((item,i)=>{
   const building=result.graph.buildingConnections.find(b=>b.id===item.id);
   if(!building)return null;
   const c=footprint(item),node=NODES.find(n=>n.id===building.hubId),proto=BUILDINGS[item.template];
   return <g key={item.id}>
    <line x1={c.cx} y1={c.cy} x2={node.x} y2={node.y} stroke={color} strokeWidth="2.3" strokeDasharray="5 5" opacity=".65"/>
    <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" fill={item.id===selectedId?'#e3c17e':'#9abda9'} stroke={item.id===selectedId?'#355642':'#719782'} strokeWidth={item.id===selectedId?4:2}/>
    <text x={c.cx} y={c.cy+4} fontFamily="Arial,sans-serif" textAnchor="middle" fill="#315543" fontSize="12" fontWeight="700">{i+1}</text>
   </g>;
  })}
  {NODES.map(n=><g key={n.id}>
   <circle cx={n.x} cy={n.y} r={n.id==='hub'?19:13} fill={n.id==='hub'?'#234b37':'#fbfcf2'} stroke={color} strokeWidth="4"/>
   <text x={n.x} y={n.y+(n.id==='hub'?5:4)} textAnchor="middle" fontFamily="Arial,sans-serif" fill={n.id==='hub'?'#fff':'#315c49'} fontSize={n.id==='hub'?13:10} fontWeight="700">{n.id==='hub'?'H':n.id[0].toUpperCase()}</text>
  </g>)}
  <rect x="13" y="13" width="236" height="43" fill="#fbfcf5" opacity=".92"/>
  <text x="24" y="31" fill="#335d44" fontSize="12" fontWeight="700" fontFamily="Arial,sans-serif">SCHEMATIC CORRIDOR GRAPH</text>
  <text x="24" y="47" fill="#6d8974" fontSize="9" fontFamily="Arial,sans-serif">CAPACITIES ASSUMED, EASEMENTS UNKNOWN</text>
  </svg>;
}
function Metric({title,value,details,warning}){
 return <div className={'infra-metric'+(warning?' warning':'')}><span>{title}</span><strong>{value}</strong><small>{details}</small></div>;
}
const PRESETS=[
 {id:'normal',name:'Reference'},
 {id:'drought',name:'Water shortage'},
 {id:'heat',name:'Heat stress'},
 {id:'storm',name:'Downpour'},
 {id:'failure',name:'Link failure'}
];
function setPreset(id){
 const base={...DEFAULT_INFRA};
 if(id==='drought')return {...base,freshwaterCapacityM3d:190,reuseCapacityM3d:80};
 if(id==='heat')return {...base,thermalPlantMW:5,thermalStressFactor:1.8};
 if(id==='storm')return {...base,rainMm:120,detentionM3:2500};
 if(id==='failure')return {...base,failedLink:'hub-east'};
 return base;
}
export default function InfrastructureLab({layout,districtId,selected}){
 const [config,setConfig]=useState({...DEFAULT_INFRA});
 const [active,setActive]=useState('potable');
 const [preset,setPresetState]=useState('normal');
 const result=useMemo(()=>runInfrastructure(layout,config),[layout,config]);
 const utility=result.systems[active];
 const set=(key,value)=>{setConfig(s=>({...s,[key]:value}));setPresetState(null);};
 function usePreset(id){setPresetState(id);setConfig(setPreset(id));}
 return <section id="infrastructure" className="infra-shell">
  <div className="infra-intro"><div>
   <span className="district-overline">10 / MISSION SIX · THE INFRASTRUCTURE NERVOUS SYSTEM</span>
   <h3>The city beneath<br/><em>the living city.</em></h3>
   <p>Explore four linked but independently modeled utility networks. Change plant throughput, storm design assumptions and a corridor outage, then watch where hypothetical capacity runs out.</p>
  </div><button type="button" className="infra-download" onClick={()=>saveFile('CANOPY-'+districtId+'-infrastructure-concept.json',infrastructureExport(districtId,layout,config))}>Export utility scenario ↗</button></div>
  <div className="infra-warning"><strong>FICTIONAL UTILITY NETWORK</strong><span>All nodes, corridors, pipe capacities, facility assumptions and rainfall are invented. Max-flow is an abstract volume/capacity model, not hydraulics, heat transfer, pressure, gravity sewer, flood simulation or permits.</span></div>
  <div className="infra-preset-row" role="group" aria-label="Infrastructure scenario presets">
   {PRESETS.map(p=><button type="button" key={p.id} aria-pressed={preset===p.id} className={preset===p.id?'active':''} onClick={()=>usePreset(p.id)}>{p.name}</button>)}
  </div>
  <div className="infra-tabs" role="tablist" aria-label="Utility network type">
   {UTILITIES.map(s=><button type="button" role="tab" aria-selected={active===s.id} className={active===s.id?'active':''} key={s.id} onClick={()=>setActive(s.id)}><span className="infra-color" style={{background:s.color}}/>{s.name}</button>)}
  </div>
  <div className="infra-workspace">
   <div className="infra-map-col">
    <NetworkMap layout={layout} active={active} config={config} selectedId={selected} result={result}/>
    <div className="infra-map-caption"><span>H = shared hub</span><span>Dashed = conceptual building connection</span><span>Red = failed link</span></div>
   </div>
   <div className="infra-panel">
    <span className="infra-panel-overline">SYSTEM CAPACITY / SYNTHETIC OUTPUT</span>
    <h4>{UTILITIES.find(s=>s.id===active).name}</h4>
    <div className="infra-highlights">
     <Metric title="Demand" value={fmt(utility.required,2)} details={utility.unit}/>
     <Metric title="Delivered / conveyed" value={fmt(utility.delivered,2)} details={utility.unit}/>
     <Metric title="Unserved / excess" value={fmt(utility.shortfall,2)} details={utility.unit} warning={utility.shortfall>.001}/>
     <Metric title="Demand met" value={fmt(utility.servedPct)} details="percent in simple flow model"/>
    </div>
    <p className="infra-panel-explain">{utility.method}</p>
    <div className="infra-panel-overline">ADJUST ASSUMPTIONS</div>
    <Controls active={active} config={config} set={set}/>
    <label className="infra-failure">Disconnected utility segment
     <select value={config.failedLink} onChange={e=>set('failedLink',e.target.value)}>
      <option value="none">None · full theoretical network</option>
      {LINKS.map(e=><option value={e.id} key={e.id}>{e.id.replace('-',' ↔ ')}</option>)}
     </select>
    </label>
   </div>
  </div>
  <div className="infra-systems">
   {UTILITIES.map(s=>{
    const a=result.systems[s.id];
    return <button type="button" key={s.id} className={'infra-system-summary'+(active===s.id?' chosen':'')} onClick={()=>setActive(s.id)}>
     <span className="infra-color" style={{background:s.color}}/><span>{s.name}</span>
     <strong>{fmt(a.servedPct)}%</strong>
     <small>{a.shortfall>.001?fmt(a.shortfall,1)+' '+a.unit+' unmet':'No model shortfall'}</small>
    </button>;
   })}
  </div>
  <div className="infra-details-grid">
   <div className="infra-water-report">
    <span className="district-overline">WATER CIRCULATION / ACCOUNTED</span><h4>Reuse cannot create water.</h4>
    <p>Recovered water is capped by collected wastewater, an assumed treatment yield, eligible nonpotable demand and modeled plant throughput.</p>
    <div><span>Gross use</span><strong>{fmt(result.demands.grossWaterM3d)} m³/day</strong></div>
    <div><span>Reclaimed potential</span><strong>{fmt(result.waterBalance.reclaimedPotentialM3d)} m³/day</strong></div>
    <div><span>Fresh supply required</span><strong>{fmt(result.waterBalance.freshwaterRequiredM3d)} m³/day</strong></div>
    <div><span>Wastewater collection gap</span><strong>{fmt(result.waterBalance.uncollectedSewageM3d)} m³/day</strong></div>
    <p className="infra-detail-note">Reclaimed water here has no tested quality, treatment design or lawful reuse approval. Actual network limits can cause service deficits even when a gross source total appears sufficient.</p>
   </div>
   <div className="infra-storm-report">
    <span className="district-overline">STORM EVENT / STORAGE + RELEASE</span><h4>Rain has to go somewhere.</h4>
    <p>A single hypothetical rainfall event generates runoff from the entire 36-hectare fictional quarter. Conveyance is checked separately from storage and release.</p>
    <div><span>Event depth</span><strong>{fmt(config.rainMm)} mm</strong></div>
    <div><span>Illustrative runoff</span><strong>{fmt(result.demands.stormRunoffM3)} m³</strong></div>
    <div><span>Detention budget</span><strong>{fmt(result.stormwater.detentionM3)} m³</strong></div>
    <div><span>Unconveyed volume</span><strong>{fmt(result.systems.drainage.shortfall)} m³</strong></div>
    <p className="infra-detail-note">Event volume is not a flood hydrograph or a safe-outfall determination. Real soils, water quality, erosion and downstream habitat impacts need studies.</p>
   </div>
  </div>
  <div className="infra-alerts"><span className="district-overline">CONSTRAINT SIGNALS / MODEL-ONLY</span>
   {result.alerts.length?<ul>{result.alerts.map((a,i)=><li key={i}>{a}</li>)}</ul>
    :<p>No deficit detected within the chosen synthetic network. This does NOT establish operational, ecological or construction feasibility.</p>}
  </div>
  <div className="infra-footer"><strong>NO UTILITY APPROVAL</strong><span>All supply rights, permits, equipment sizing, gradients, pressure zones, thermal plant efficiency, civil corridors, easements, emergency controls and ecological clearance must be independently assessed.</span><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/INFRASTRUCTURE.md" target="_blank" rel="noreferrer">Read the engineering limits ↗</a></div>
 </section>;
}
