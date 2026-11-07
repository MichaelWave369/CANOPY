import {BUILDINGS} from './blueprint.js';
import {CANVAS,RESERVED,TRANSIT_STOPS,footprint,composeMetrics,validateLayout} from './district.js';

/**
 * Mission Five: deterministic, entirely un-georeferenced planning exercise.
 * Paths are a 20m centerline grid, not constructed sidewalks or ADA paths.
 */
export const NEIGHBORHOOD_SCHEMA='canopy.neighborhood.v1';
export const GRID_M=20;
export const SERVICES=Object.freeze([
 {id:'school',label:'Learning hub',x:180,y:260,kind:'education'},
 {id:'clinic',label:'Health clinic',x:420,y:260,kind:'health'},
 {id:'food',label:'Food hub',x:220,y:420,kind:'food'},
 {id:'commons',label:'Public commons',x:300,y:260,kind:'civic'}
]);
export const TARGETS=Object.freeze([
 ...TRANSIT_STOPS.map((s,i)=>({id:'stop-'+i,label:s.name,kind:'transit',x:s.x,y:s.y})),
 ...SERVICES
]);
export const DEFAULT_CAPACITY=Object.freeze({
 schoolSeats:180,clinicVisitsPerYear:4500,publicRoomSeats:140,
 constructionMultiplier:1
});
export const UNIT_RANGES=Object.freeze({
 buildingLowUsdM2:2900,buildingHighUsdM2:5400,
 linearInfrastructureLowUsdM:2200,linearInfrastructureHighUsdM:9000,
 restoredPublicRealmM2:35000,publicRealmLowUsdM2:55,publicRealmHighUsdM2:175,
 serviceLowUsdResident:6000,serviceHighUsdResident:18000,
 lowContingency:0.15,highContingency:0.30,
 networkLinearMeters:1200
});
const round=(x,d=1)=>Number(x.toFixed(d));
const key=(x,y)=>x+','+y;
const onGrid=v=>Number.isInteger(v)&&v>=20&&v<=580&&v%GRID_M===0;
const rectHas=(a,x,y,pad=0)=>x>a.x-pad&&x<a.x+a.w+pad&&y>a.y-pad&&y<a.y+a.h+pad;
const ellipseHas=(e,x,y,pad=0)=>(Math.pow((x-e.cx)/(e.rx+pad),2)+Math.pow((y-e.cy)/(e.ry+pad),2))<1;
export function isWalkableNode(x,y,layout=[]){
 if(!onGrid(x)||!onGrid(y))return false;
 for(const z of RESERVED){
  if(z.category==='ecology'||z.category==='food'){
   if(z.kind==='rect'?rectHas(z,x,y,0):ellipseHas(z,x,y,0))return false;
  }
  if(z.category==='transit' && z.kind==='rect' && rectHas(z,x,y,0)){
   if(!(y===300 && [100,300,500].includes(x)))return false;
  }
 }
 for(const item of layout)if(rectHas(footprint(item),x,y,2))return false;
 return true;
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
export function nearestWalkNode(point,layout=[]){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))throw new RangeError('Finite local target coordinates required');
 let best=null;
 for(let y=20;y<=580;y+=GRID_M)for(let x=20;x<=580;x+=GRID_M){
  if(!isWalkableNode(x,y,layout))continue;
  const d=Math.hypot(point.x-x,point.y-y);
  if(!best||d<best.distanceM-1e-9)best={x,y,distanceM:d};
 }
 return best;
}
function routeOnNodes(start,finish,layout){
 const source=key(start.x,start.y),end=key(finish.x,finish.y);
 const queue=[{x:start.x,y:start.y}],prev=new Map([[source,null]]);
 let head=0;
 while(head<queue.length){
  const cur=queue[head++],k=key(cur.x,cur.y);
  if(k===end)break;
  for(const [dx,dy] of [[20,0],[0,20],[-20,0],[0,-20]]){
   const x=cur.x+dx,y=cur.y+dy,next=key(x,y);
   if(prev.has(next)||!isWalkableNode(x,y,layout))continue;
   prev.set(next,k);queue.push({x,y});
  }
 }
 if(!prev.has(end))return null;
 const nodes=[];let cursor=end;
 while(cursor!==null){const [x,y]=cursor.split(',').map(Number);nodes.push({x,y});cursor=prev.get(cursor);}
 nodes.reverse();return nodes;
}
export function routeBetween(from,to,layout=[]){
 if(!validateLayout(layout).ok)throw new RangeError('Layout invalid');
 const start=nearestWalkNode(from,layout),finish=nearestWalkNode(to,layout);
 if(!start||!finish)return{reachable:false,reason:'No public walking nodes found',path:[]};
 // The short connections to the routed grid are unverified schematic access legs.
 if(start.distanceM>90||finish.distanceM>90)return{
  reachable:false,reason:'Endpoint farther than 90 m from illustrative walk network',path:[]
 };
 const nodes=routeOnNodes(start,finish,layout);
 if(!nodes)return{reachable:false,reason:'No connected pedestrian grid path',path:[]};
 const length=(nodes.length-1)*GRID_M+start.distanceM+finish.distanceM;
 return{reachable:true,routeM:round(length),gridM:(nodes.length-1)*GRID_M,
  connectionM:round(start.distanceM+finish.distanceM),path:[{x:from.x,y:from.y},...nodes,{x:to.x,y:to.y}],
  disclaimer:'Grid-based schematic route plus straight access connections; not a constructed, accessible, gradient-checked or curb-safe walking path'};
}
export function routesForBuilding(building,layout){
 const box=footprint(building),source={x:box.cx,y:box.cy};
 const results=TARGETS.map(target=>({id:target.id,label:target.label,kind:target.kind,...routeBetween(source,target,layout)}));
 const transit=results.filter(r=>r.kind==='transit'&&r.reachable).sort((a,b)=>a.routeM-b.routeM)[0];
 return {buildingId:building.id,closestStop:transit||null,
  services:results.filter(r=>r.kind!=='transit'),
  connectedStops:results.filter(r=>r.kind==='transit'&&r.reachable).length,
  all:results};
}
function nonnegative(name,value,min,max){
 const v=Number(value);
 if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(name+' outside supported scenario bounds');
 return v;
}
export function evaluateServices(estimatedResidents,settings=DEFAULT_CAPACITY){
 const p=nonnegative('Residents',estimatedResidents,0,100000),schoolSeats=nonnegative('School seats',settings.schoolSeats,0,10000),
 clinicVisitsPerYear=nonnegative('Clinic visits',settings.clinicVisitsPerYear,0,100000),
 publicRoomSeats=nonnegative('Public room seats',settings.publicRoomSeats,0,10000);
 const schoolDemand=Math.ceil(p*.13);
 const clinicDemand=Math.ceil(p*2.8);
 const publicDemand=Math.ceil(p*.06);
 return {
  assumptions:{schoolSeatDemandPerResident:.13,clinicVisitsPerResidentYear:2.8,simultaneousRoomSeatDemandPerResident:.06},
  school:{required:schoolDemand,provided:schoolSeats,gap:Math.max(0,schoolDemand-schoolSeats)},
  clinic:{required:clinicDemand,provided:clinicVisitsPerYear,gap:Math.max(0,clinicDemand-clinicVisitsPerYear)},
  publicRoom:{required:publicDemand,provided:publicRoomSeats,gap:Math.max(0,publicDemand-publicRoomSeats)},
  status:'Illustrative demand and user-entered capacity, NOT assessed schools, medical provision or permits'
 };
}
export function evaluateCosts(layout,options=DEFAULT_CAPACITY){
 const metrics=composeMetrics(layout),mult=nonnegative('Cost factor',options.constructionMultiplier,.5,2);
 const {buildingLowUsdM2,buildingHighUsdM2,linearInfrastructureLowUsdM,linearInfrastructureHighUsdM,
 restoredPublicRealmM2,publicRealmLowUsdM2,publicRealmHighUsdM2,serviceLowUsdResident,serviceHighUsdResident,
 lowContingency,highContingency,networkLinearMeters}=UNIT_RANGES;
 const lowBuilding=metrics.grossFloorAreaM2*buildingLowUsdM2*mult,highBuilding=metrics.grossFloorAreaM2*buildingHighUsdM2*mult;
 const lowNet=networkLinearMeters*linearInfrastructureLowUsdM*mult+restoredPublicRealmM2*publicRealmLowUsdM2*mult;
 const highNet=networkLinearMeters*linearInfrastructureHighUsdM*mult+restoredPublicRealmM2*publicRealmHighUsdM2*mult;
 const lowServices=metrics.estimatedResidents*serviceLowUsdResident*mult;
 const highServices=metrics.estimatedResidents*serviceHighUsdResident*mult;
 const low=(lowBuilding+lowNet+lowServices)*(1+lowContingency),high=(highBuilding+highNet+highServices)*(1+highContingency);
 const groups=[layout.filter((_,i)=>i%3===0),layout.filter((_,i)=>i%3===1),layout.filter((_,i)=>i%3===2)];
 const weights=[.5,.3,.2];
 const phases=groups.map((group,i)=>{
  const data=composeMetrics(group),share=data.grossFloorAreaM2/Math.max(1,metrics.grossFloorAreaM2);
  const costLow=(data.grossFloorAreaM2*buildingLowUsdM2*mult+
   lowNet*weights[i]+data.estimatedResidents*serviceLowUsdResident*mult)*(1+lowContingency);
  const costHigh=(data.grossFloorAreaM2*buildingHighUsdM2*mult+
   highNet*weights[i]+data.estimatedResidents*serviceHighUsdResident*mult)*(1+highContingency);
  return {phase:i+1,buildings:group.length,grossFloorAreaM2:data.grossFloorAreaM2,
   estimatedResidents:data.estimatedResidents,allocationNote:'Buildings assigned by stable insertion-order modulo three; networks split 50/30/20, not schedule engineering',
   lowUsd:Math.round(costLow),highUsd:Math.round(costHigh)};
 });
 return{lowUsd:Math.round(low),highUsd:Math.round(high),phases,
  inputs:{constructionMultiplier:mult,...UNIT_RANGES},
  limitations:'Hypothetical 2026-USD unit rates with NO quotes, region, land, financing, operating costs, taxes, local permitting, inflation or site engineering. Contingencies are illustrative. Not a bid or estimate.'};
}
export function evaluateNeighborhood(layout,settings=DEFAULT_CAPACITY){
 const metrics=composeMetrics(layout);
 const routing=layout.map(b=>routesForBuilding(b,layout));
 const accessible=routing.filter(r=>r.closestStop);
 const threshold=400;
 return{
  metrics,settings:{...settings},
  routes:routing,
  pedestrian:{buildingsWithRoutedStop:accessible.length,totalBuildings:layout.length,
   within400m:accessible.filter(r=>r.closestStop.routeM<=threshold).length,
   maxToStopM:accessible.length?Math.max(...accessible.map(r=>r.closestStop.routeM)):null,
   unroutedBuildings:routing.filter(r=>!r.closestStop).map(r=>r.buildingId),
   distanceLimitM:threshold,
   note:'Routed 20 m grid with unverified access legs. No slopes, curb cuts, signals, crossings safety or legal ADA compliance.'},
  emergency:{axisDistanceMaxM:layout.length?round(Math.max(...layout.map(b=>{
   const r=footprint(b);
   return Math.max(0,Math.min(Math.abs(r.cy-300)-r.h/2,Math.abs(r.cx-300)-r.w/2));
  }))):0,
   thresholdM:120,status:'PROXY ONLY: geometric distance from a footprint to one of two reserve centerlines; not a drivable fire route'},
  services:evaluateServices(metrics.estimatedResidents,settings),
  costs:evaluateCosts(layout,settings)
 };
}
export function neighborhoodExport(districtId,layout,settings=DEFAULT_CAPACITY){
 const result=evaluateNeighborhood(layout,settings);
 return JSON.stringify({
  schema:NEIGHBORHOOD_SCHEMA,
  status:'FICTIONAL CONCEPT / NOT GIS / NOT FOR CONSTRUCTION',
  districtId,canvas:CANVAS,
  methodology:{gridSpacingM:GRID_M,facilityPoints:SERVICES,transitStops:TRANSIT_STOPS,
    source:'CANOPY Mission Five: models from District Composer and Blueprint Studio; not site data',
    walking:'20m 4-direction routes avoid illustrative habitat, food zones and building envelopes; tram crossings allowed at three hypothetical stations',
    emergency:'Centerline distance proxy ONLY; no drivable fire lane or code clearance',
    costs:'Synthetic cost sensitivity only; full unit-rate assumptions in results'},
  result
 },null,2);
}
