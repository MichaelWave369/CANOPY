import {BUILDINGS,calculateBuilding} from './blueprint.js';
import {CANVAS,footprint,composeMetrics,validateLayout} from './district.js';

export const INFRA_SCHEMA='canopy.infrastructure.v1';
export const UTILITIES=Object.freeze([
 {id:'potable',name:'Water distribution',unit:'m³/day',color:'#438bad'},
 {id:'sewer',name:'Wastewater collection',unit:'m³/day',color:'#ab9674'},
 {id:'thermal',name:'District heat / cooling',unit:'MW peak',color:'#c77d63'},
 {id:'drainage',name:'Stormwater conveyance',unit:'m³ per event',color:'#69a09d'}
]);
export const NODES=Object.freeze([
 {id:'hub',label:'Water + energy hub',x:300,y:300},
 {id:'west',label:'West branch',x:100,y:300},
 {id:'north',label:'North branch',x:300,y:100},
 {id:'east',label:'East branch',x:500,y:300},
 {id:'south',label:'South branch',x:300,y:500}
]);
export const LINKS=Object.freeze([
 {id:'hub-west',a:'hub',b:'west',water:260,sewer:260,thermal:4.4,drainage:400},
 {id:'hub-north',a:'hub',b:'north',water:250,sewer:260,thermal:4.4,drainage:400},
 {id:'hub-east',a:'hub',b:'east',water:240,sewer:250,thermal:4.4,drainage:400},
 {id:'hub-south',a:'hub',b:'south',water:260,sewer:260,thermal:4.4,drainage:400},
 {id:'west-north',a:'west',b:'north',water:110,sewer:120,thermal:1.7,drainage:160},
 {id:'north-east',a:'north',b:'east',water:110,sewer:120,thermal:1.7,drainage:160},
 {id:'east-south',a:'east',b:'south',water:110,sewer:120,thermal:1.7,drainage:160},
 {id:'south-west',a:'south',b:'west',water:110,sewer:120,thermal:1.7,drainage:160}
]);
export const DEFAULT_INFRA=Object.freeze({
 freshwaterCapacityM3d:720,
 reuseCapacityM3d:120,
 wastewaterPlantM3d:850,
 thermalPlantMW:12,
 rainMm:45,
 runoffCoefficient:.55,
 eventHours:6,
 detentionM3:4500,
 infiltrationM3h:65,
 safeOutletM3h:150,
 thermalPeakWm2:45,
 thermalStressFactor:1,
 failedLink:'none'
});
const round=(v,precision=2)=>Number(v.toFixed(precision));
function bounded(name,value,min,max){
 const v=Number(value);
 if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(name+' must be between '+min+' and '+max);
 return v;
}
export function normalizeInfrastructure(input=DEFAULT_INFRA){
 if(input===null||typeof input!=='object')throw new TypeError('Infrastructure settings required');
 const out={
  freshwaterCapacityM3d:bounded('Freshwater',input.freshwaterCapacityM3d,0,5000),
  reuseCapacityM3d:bounded('Reclaimed water',input.reuseCapacityM3d,0,2000),
  wastewaterPlantM3d:bounded('Wastewater',input.wastewaterPlantM3d,0,6000),
  thermalPlantMW:bounded('Thermal',input.thermalPlantMW,0,100),
  rainMm:bounded('Event rain depth',input.rainMm,0,300),
  runoffCoefficient:bounded('Runoff coefficient',input.runoffCoefficient,.1,.95),
  eventHours:bounded('Event duration',input.eventHours,1,72),
  detentionM3:bounded('Detention',input.detentionM3,0,50000),
  infiltrationM3h:bounded('Infiltration',input.infiltrationM3h,0,3000),
  safeOutletM3h:bounded('Safe outlet',input.safeOutletM3h,0,3000),
  thermalPeakWm2:bounded('Thermal design intensity',input.thermalPeakWm2,15,200),
  thermalStressFactor:bounded('Thermal stress multiplier',input.thermalStressFactor,.5,2.5),
  failedLink:input.failedLink
 };
 if(out.failedLink!=='none'&&!LINKS.some(x=>x.id===out.failedLink))throw new RangeError('Unrecognized failed link');
 return out;
}
export function nearestHub(point){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))throw new RangeError('Finite local coordinates required');
 return NODES.reduce((best,n)=>{
  const d=Math.hypot(n.x-point.x,n.y-point.y);
  return !best||d<best.distanceM-1e-9?{id:n.id,distanceM:d}:best;
 },null);
}
export function districtUtilityLoads(layout,config=DEFAULT_INFRA,templates=BUILDINGS){
 if(!validateLayout(layout,templates).ok)throw new RangeError('Invalid district layout');
 const settings=normalizeInfrastructure(config);
 const nodes=Object.fromEntries(NODES.map(n=>[n.id,{water:0,sewer:0,thermal:0,buildings:0}]));
 let grossWaterM3d=0,sewerInfluentM3d=0,thermalPeakMW=0,totalConnectionM=0;
 const buildings=layout.map(item=>{
  const b=templates[item.template],q=calculateBuilding(b),p=footprint(item,templates);
  const nonresM2=q.grossFloorAreaM2*(1-b.residentialShare/100);
  const waterM3d=q.estimatedResidents*.11+nonresM2*.004;
  const sewerM3d=waterM3d*.82;
  const thermalMW=q.grossFloorAreaM2*settings.thermalPeakWm2*settings.thermalStressFactor/1000000;
  const nearest=nearestHub({x:p.cx,y:p.cy}),node=nodes[nearest.id];
  node.water+=waterM3d;node.sewer+=sewerM3d;node.thermal+=thermalMW;node.buildings++;
  totalConnectionM+=nearest.distanceM;
  grossWaterM3d+=waterM3d;sewerInfluentM3d+=sewerM3d;thermalPeakMW+=thermalMW;
  return{id:item.id,hubId:nearest.id,connectionDistanceM:round(nearest.distanceM),
   demand:{waterM3d:round(waterM3d),sewerM3d:round(sewerM3d),thermalMW:round(thermalMW,3)},
   note:'Straight connection to closest schematic hub; no property, pipe or utility easement surveyed'};
 });
 return{grossWaterM3d,sewerInfluentM3d,thermalPeakMW,totalConnectionM:round(totalConnectionM),
  buildings,nodes,settings,
  note:'Domestic water = 110 L/resident/day; nonresidential use = 4 L/m²/day; 82% collection to sewer. Peak thermal = 45 W/m² unless adjusted. All are assumed.'};
}
function edmondsKarp(demandByNode,plantCapacity,commodity,failedLink,stormHours=1){
 const source='@source',sink='@sink';
 const graph=new Map();
 function ensure(id){if(!graph.has(id))graph.set(id,new Map());}
 function addEdge(a,b,cap){
  ensure(a);ensure(b);
  graph.get(a).set(b,(graph.get(a).get(b)||0)+cap);
  if(!graph.get(b).has(a))graph.get(b).set(a,0);
 }
 for(const n of NODES)ensure(n.id);
 ensure(source);ensure(sink);
 addEdge(source,'hub',plantCapacity);
 for(const link of LINKS){
  if(link.id===failedLink)continue;
  const cap=link[commodity]*(commodity==='drainage'?stormHours:1);
  addEdge(link.a,link.b,cap);
  addEdge(link.b,link.a,cap);
 }
 for(const n of NODES)addEdge(n.id,sink,Math.max(0,demandByNode[n.id]||0));
 let delivered=0,iterations=0;
 while(iterations++<10000){
  const queue=[source],previous=new Map([[source,null]]);
  for(let i=0;i<queue.length&&!previous.has(sink);i++){
   const node=queue[i];
   for(const [next,capacity] of graph.get(node).entries()){
    if(capacity>1e-9&&!previous.has(next)){previous.set(next,node);queue.push(next);}
   }
  }
  if(!previous.has(sink))break;
  let bottleneck=Infinity;
  for(let at=sink;at!==source;at=previous.get(at)){
   const before=previous.get(at);
   bottleneck=Math.min(bottleneck,graph.get(before).get(at));
  }
  for(let at=sink;at!==source;at=previous.get(at)){
   const before=previous.get(at);
   graph.get(before).set(at,graph.get(before).get(at)-bottleneck);
   graph.get(at).set(before,(graph.get(at).get(before)||0)+bottleneck);
  }
  delivered+=bottleneck;
 }
 const totalDemand=Object.values(demandByNode).reduce((a,b)=>a+b,0);
 const deliveredByNode=Object.fromEntries(NODES.map(n=>[n.id,Math.max(0,(demandByNode[n.id]||0)-(graph.get(n.id).get(sink)||0))]));
 return{
  required:totalDemand,delivered,shortfall:Math.max(0,totalDemand-delivered),
  servedPct:totalDemand?delivered/totalDemand*100:100,
  deliveredByNode,
  plantCapacity,
  failedLink,
  unit:commodity==='thermal'?'MW':commodity==='drainage'?'m³/event':'m³/day',
  method:'Single-commodity maximum-flow graph on hypothetical two-way links; NOT hydraulic, thermal, pump, slope, pressure or time-dependent simulation'
 };
}
export function runInfrastructure(layout,input=DEFAULT_INFRA,templates=BUILDINGS){
 const load=districtUtilityLoads(layout,input,templates),s=load.settings;
 const wastewater=edmondsKarp(Object.fromEntries(NODES.map(n=>[n.id,load.nodes[n.id].sewer])),s.wastewaterPlantM3d,'sewer',s.failedLink);
 // Reuse is limited by treated collection; recovery fraction and eligible nonpotable uses.
 const reclaimM3d=Math.min(s.reuseCapacityM3d,wastewater.delivered*.28,load.grossWaterM3d*.30);
 const freshwaterRequiredM3d=Math.max(0,load.grossWaterM3d-reclaimM3d);
 const water=edmondsKarp(Object.fromEntries(NODES.map(n=>[n.id,load.nodes[n.id].water])),
  s.freshwaterCapacityM3d+reclaimM3d,'water',s.failedLink);
 const thermal=edmondsKarp(Object.fromEntries(NODES.map(n=>[n.id,load.nodes[n.id].thermal])),
  s.thermalPlantMW,'thermal',s.failedLink);
 const runoffM3=s.rainMm/1000*CANVAS.areaM2*s.runoffCoefficient;
 // Five artificial equal catchment buckets; no actual drainage geography or hydrograph.
 const catchment=runoffM3/NODES.length;
 const drainage=edmondsKarp(Object.fromEntries(NODES.map(n=>[n.id,catchment])),
  s.detentionM3+(s.infiltrationM3h+s.safeOutletM3h)*s.eventHours,
  'drainage',s.failedLink,s.eventHours);
 const plantOverload={water:water.shortfall>1e-6,sewer:wastewater.shortfall>1e-6,
  thermal:thermal.shortfall>1e-6,storm:drainage.shortfall>1e-6};
 const waterSupplyGapM3d=Math.max(0,freshwaterRequiredM3d-s.freshwaterCapacityM3d);
 const alerts=[
  ...(plantOverload.water?['Potable/reuse supply or distribution cannot meet hypothetical water demand']:[]),
  ...(plantOverload.sewer?['Wastewater collection/plant cannot collect all design influent']:[]),
  ...(plantOverload.thermal?['Peak thermal system requires higher generation or network capacity']:[]),
  ...(plantOverload.storm?['Design rain volume exceeds stormwater conveyance plus detention/release budget']:[]),
  ...(s.failedLink!=='none'?['Corridor out of service: '+s.failedLink]:[])
 ];
 return{
  status:'SCHEMATIC / NOT A CIVIL OR UTILITY DESIGN',
  settings:s,
  demands:{grossWaterM3d:round(load.grossWaterM3d),sewerInfluentM3d:round(load.sewerInfluentM3d),
   thermalPeakMW:round(load.thermalPeakMW,3),stormRunoffM3:round(runoffM3),rainEventMm:s.rainMm},
  waterBalance:{reclaimedPotentialM3d:round(reclaimM3d),freshwaterRequiredM3d:round(freshwaterRequiredM3d),
   hypotheticalFreshwaterGapM3d:round(waterSupplyGapM3d),
   collectedSewageM3d:round(wastewater.delivered),uncollectedSewageM3d:round(wastewater.shortfall),
   modelAssumptions:'82% wastewater return, up to 28% of collected treatment flow reused and at most 30% of gross end-use, plus plant limit. Not water quality or treatment approval.'},
  graph:{nodes:NODES,links:LINKS,buildingConnections:load.buildings,
   connectionDistanceM:load.totalConnectionM,
   note:'Routes are direct schematic hub connections; links may cross conceptual restricted land and have no surveyed easement'},
  systems:{
   potable:report(water),sewer:report(wastewater),thermal:report(thermal),drainage:report(drainage)
  },
  stormwater:{detentionM3:s.detentionM3,
   availableOutflowM3:round((s.infiltrationM3h+s.safeOutletM3h)*s.eventHours),
   networkNote:'Single synthetic event volume, five evenly allocated catchments, no rainfall intensity hydrograph, soils, storm pipe profiles or downstream habitat flows.'},
  alerts,facilityLimitations:'No legal water rights, engineering capacity, groundwater recharge, treatment quality, pumping/pressure, erosion, life-safety, thermal loads, drainage permits or actual connection routes.'
 };
}
function report(flow){
 return{
  required:round(flow.required,3),delivered:round(flow.delivered,3),
  shortfall:round(flow.shortfall,3),servedPct:round(flow.servedPct,1),
  plantCapacity:round(flow.plantCapacity,3),unit:flow.unit,
  byNode:Object.fromEntries(Object.entries(flow.deliveredByNode).map(([k,v])=>[k,round(v,3)])),
  method:flow.method
 };
}
export function infrastructureExport(districtId,layout,input=DEFAULT_INFRA,templates=BUILDINGS){
 const results=runInfrastructure(layout,input,templates);
 return JSON.stringify({schema:INFRA_SCHEMA,status:'SYNTHETIC UTILITIES / UNGEOREFERENCED / NOT FOR CONSTRUCTION',
  districtId,study:{...CANVAS},prototypes:templates,scenario:results,
  limitations:[
   'Utility corridor graph is schematic; links have no verified easement or ecological clearance.',
   'Electrical microgrid is independently modeled in the Living Systems Lab, not part of this hydraulic graph.',
   'All network capacities and node loads are invented; max-flow quantities do not establish water pressure, gravity drainage, thermal delta-T, lift stations, safety or quality.',
   'Wastewater reuse is hypothetical and cannot be implemented without certified treatment and lawful approvals.',
   'Stormwater volume-only event estimate omits flood modeling, infiltration suitability, safe overflow, pollutant removal and downstream impacts.',
   'Supply outage does not imply a safe state; emergencies require professional contingency and human control.'
  ]
 },null,2);
}
