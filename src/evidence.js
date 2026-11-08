import {ASSUMPTIONS,DISTRICTS,LAND_USE,landUseTotal} from './model.js';
import {ENERGY_DEFAULTS,WATER_DEFAULTS,simulateEnergy,simulateWater} from './scenario.js';
import {SETBACKS,estimateAtlas} from './atlas.js';
import {BUILDINGS,calculateBuilding} from './blueprint.js';
import {CANVAS,seedLayout,composeMetrics} from './district.js';
import {DEFAULT_CAPACITY,evaluateNeighborhood} from './neighborhood.js';
import {DEFAULT_INFRA,runInfrastructure} from './infrastructure.js';

export const EVIDENCE_SCHEMA='canopy.evidence.v1';
export const DOMAINS=Object.freeze([
 {id:'city',name:'City + land'},
 {id:'energy',name:'Energy'},
 {id:'water',name:'Water'},
 {id:'ecology',name:'Ecology + atlas'},
 {id:'buildings',name:'Architecture'},
 {id:'district',name:'District'},
 {id:'community',name:'Community'},
 {id:'utilities',name:'Infrastructure'}
]);
export const KINDS=Object.freeze([
 {id:'assumption',name:'Design assumption'},
 {id:'derived',name:'Model-derived output'},
 {id:'design-rule',name:'Conceptual constraint'}
]);

/** Required outside evidence; none of these have been submitted or verified. */
export const REVIEW_GATES=Object.freeze([
 {id:'land',label:'Land rights + community consent',responsible:'Legal, residents, Indigenous and community representatives',deliverable:'Parcel title and consent record, engagement process and documented lawful use',status:'not-verified'},
 {id:'ecology',label:'Ecology + hydrology',responsible:'Independent ecology and watershed professionals',deliverable:'Site biodiversity, riparian, habitat connectivity and water baseline with field methods',status:'not-verified'},
 {id:'hazards',label:'Climate + safety hazards',responsible:'Local civil and geotechnical engineers / hazard authorities',deliverable:'Stamped flood, wildfire, ground, erosion and seismic feasibility assessments',status:'not-verified'},
 {id:'water',label:'Water rights + treatment',responsible:'Water agency, utility and qualified environmental engineers',deliverable:'Lawful supply and discharge, accredited water-quality tests and verified treatment capacity',status:'not-verified'},
 {id:'energy',label:'Energy + resilience',responsible:'Independent electrical/thermal engineers and utility operator',deliverable:'Real hourly demand/weather, protection, interconnection and load-tiered outage modeling',status:'not-verified'},
 {id:'architecture',label:'Architecture + accessibility',responsible:'Licensed design, structural, fire and accessibility reviewers',deliverable:'Parcel-compliant site layouts, egress, life safety, structural and accessibility designs',status:'not-verified'},
 {id:'social',label:'Housing + service capacity',responsible:'Residents, housing/community organizations and service providers',deliverable:'Affordability plan, demographic needs, school/clinic provision and public governance approval',status:'not-verified'},
 {id:'costs',label:'Lifecycle costs + financing',responsible:'Independent quantity surveyor, procurement and financial reviewers',deliverable:'Locally supported bids, quantities, lifecycle/O&M costs, funding and uncertainty register',status:'not-verified'}
].map(g=>Object.freeze(g)));

const precision=(n,d=2)=>Number(Number(n).toFixed(d));
const source=(path,symbol)=>({kind:'repository-model',path,symbol,externalEvidence:false});
const rec=(id,domain,title,value,unit,kind,reference,formula,verify,gate,context='default reference scenario')=>({
 id,domain,title,value,unit,kind,source:source(...reference),formula,
 verificationRequired:verify,gate,context,
 siteEvidence:'not-verified',
 provenance:'CANOPY source model; not independently validated',
 limitation:'Traceable code arithmetic is not evidence of physical, legal, operational or construction feasibility'
});
/**
 * Records are calculated directly from existing exported models.
 * Importing the repository source is not an independent external citation.
 * All records use default/reference inputs. Editing other page panels does not
 * alter this snapshot because they currently keep separate local React state.
 */
