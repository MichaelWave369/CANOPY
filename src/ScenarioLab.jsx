import React,{useMemo,useState} from 'react';
import {ENERGY_DEFAULTS,WATER_DEFAULTS,ENERGY_PRESETS,WATER_PRESETS,simulateEnergy,simulateWater,scenarioExport} from './scenario.js';
import {useWorkspace} from './WorkspaceContext.jsx';
import './scenario.css';

function Slider({label,value,min,max,step=1,unit='',description,onChange}){
  const id='canopy-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  return <div className="scenario-control">
    <div className="scenario-control-head"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value.toLocaleString()}{unit}</output></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    <p>{description}</p>
  </div>;
}
function Presets({options,active,select}){
  return <div className="scenario-presets" role="group" aria-label="Scenario presets">{Object.entries(options).map(([key,p])=><button key={key} type="button" aria-pressed={active===key} className={active===key?'chosen':''} onClick={()=>select(key)}>{p.label}</button>)}</div>;
}
function Output({title,number,unit,note,warn=false}){
  return <div className={'scenario-value'+(warn?' scenario-caution':'')}>
    <span className="scenario-value-title">{title}</span>
    <strong>{number} <small>{unit}</small></strong>
    <span>{note}</span>
  </div>;
}
function EnergyControls({input,change,preset,select}){
  const set=(key,value)=>change({...input,[key]:value});
  return <>
    <Presets options={ENERGY_PRESETS} active={preset} select={select}/>
    <Slider label="Solar capacity" value={input.solarMW} min={0} max={200} step={5} unit=" MWp" description="Installed photovoltaic capacity; modeled, not measured" onChange={v=>set('solarMW',v)}/>
    <Slider label="Wind capacity" value={input.windMW} min={0} max={60} step={5} unit=" MW" description="Subject to wind, wildlife and land suitability" onChange={v=>set('windMW',v)}/>
    <Slider label="Battery storage" value={input.batteryMWh} min={0} max={1500} step={50} unit=" MWh" description="Four-hour discharge rate, 86% round-trip efficiency" onChange={v=>set('batteryMWh',v)}/>
    <Slider label="Demand reduction" value={input.demandReductionPct} min={0} max={40} step={5} unit="%" description="Savings from the reference 240 GWh/year" onChange={v=>set('demandReductionPct',v)}/>
    <Slider label="Critical load" value={input.criticalLoadMW} min={1} max={20} unit=" MW" description="Separate conditional outage-start scenario" onChange={v=>set('criticalLoadMW',v)}/>
  </>;
}
function WaterControls({input,change,preset,select}){
  const set=(key,value)=>change({...input,[key]:value});
  return <>
    <Presets options={WATER_PRESETS} active={preset} select={select}/>
    <Slider label="Conservation" value={input.conservationPct} min={0} max={40} step={5} unit="%" description="Gross use reduction from 8 ML/day" onChange={v=>set('conservationPct',v)}/>
    <Slider label="Greywater captured" value={input.greywaterPct} min={20} max={65} step={5} unit="%" description="Share of daily end-use entering greywater collection" onChange={v=>set('greywaterPct',v)}/>
    <Slider label="Treatment recovery" value={input.treatmentRecoveryPct} min={50} max={95} step={5} unit="%" description="Recovery yield, NOT water safety certification" onChange={v=>set('treatmentRecoveryPct',v)}/>
    <Slider label="Plant capacity" value={input.treatmentCapacityML} min={0} max={6} step={.5} unit=" ML/day" description="Maximum hypothetical reclaimed-water production" onChange={v=>set('treatmentCapacityML',v)}/>
    <Slider label="Non-potable demand" value={input.eligibleNonpotablePct} min={10} max={55} step={5} unit="%" description="End uses that could accept treated reused water" onChange={v=>set('eligibleNonpotablePct',v)}/>
    <Slider label="Available fresh supply" value={input.availableFreshML} min={0} max={10} step={.5} unit=" ML/day" description="Hypothetical supply ceiling, not proven water rights" onChange={v=>set('availableFreshML',v)}/>
  </>;
}
function MonthlyChart({months}){
  const max=Math.max(1,...months.flatMap(m=>[m.demandGWh,m.generationGWh]));
  return <div className="scenario-monthly" role="group" aria-label="Synthetic monthly energy demand and generation in gigawatt-hours">
    {months.map(m=><div key={m.name} className="scenario-month-row">
      <span className="scenario-month-name">{m.name}</span>
      <div className="scenario-bars">
        <span className="scenario-bar demand" style={{width:(m.demandGWh/max*100)+'%'}}/>
        <span className="scenario-bar generation" style={{width:(m.generationGWh/max*100)+'%'}}/>
      </div>
      <span className="scenario-month-values">{m.demandGWh.toFixed(1)} / {m.generationGWh.toFixed(1)}</span>
    </div>)}
    <div className="scenario-chart-legend"><span><i className="dot demand"/> Demand</span><span><i className="dot generation"/> Generation</span><span>GWh, synthetic</span></div>
  </div>;
}
export default function ScenarioLab(){
  const [mode,setMode]=useState('energy');
  const {snapshot,setEnergy:setEnergyInput,setWater:setWaterInput,revision}=useWorkspace();
  const energyInput=snapshot.energy;
  const waterInput=snapshot.water;
  const [energyPreset,setEnergyPreset]=useState('baseline');
  const [waterPreset,setWaterPreset]=useState('baseline');
  const energy=useMemo(()=>simulateEnergy(energyInput),[energyInput]);
  const water=useMemo(()=>simulateWater(waterInput),[waterInput]);
  const changeEnergy=v=>{setEnergyInput(v);setEnergyPreset(null);};
  const changeWater=v=>{setWaterInput(v);setWaterPreset(null);};
  function exportScenario(){
    const url=URL.createObjectURL(new Blob([scenarioExport(energyInput,waterInput)],{type:'application/json'}));
    const a=document.createElement('a');
    a.href=url;a.download='CANOPY-synthetic-scenario.json';
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  return <div className="scenario-shell">
    <div className="scenario-header">
      <div><span className="eyebrow">05 / THE LIVING SYSTEMS LAB</span><h2>Change the inputs.<br/><em>See the trade-offs.</em></h2><p>A reproducible planning experiment with electricity and water separated, explicit imports, and assumptions you can challenge.</p></div>
      <button className="scenario-export" type="button" onClick={exportScenario}>Export synthetic JSON ↗</button>
    </div>
    <p className="scenario-footnote">Shared workspace revision {revision.revision}. Editing energy or water creates a local scenario revision and updates the Evidence Engine. No real site data is implied.</p>
    <div className="scenario-tabs" role="tablist" aria-label="Select planning model">
      <button type="button" role="tab" aria-selected={mode==='energy'} onClick={()=>setMode('energy')}>01 · Energy + storage</button>
      <button type="button" role="tab" aria-selected={mode==='water'} onClick={()=>setMode('water')}>02 · Water + reuse</button>
    </div>
    <div className="scenario-layout">
      <div className="scenario-inputs">
        <div className="scenario-panel-label">ADJUST ASSUMPTIONS</div>
        {mode==='energy'
          ?<EnergyControls input={energyInput} change={changeEnergy} preset={energyPreset} select={k=>{setEnergyPreset(k);setEnergyInput(Object.fromEntries(Object.entries(ENERGY_PRESETS[k]).filter(([key])=>key!=='label')));}}/>
          :<WaterControls input={waterInput} change={changeWater} preset={waterPreset} select={k=>{setWaterPreset(k);setWaterInput(Object.fromEntries(Object.entries(WATER_PRESETS[k]).filter(([key])=>key!=='label')));}}/>}
      </div>
      <div className="scenario-results" aria-live="polite">
        <div className="scenario-panel-label">SYNTHETIC OUTPUT · NOT OBSERVED</div>
        {mode==='energy'?<>
          <div className="scenario-values">
            <Output title="Annual electricity demand" number={energy.annualDemandGWh} unit="GWh" note="After selected demand reduction"/>
            <Output title="Local annual generation" number={energy.generationGWh} unit="GWh" note="Solar and conditional wind combined"/>
            <Output title="Local electricity share" number={energy.localSharePct} unit="%" note="Hourly load served by generation and storage"/>
            <Output title="Residual grid imports" number={energy.gridImportGWh} unit="GWh" note="Still required despite annual generation totals" warn={energy.gridImportGWh>0}/>
            <Output title="Potential surplus" number={energy.possibleSurplusGWh} unit="GWh" note="Subject to export limits or curtailment"/>
            <Output title="Conditional critical-load reserve" number={energy.potentialCriticalHours} unit="hours" note="Assumes storage is 80% full at outage, no renewables"/>
          </div>
          <h3 className="scenario-chart-heading">Seasonal mismatch <small>Demand / generation (GWh by month)</small></h3>
          <MonthlyChart months={energy.monthly}/>
          <p className="scenario-footnote">8,760-hour deterministic illustration. Solar 19% capacity factor, wind 30%, storage efficiency 86%. No observed weather, site limits, grid constraints, or external electrical losses. The critical-load result assumes a separate outage-start battery reserve: it is not guaranteed alongside normal daily dispatch.</p>
        </>:<>
          <div className="scenario-values">
            <Output title="Gross end-use demand" number={water.grossUseML} unit="ML/day" note="After conservation"/>
            <Output title="Reclaimed water potential" number={water.reclaimedML} unit="ML/day" note="Limited by capture, treatment and eligible use"/>
            <Output title="Freshwater withdrawal needed" number={water.freshwaterRequiredML} unit="ML/day" note="Not a proof of legal supply"/>
            <Output title="End-use reclaimed share" number={water.shareSuppliedByReusePct} unit="%" note="Possible share of gross use"/>
            <Output title="Hypothetical supply gap" number={water.hypotheticalWaterGapML} unit="ML/day" note="Need beyond user-selected freshwater ceiling" warn={water.hypotheticalWaterGapML>0}/>
            <Output title="Greywater produced" number={water.greywaterProducedML} unit="ML/day" note="Before treatment losses"/>
          </div>
          <div className="water-flow" role="img" aria-label={'Daily water model: '+water.reclaimedML+' ML reclaimed and '+water.freshwaterRequiredML+' ML external freshwater required.'}>
            <div className="water-flow-bar"><span style={{width:water.shareSuppliedByReusePct+'%'}}/></div>
            <div className="water-flow-labels"><span>Reclaimed {water.reclaimedML} ML/day</span><span>Freshwater {water.freshwaterRequiredML} ML/day</span></div>
          </div>
          <p className="scenario-footnote">Simple steady-state daily balance, not a hydraulic, quality or treatment model. No rainfall, water rights, contamination, climate extremes, or distribution losses are verified. A deficit means the plan must change, not that the watershed can be overdrawn.</p>
        </>}
      </div>
    </div>
    <div className="scenario-bottomline"><strong>DESIGN BOUNDARY</strong><span>Real deployment needs a selected site, ecological assessment, measured weather and water quality, qualified engineers, permitting and public review.</span><a href="https://github.com/MichaelWave369/CANOPY/blob/main/docs/SCENARIOS.md" target="_blank" rel="noreferrer">Methodology ↗</a></div>
  </div>;
}
