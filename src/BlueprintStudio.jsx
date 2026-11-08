import React,{useMemo,useRef,useState} from 'react';
import {DISTRICTS} from './model.js';
import {BUILDINGS,MATERIALS,calculateBuilding,blueprintExport} from './blueprint.js';
import {FloorPlan,SectionDrawing} from './BlueprintDrawings.jsx';
import {useWorkspace} from './WorkspaceContext.jsx';
import {validateSnapshot} from './workspace.js';
import './blueprint.css';

const LEVELS=[['ground','Ground / public'],['typical','Typical / shared'],['roof','Roof / ecology']];
const nf=(n,max=0)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:max});
function FileDownload({filename,data,mime}){
  const blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  URL.revokeObjectURL(url);
}
function Slider({label,value,unit='',min,max,step=1,help,onChange}){
  const id='studio-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  return <div className="studio-input">
    <div className="studio-input-top"><label htmlFor={id}>{label}</label><output htmlFor={id}>{nf(value,1)}{unit}</output></div>
    <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    {help&&<p>{help}</p>}
  </div>;
}
function Figure({label,value,unit,description}){
  return <div className="studio-figure">
    <span>{label}</span><strong>{value}<small> {unit}</small></strong><p>{description}</p>
  </div>;
}
export default function BlueprintStudio(){
  const {snapshot,setPrototype}=useWorkspace();
  const [template,setTemplate]=useState('courtyard');
  const [notice,setNotice]=useState('Prototype changes now revise the shared City Twin scenario.'); 
  const plan=snapshot.prototypes[template];
  const [level,setLevel]=useState('typical');
  const planRef=useRef(null);
  const stats=useMemo(()=>calculateBuilding(plan),[plan]);
  const material=MATERIALS[plan.material];
  const district=DISTRICTS.find(d=>d.id===plan.districtId)||DISTRICTS[0];
  const update=(key,value)=>{
    const current=plan;
    const next={...current,[key]:value};
    if(key==='widthM')next.courtWidthM=Math.min(next.courtWidthM,value-14);
    if(key==='depthM')next.courtDepthM=Math.min(next.courtDepthM,value-14);
    if(key==='solarRoofShare')next.greenRoofShare=Math.min(next.greenRoofShare,85-value);
    if(key==='greenRoofShare')next.solarRoofShare=Math.min(next.solarRoofShare,85-value);
    try{
      validateSnapshot({...snapshot,prototypes:{...snapshot.prototypes,[template]:next}});
      setPrototype(template,next);
      setNotice('Prototype revised. District and infrastructure estimates will recalculate.');
    }catch(error){setNotice('Edit blocked by the shared layout or geometry rules: '+error.message);}
  };
  function choose(key){setTemplate(key);setLevel('typical');setNotice('Selected '+BUILDINGS[key].name+' from the shared scenario.');}
  function resetTemplate(){
    try{
      validateSnapshot({...snapshot,prototypes:{...snapshot.prototypes,[template]:{...BUILDINGS[template]}}});
      setPrototype(template,{...BUILDINGS[template]});setNotice('Restored the canonical prototype.');
    }catch(error){setNotice('Reset blocked: '+error.message);}
  }
  function getJson(){return blueprintExport(plan,level);}
  function exportJson(){FileDownload({filename:'CANOPY-'+template+'-concept-blueprint.json',data:getJson(),mime:'application/json'});}
  function exportSvg(){
    if(!planRef.current)return;
    const svg=planRef.current.querySelector('svg');
    if(!svg)return;
    const contents=new XMLSerializer().serializeToString(svg);
    FileDownload({filename:'CANOPY-'+template+'-'+level+'-schematic.svg',data:contents,mime:'image/svg+xml'});
  }
  return <div className="studio-shell">
    <div className="studio-intro">
      <div><span className="eyebrow">07 / ARCHITECTURAL BLUEPRINT STUDIO</span>
        <h2>Give every building<br/><em>a responsible beginning.</em></h2>
        <p>Choose a realistic conceptual typology, size its perimeter and courtyard, then inspect floor diagrams, material systems and renewable roof assumptions. Every drawing is schematic, not construction documentation.</p>
      </div>
      <div className="studio-intro-stamp">MISSION THREE<br/><strong>CONCEPT / UNPERMITTED</strong><span>LOCAL METERS · NO LAND PARCEL</span></div>
    </div>

    <div className="studio-template-picker" role="group" aria-label="Select building type">
      {Object.entries(BUILDINGS).map(([key,proto])=><button key={key} type="button" aria-pressed={key===template} onClick={()=>choose(key)} className={key===template?'selected':''}>
        <span className="studio-template-index">{String(Object.keys(BUILDINGS).indexOf(key)+1).padStart(2,'0')}</span>
        <strong>{proto.name}</strong><small>{proto.type}</small>
      </button>)}
    </div>

    <p role="status" aria-live="polite" className="studio-notice" style={{margin:'12px 0',fontSize:12,color:'#436e50'}}>{notice}</p>
    <div className="studio-workspace">
      <div className="studio-editor">
        <div className="studio-overline">EDIT THE REFERENCE MODEL</div>
        <h3>{BUILDINGS[template].name}</h3>
        <p>{BUILDINGS[template].note}</p>
        <div className="studio-control-group">
          <div className="studio-small-heading">Footprint + courtyard</div>
          <Slider label="Building width" value={plan.widthM} min={42} max={86} step={2} unit=" m" onChange={v=>update('widthM',v)}/>
          <Slider label="Building depth" value={plan.depthM} min={36} max={64} step={2} unit=" m" onChange={v=>update('depthM',v)}/>
          <Slider label="Courtyard width" value={plan.courtWidthM} min={14} max={Math.min(42,plan.widthM-14)} step={2} unit=" m" onChange={v=>update('courtWidthM',v)}/>
          <Slider label="Courtyard depth" value={plan.courtDepthM} min={12} max={Math.min(40,plan.depthM-14)} step={2} unit=" m" onChange={v=>update('courtDepthM',v)}/>
          <Slider label="Stories" value={plan.floors} min={4} max={7} unit="" onChange={v=>update('floors',v)}/>
        </div>
        <div className="studio-control-group">
          <div className="studio-small-heading">Program + energy</div>
          <Slider label="Residential allocation" value={plan.residentialShare} min={20} max={80} step={5} unit="%" help="Share of estimated net floor area used for homes" onChange={v=>update('residentialShare',v)}/>
          <Slider label="Typical home area" value={plan.averageUnitM2} min={50} max={100} step={5} unit=" m²" onChange={v=>update('averageUnitM2',v)}/>
          <Slider label="Solar roof allocation" value={plan.solarRoofShare} min={0} max={Math.min(65,85-plan.greenRoofShare)} step={5} unit="%" onChange={v=>update('solarRoofShare',v)}/>
          <Slider label="Habitat roof allocation" value={plan.greenRoofShare} min={0} max={Math.min(65,85-plan.solarRoofShare)} step={5} unit="%" onChange={v=>update('greenRoofShare',v)}/>
          <Slider label="Electricity intensity" value={plan.annualEuiKwhM2} min={40} max={130} step={5} unit=" kWh/m²·yr" help="Illustrative electric end use, not modeled HVAC or code performance" onChange={v=>update('annualEuiKwhM2',v)}/>
        </div>
        <div className="studio-control-group">
          <div className="studio-small-heading">Construction reference</div>
          <label htmlFor="studio-material" className="studio-select-label">Conceptual structural system</label>
          <select id="studio-material" value={plan.material} onChange={e=>update('material',e.target.value)}>
            {Object.entries(MATERIALS).map(([key,m])=><option value={key} key={key}>{m.label}</option>)}
          </select>
          <label htmlFor="studio-district" className="studio-select-label">Planning district context (not an actual plot)</label>
          <select id="studio-district" value={plan.districtId} onChange={e=>update('districtId',e.target.value)}>
            {DISTRICTS.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button type="button" className="studio-reset" onClick={resetTemplate}>Reset this prototype ↶</button>
      </div>
      <div className="studio-preview">
        <div className="studio-plan-controls">
          <span className="studio-overline">LIVE CONCEPT DRAWING</span>
          <div role="group" aria-label="Select building drawing level" className="studio-level-tabs">
            {LEVELS.map(([key,label])=><button key={key} type="button" className={level===key?'selected':''} aria-pressed={level===key} onClick={()=>setLevel(key)}>{label}</button>)}
          </div>
        </div>
        <div className="studio-plan-drawing" ref={planRef}><FloorPlan input={plan} level={level}/></div>
        <div className="studio-section"><SectionDrawing input={plan}/></div>
        <div className="studio-preview-foot">
          <span>VIEW: {level.toUpperCase()} / SECTION</span>
          <span>COURTYARD: {nf(stats.courtyardAreaM2)} m²</span>
          <span>HEIGHT: {nf(stats.heightM,1)} m</span>
        </div>
      </div>
    </div>

    <div className="studio-summary" id="blueprint-sheet">
      <div className="studio-sheet-top">
        <div><span className="studio-overline">CANOPY / ARCHITECTURAL QUANTITY SHEET 001</span><h3>{BUILDINGS[template].name}</h3><p>{district.name} · Conceptual program context only</p></div>
        <div className="studio-paper-mark">NOT FOR CONSTRUCTION<br/>PRE-FEASIBILITY MODEL<br/>C.A.N.O.P.Y.</div>
      </div>
      <div className="studio-summary-grid">
        <Figure label="Enclosed perimeter footprint" value={nf(stats.footprintM2)} unit="m²" description="Outer block minus open court"/>
        <Figure label="Gross floor area" value={nf(stats.grossFloorAreaM2)} unit="m²" description={plan.floors+' full conceptual levels'}/>
        <Figure label="Illustrative housing capacity" value={nf(stats.housingUnits)} unit="homes" description={nf(stats.estimatedResidents)+' estimated residents, not guaranteed design yield'}/>
        <Figure label="Roof photovoltaic nameplate" value={nf(stats.pvKWp)} unit="kWp" description={nf(stats.solarAreaM2)+' m² nominal modules, no measured irradiance'}/>
        <Figure label="Indicative rooftop generation" value={nf(stats.pvAnnualMWh)} unit="MWh/yr" description="19% assumed PV capacity factor"/>
        <Figure label="Estimated building electric use" value={nf(stats.electricAnnualMWh)} unit="MWh/yr" description={nf(plan.annualEuiKwhM2)+' kWh/m²·yr illustrative gross-area intensity'}/>
      </div>
      <div className="studio-sheet-details">
        <div>
          <span className="studio-overline">ROOF SURFACE BUDGET</span>
          <div className="studio-roof-bar" aria-label={'Solar '+plan.solarRoofShare+' percent, habitat '+plan.greenRoofShare+' percent, reserved '+(100-plan.solarRoofShare-plan.greenRoofShare)+' percent'}>
            <div style={{width:plan.solarRoofShare+'%',background:'#2a6771'}}/>
            <div style={{width:plan.greenRoofShare+'%',background:'#75a783'}}/>
            <div style={{width:(100-plan.solarRoofShare-plan.greenRoofShare)+'%',background:'#cbbda1'}}/>
          </div>
          <div className="studio-roof-list">
            <span><i style={{background:'#2a6771'}}/> PV {nf(stats.solarAreaM2)} m²</span>
            <span><i style={{background:'#75a783'}}/> Ecology {nf(stats.greenRoofAreaM2)} m²</span>
            <span><i style={{background:'#cbbda1'}}/> Access/services {nf(stats.reservedRoofM2)} m²</span>
          </div>
        </div>
        <div><span className="studio-overline">STRUCTURE / MATERIAL PASSPORT STARTER</span><h4>{material.label}</h4>
          <p>{material.primary}</p><p>{material.envelope}</p><p className="studio-material-warning">{material.consideration}</p>
        </div>
      </div>
      <div className="studio-assessment">
        <span className="studio-overline">DESIGN AND EVIDENCE CHECKS · ALL UNAPPROVED</span>
        {stats.checks.map(c=><div className="studio-check" key={c.id}><strong>{c.name}</strong><span>{c.detail}</span><em>{c.state==='not-verified'?'NOT VERIFIED':'CONCEPT REVIEW'}</em></div>)}
      </div>
      <div className="studio-print-only">
        <FloorPlan input={plan} level={level}/>
        <SectionDrawing input={plan}/>
      </div>
      <p className="studio-sheet-disclaimer">Reference geometry and arithmetic only. Not a stamped floor plan, construction set, legal drawing, dwelling yield, safe egress, accessibility determination, structural system selection, energy certificate, or approved site. Public participation and ecological review precede siting.</p>
    </div>

    <div className="studio-actions">
      <button type="button" onClick={exportJson}>Export model data (JSON) ↗</button>
      <button type="button" onClick={exportSvg}>Download plan drawing (SVG) ↗</button>
      <button type="button" onClick={()=>window.print()}>Print concept planning sheet ↗</button>
    </div>
    <div className="studio-about"><strong>ARCHITECTURAL BOUNDARY</strong><span>The drawn cores are symbols, not egress paths. Roof percentages do not imply green roofs or PV are approved, structurally supported or safe to combine. The electrical comparison excludes embodied impacts, weather files, shading and hour-by-hour demand. Full independent design review is mandatory.</span></div>
  </div>;
}