export function buildEvidenceLedger(workspaceSnapshot=null){
 const energyInput=workspaceSnapshot?workspaceSnapshot.energy:ENERGY_DEFAULTS;
 const waterInput=workspaceSnapshot?workspaceSnapshot.water:WATER_DEFAULTS;
 const energy=simulateEnergy(energyInput);
 const water=simulateWater(waterInput);
 const atlas=estimateAtlas(workspaceSnapshot?.atlasSetbackM??SETBACKS.reference);
 const building=calculateBuilding(workspaceSnapshot?.prototypes?.courtyard??BUILDINGS.courtyard);
 const layout=workspaceSnapshot?workspaceSnapshot.layouts[workspaceSnapshot.districtId]:seedLayout('garden');
 const district=composeMetrics(layout,workspaceSnapshot?.prototypes??BUILDINGS);
 const community=evaluateNeighborhood(layout,workspaceSnapshot?.community??DEFAULT_CAPACITY,workspaceSnapshot?.prototypes??BUILDINGS);
 const infrastructure=runInfrastructure(layout,workspaceSnapshot?.infrastructure??DEFAULT_INFRA,workspaceSnapshot?.prototypes??BUILDINGS);
 const r=[];
 const add=(...args)=>r.push(rec(...args));
 add('CITY-001','city','Reference city footprint',ASSUMPTIONS.studyAreaKm2,'km²','assumption',['src/model.js','ASSUMPTIONS.studyAreaKm2'],
  'Illustrative planning envelope: 4 × 3 km; not a surveyed boundary','Survey legally available land, existing uses and watershed constraints','land');
 add('CITY-002','city','Maturity population target',ASSUMPTIONS.population,'people','assumption',['src/model.js','ASSUMPTIONS.population'],
  'Reference capacity target, not an achieved or approved population','Demographic, affordability, land capacity and public service studies','social');
 add('CITY-003','city','District count',DISTRICTS.length,'districts','design-rule',['src/model.js','DISTRICTS'],
  'Six named district modules; conceptual centers only','Spatial suitability, travel and social consultation','land');
 add('CITY-004','city','Habitat + restoration allocation',LAND_USE.find(v=>v.key==='habitat').percent,'%','assumption',['src/model.js','LAND_USE'],
  'Share of planning surface categories, not mapped existing habitat','GIS ecology survey, land use accounting and ecological performance indicators','ecology');
 add('CITY-005','city','Built footprint allocation',LAND_USE.find(v=>v.key==='built').percent,'%','assumption',['src/model.js','LAND_USE'],
  'Footprint budget, not a percentage of developable parcel or legally approved building rights','Measured footprint polygons, codes and site-level area accounting','architecture');
 add('CITY-006','city','Model land budget sum',landUseTotal(),'%','derived',['src/model.js','landUseTotal'],
  'Sum of reference categories, not independent verification','Compare actual site areas and mutually exclusive land classes','land');

 add('EN-001','energy','Reference solar nameplate',energyInput.solarMW,'MWp','assumption',['src/scenario.js','ENERGY_DEFAULTS.solarMW'],
  'No roof-area audit, irradiance, land exclusion or equipment selection','Real solar resource, available area, interconnection and environmental study','energy');
 add('EN-002','energy','Reference wind nameplate',energyInput.windMW,'MW','assumption',['src/scenario.js','ENERGY_DEFAULTS.windMW'],
  'No verified wind feasibility, fauna protection or siting rights','Wind data, wildlife assessment, permits and economic feasibility','energy');
 add('EN-003','energy','Annual electricity demand',energy.annualDemandGWh,'GWh/year','derived',['src/scenario.js','simulateEnergy'],
  'Synthetic 8,760-hour demand curve normalized to 240 GWh/year','Measured hourly demand and thermal/electric service separation','energy');
 add('EN-004','energy','Annual renewable generation',energy.generationGWh,'GWh/year','derived',['src/scenario.js','simulateEnergy'],
  'Solar and wind with assumed capacity factors and no site weather','Independent hourly yield, clipping, curtailment and grid study','energy');
 add('EN-005','energy','Residual grid imports',energy.gridImportGWh,'GWh/year','derived',['src/scenario.js','simulateEnergy'],
  'Demand shortfall after simulated battery dispatch; annual generation parity does not eliminate imports','Actual demand timing, export/import limits and utility tariff profile','energy');
 add('EN-006','energy','Local hourly electricity share',energy.localSharePct,'%','derived',['src/scenario.js','simulateEnergy'],
  'Synthetic fraction of hourly load covered locally; not islanding or net-zero evidence','Calibrated dispatch and multi-day extreme condition verification','energy');
 add('EN-007','energy','Reference battery storage',energyInput.batteryMWh,'MWh','assumption',['src/scenario.js','ENERGY_DEFAULTS.batteryMWh'],
  'Four-hour illustrative dispatch with 86% assumed round-trip efficiency','Battery power/energy sizing, fire protection, useful lifetime and degradation','energy');

 add('WA-001','water','Citywide gross daily water reference',ASSUMPTIONS.dailyWaterML,'ML/day','assumption',['src/model.js','ASSUMPTIONS.dailyWaterML'],
  'Original full-city demand scenario before model conservation adjustment','Land-specific end-use demand and lawful watershed water balance','water');
 add('WA-002','water','Water after model conservation',water.grossUseML,'ML/day','derived',['src/scenario.js','simulateWater'],
  '8 ML/day multiplied by selected conservation factor','Verified end-use fixtures, irrigation, leakage and seasonal demand','water');
 add('WA-003','water','Potential treated nonpotable reuse',water.reclaimedML,'ML/day','derived',['src/scenario.js','simulateWater'],
  'Bounded by captured greywater, treatment yield, capacity and eligible end use','Quality certification, treatment permissions, cross-connection prevention','water');
 add('WA-004','water','Freshwater need after reuse',water.freshwaterRequiredML,'ML/day','derived',['src/scenario.js','simulateWater'],
  'Remaining daily gross demand in a simple steady-state balance','Surface/groundwater rights, drought reliability and downstream habitat flow','water');

 add('EC-001','ecology','River setback example',workspaceSnapshot?.atlasSetbackM??SETBACKS.reference,'m','assumption',['src/atlas.js','SETBACKS.reference'],
  'Fictional horizontal buffer; NOT a geodesic/legal riparian setback','Surveyed channel and actual applicable riparian/flood/habitat requirements','ecology');
 add('EC-002','ecology','Schematic exclusions in Atlas',atlas.excludedPct,'%','derived',['src/atlas.js','estimateAtlas'],
  '100 × 100 cell sampling of invented ellipse/channel geometry','Official mapped sensitive areas, surveys and certified geospatial analysis','ecology');

 add('BL-001','buildings','Courtyard prototype footprint',building.footprintM2,'m²','derived',['src/blueprint.js','calculateBuilding'],
  'Outer rectangle minus open courtyard: 60 × 48 m minus 28 × 22 m','Real architecture, parcel envelopes and permitted footprint','architecture');
 add('BL-002','buildings','Courtyard gross floor area',building.grossFloorAreaM2,'m²','derived',['src/blueprint.js','calculateBuilding'],
  'Same gross perimeter every floor; no measured egress/shafts','Licensed plan and code-based floor schedule','architecture');
 add('BL-003','buildings','Courtyard indicative housing',building.housingUnits,'homes','derived',['src/blueprint.js','calculateBuilding'],
  'Net efficiency × housing share ÷ typical dwelling size','Bedroom mix, daylight, fire/egress and affordability review','social');
 add('BL-004','buildings','Courtyard nominal annual rooftop PV',building.pvAnnualMWh,'MWh/year','derived',['src/blueprint.js','calculateBuilding'],
  'Roof percentage, 0.20 kWp/m² and 19% assumed solar capacity factor','Actual structural roof, shading and electrical yield','energy');

 add('DI-001','district','Composer study area',precision(CANVAS.areaM2/10000), 'ha','design-rule',['src/district.js','CANVAS'],
  'Local 600 m × 600 m fictional canvas; not a city district parcel','Site survey, rights, developable envelope and public streets','land');
 add('DI-002','district','Seed example buildings',district.buildingCount,'buildings','derived',['src/district.js','seedLayout'],
  'Example Garden Forum layout; these blocks do not exist','Site feasibility and architect-approved masterplot','architecture');
 add('DI-003','district','Seed example potential residents',district.estimatedResidents,'people','derived',['src/district.js','composeMetrics'],
  'Sum of building estimates under default use and occupancy assumptions','Dwelling/unit schedule and verified service capacity','social');

 add('CO-001','community','Routed walking proximity',community.pedestrian.within400m,'buildings ≤400 m','derived',['src/neighborhood.js','evaluateNeighborhood'],
  '20 m fictional four-way path network and unverified entry connections','Actual accessible sidewalks, routes, slopes, crossings and safety','architecture');
 add('CO-002','community','School seats deficit',community.services.school.gap,'seats','derived',['src/neighborhood.js','evaluateServices'],
  '0.13 seats/resident minus 180 assumed available school seats','Demographics and committed school facilities/staffing','social');
 add('CO-003','community','Capital low scenario',precision(community.costs.lowUsd/1000000,2),'USD million','derived',['src/neighborhood.js','evaluateCosts'],
  'Hypothetical low unit rates, service allowances, network quantities and 15% contingency','Local priced quantities, tender estimates and financial review','costs');

 add('UT-001','utilities','District gross water demand',infrastructure.demands.grossWaterM3d,'m³/day','derived',['src/infrastructure.js','districtUtilityLoads'],
  'Example Garden Forum blocks × assumed domestic and nonresidential use','Verified utility end uses, populations and permitted water supply','water');
 add('UT-002','utilities','District potential reclaimed water',infrastructure.waterBalance.reclaimedPotentialM3d,'m³/day','derived',['src/infrastructure.js','runInfrastructure'],
  'Limited by volume of wastewater collected, assumed reuse fraction and model plant capacity','Full treatment process and lawful quality-approved reuse','water');
 add('UT-003','utilities','District peak thermal load',infrastructure.demands.thermalPeakMW,'MW peak','derived',['src/infrastructure.js','runInfrastructure'],
  'Area times default hypothetical peak W/m²; not measured or modeled heat transfer','Hourly heating/cooling loads and thermal network hydraulics','energy');
 add('UT-004','utilities','Stormwater event runoff',infrastructure.demands.stormRunoffM3,'m³/event','derived',['src/infrastructure.js','runInfrastructure'],
  'Rainfall depth × 36 ha × assumed runoff coefficient; no hydrologic hydrograph','Observed rainfall, soils, pollutant control, safe outfall, flood analysis','ecology');
 add('UT-005','utilities','Stormwater capacity shortfall',infrastructure.systems.drainage.shortfall,'m³/event','derived',['src/infrastructure.js','runInfrastructure'],
  'Simplified network max-flow vs detention/release budget, not a safe flood design','Qualified civil engineering and downstream hazard evaluation','hazards');
 if(!workspaceSnapshot)return r;
 const dynamicAssumptions={'EN-001':'solarMW','EN-002':'windMW','EN-007':'batteryMWh'};
 return r.map(row=>({
  ...row,
  context:'Shared editable scenario for '+workspaceSnapshot.districtId+'; synthetic and unverified',
  source:Object.hasOwn(dynamicAssumptions,row.id)?
   source('src/workspace.js','snapshot.energy.'+dynamicAssumptions[row.id]):row.source,
  formula:row.id==='DI-002'?'Selected workspace district layout, not the original seed: '+row.formula:row.formula
 }));
}
export function validateEvidenceLedger(records=buildEvidenceLedger(),gates=REVIEW_GATES){
 const errors=[],ids=new Set(),validDomain=new Set(DOMAINS.map(d=>d.id)),
  validKind=new Set(KINDS.map(k=>k.id)),gateIds=new Set(gates.map(g=>g.id));
 for(const r of records){
  if(ids.has(r.id))errors.push('Duplicate record '+r.id);
  ids.add(r.id);
  if(!validDomain.has(r.domain))errors.push(r.id+': invalid domain');
  if(!validKind.has(r.kind))errors.push(r.id+': invalid provenance type');
  if(!gateIds.has(r.gate))errors.push(r.id+': unknown gate');
  if(!r.source?.path?.startsWith('src/'))errors.push(r.id+': source must be a traceable model path');
  if(r.source?.externalEvidence!==false)errors.push(r.id+': invented external evidence');
  if(r.siteEvidence!=='not-verified')errors.push(r.id+': site status cannot be elevated without verification workflow');
  if(!r.title||!r.formula||!r.verificationRequired)errors.push(r.id+': missing methodology');
  if(typeof r.value==='number'&&!Number.isFinite(r.value))errors.push(r.id+': non-finite value');
 }
 if(new Set(gates.map(g=>g.id)).size!==gates.length)errors.push('Duplicate evidence gate');
 if(gates.some(g=>g.status!=='not-verified'))errors.push('Gate status requires independent verification system; unsupported here');
 return{ok:errors.length===0,errors,records:records.length,unverified:records.filter(r=>r.siteEvidence==='not-verified').length,
  gates:gates.length,unverifiedGates:gates.filter(g=>g.status==='not-verified').length,
  constructionClearance:false,
  status:'HOLD: site-specific independent evidence and authorized review not implemented'};
}
export function evidenceExport(records=buildEvidenceLedger(),gates=REVIEW_GATES,workspaceMeta=null){
 const audit=validateEvidenceLedger(records,gates);
 if(!audit.ok)throw new Error('Cannot export malformed evidence register: '+audit.errors.join('; '));
 return JSON.stringify({
  schema:EVIDENCE_SCHEMA,
  status:'MODEL TRACEABILITY ONLY / NO FIELD VERIFICATION / NOT FOR CONSTRUCTION',
  scope:workspaceMeta?'CANOPY shared editable workspace scenario':'CANOPY canonical default scenarios',
  workspaceRevision:workspaceMeta?.revision??null,
  caveats:[
   'No external site observation, expert signoff, permission, measured utility result or audit evidence is incorporated.',
   'Values come from source code; traceability is not scientific corroboration, construction approval or risk acceptance.',
   'All real-world readiness gates are unverified and cannot be marked approved through this interface.',
   'A new verification system must validate external documents, signatures, permissions, dates, confidence and contradictions before elevating any claim.'
  ],
  baselineInputs:workspaceMeta?{energy:workspaceMeta.snapshot.energy,water:workspaceMeta.snapshot.water,building:'Living Courtyard',district:workspaceMeta.snapshot.districtId,layout:workspaceMeta.snapshot.layouts[workspaceMeta.snapshot.districtId],infrastructure:workspaceMeta.snapshot.infrastructure,community:workspaceMeta.snapshot.community,prototypes:workspaceMeta.snapshot.prototypes,atlasSetbackM:workspaceMeta.snapshot.atlasSetbackM}:{energy:ENERGY_DEFAULTS,water:WATER_DEFAULTS,building:'Living Courtyard',district:'seedLayout(garden)',infrastructure:DEFAULT_INFRA},
  gateStatus:gates,
  audit,records
 },null,2);
}
