import {BUILDINGS,calculateBuilding} from './blueprint.js';

export const COMPOSER_SCHEMA='canopy.district-composer.v1';
export const CANVAS=Object.freeze({
  widthM:600,heightM:600,areaM2:360000,edgeReserveM:20,buildingSeparationM:10,
  status:'FICTIONAL LOCAL METERS / NO GEOGRAPHIC OR LEGAL SITE'
});
export const CENTERS=Object.freeze([60,140,220,300,380,460,540]);
export const SLOTS=Object.freeze(CENTERS.flatMap((y,row)=>CENTERS.map((x,col)=>({col,row,x,y,id:row+'-'+col}))));
export const TRANSIT_STOPS=Object.freeze([{x:100,y:300,name:'West stop'},{x:300,y:300,name:'Commons stop'},{x:500,y:300,name:'East stop'}]);
export const RESERVED=Object.freeze([
  {id:'river-greenway',label:'Ecological greenway',kind:'rect',x:518,y:0,w:82,h:600,category:'ecology'},
  {id:'protected-grove',label:'Illustrative habitat grove',kind:'ellipse',cx:76,cy:72,rx:69,ry:69,category:'ecology'},
  {id:'wetland',label:'Illustrative wetland cell',kind:'ellipse',cx:525,cy:535,rx:69,ry:65,category:'ecology'},
  {id:'productive-land',label:'Protected food landscape',kind:'rect',x:25,y:462,w:150,h:108,category:'food'},
  {id:'tram-spine',label:'Transit/emergency avenue',kind:'rect',x:0,y:283,w:600,h:34,category:'transit'},
  {id:'walk-spine',label:'Accessible pedestrian spine',kind:'rect',x:284,y:0,w:32,h:600,category:'pedestrian'},
  {id:'common',label:'Public commons',kind:'ellipse',cx:300,cy:300,rx:66,ry:66,category:'civic'}
]);
const round=(n,d=1)=>Number(n.toFixed(d));
export function getSlot(col,row){
 if(!Number.isInteger(col)||!Number.isInteger(row)||col<0||col>=CENTERS.length||row<0||row>=CENTERS.length)throw new RangeError('Unknown concept grid cell');
 return SLOTS[row*CENTERS.length+col];
}
export function footprint(item,templates=BUILDINGS){
 if(!item || !Object.hasOwn(templates,item.template))throw new RangeError('Unknown building prototype');
 if(![0,90].includes(item.rotation))throw new RangeError('Rotation must be 0 or 90 degrees');
 const slot=getSlot(item.col,item.row),b=templates[item.template];
 const w=item.rotation===90?b.depthM:b.widthM,h=item.rotation===90?b.widthM:b.depthM;
 return {x:slot.x-w/2,y:slot.y-h/2,w,h,cx:slot.x,cy:slot.y,template:item.template,id:item.id};
}
function intersectsRect(a,b,pad=0){
 return a.x-pad < b.x+b.w && a.x+a.w+pad>b.x && a.y-pad<b.y+b.h && a.y+a.h+pad>b.y;
}
function intersectsEllipse(r,e,pad=0){
 const x=Math.max(r.x-pad,Math.min(e.cx,r.x+r.w+pad)),y=Math.max(r.y-pad,Math.min(e.cy,r.y+r.h+pad));
 return Math.pow((x-e.cx)/e.rx,2)+Math.pow((y-e.cy)/e.ry,2)<=1;
}
export function exclusionHits(rect){
 return RESERVED.filter(e=>e.kind==='rect'?intersectsRect(rect,e,2):intersectsEllipse(rect,e,2)).map(e=>e.id);
}
export function validatePlacement(existing,candidate,templates=BUILDINGS){
 if(!Array.isArray(existing))throw new TypeError('Placements must be an array');
 if(!Number.isInteger(candidate?.col)||!Number.isInteger(candidate?.row)||
    candidate.col<0||candidate.col>=CENTERS.length||candidate.row<0||candidate.row>=CENTERS.length){
   return{ok:false,reasons:['Outside editable 7 × 7 grid'],rect:null};
 }
 const rect=footprint(candidate,templates), reasons=[];
 if(!Number.isInteger(candidate.id) && (typeof candidate.id!=='string'||!candidate.id))reasons.push('Building identifier missing');
 if(rect.x<CANVAS.edgeReserveM||rect.y<CANVAS.edgeReserveM||
    rect.x+rect.w>CANVAS.widthM-CANVAS.edgeReserveM||
    rect.y+rect.h>CANVAS.heightM-CANVAS.edgeReserveM)reasons.push('Outside diagram edge reserve');
 for(const id of exclusionHits(rect))reasons.push('Reserved zone: '+RESERVED.find(z=>z.id===id).label);
 for(const item of existing){
  if(item.id===candidate.id)continue;
  if(intersectsRect(rect,footprint(item,templates),CANVAS.buildingSeparationM))reasons.push('Too close to '+item.id+' (10 m schematic separation)');
 }
 return{ok:reasons.length===0,reasons,rect};
}
export function validateLayout(layout,templates=BUILDINGS){
 if(!Array.isArray(layout))throw new TypeError('District layout must be an array');
 const seen=new Set(),problems=[];
 for(const item of layout){
  if(seen.has(item.id))problems.push('Duplicate id '+item.id);
  seen.add(item.id);
  const result=validatePlacement(layout,item,templates);
  if(!result.ok)problems.push(...result.reasons.map(m=>String(item.id)+': '+m));
 }
 return{ok:problems.length===0,problems};
}
export function composeMetrics(layout,templates=BUILDINGS){
 const valid=validateLayout(layout,templates);
 if(!valid.ok)throw new RangeError('Layout needs review: '+valid.problems.join('; '));
 const counts={courtyard:0,terrace:0,maker:0,garden:0};
 let footprintM2=0,grossFloorAreaM2=0,housingUnits=0,estimatedResidents=0,solarAreaM2=0,greenRoofAreaM2=0,pvAnnualMWh=0,electricAnnualMWh=0,totalStraightLineToStopM=0,maximumStraightLineToStopM=0;
 const buildings=layout.map(item=>{
  const b=templates[item.template],q=calculateBuilding(b),rect=footprint(item,templates);
  counts[item.template]++;
  footprintM2+=q.footprintM2;grossFloorAreaM2+=q.grossFloorAreaM2;
  housingUnits+=q.housingUnits;estimatedResidents+=q.estimatedResidents;solarAreaM2+=q.solarAreaM2;
  greenRoofAreaM2+=q.greenRoofAreaM2;pvAnnualMWh+=q.pvAnnualMWh;electricAnnualMWh+=q.electricAnnualMWh;
  const straightLineToStopM=Math.min(...TRANSIT_STOPS.map(s=>Math.hypot(rect.cx-s.x,rect.cy-s.y)));
  totalStraightLineToStopM+=straightLineToStopM;
  maximumStraightLineToStopM=Math.max(maximumStraightLineToStopM,straightLineToStopM);
  return {id:item.id,template:item.template,position:{col:item.col,row:item.row},rotation:item.rotation,
    footprintM2:q.footprintM2,housingUnits:q.housingUnits,estimatedResidents:q.estimatedResidents,
    grossFloorAreaM2:q.grossFloorAreaM2,straightLineToStopM:round(straightLineToStopM)};
 });
 return{
  buildingCount:layout.length,byType:counts,footprintM2:round(footprintM2),
  conceptualSiteCoveragePct:round(100*footprintM2/CANVAS.areaM2,2),
  grossFloorAreaM2:round(grossFloorAreaM2),housingUnits,estimatedResidents,
  studyAreaHa:36,indicativeResidentsPerHa:round(estimatedResidents/36),
  solarAreaM2:round(solarAreaM2),greenRoofAreaM2:round(greenRoofAreaM2),
  pvAnnualMWh:round(pvAnnualMWh),electricAnnualMWh:round(electricAnnualMWh),
  annualPvMinusUseMWh:round(pvAnnualMWh-electricAnnualMWh),
  domesticWaterMLPerDay:round(estimatedResidents*110/1000000,3),
  averageStraightLineToStopM:layout.length?round(totalStraightLineToStopM/layout.length):0,
  maximumStraightLineToStopM:round(maximumStraightLineToStopM),
  buildings
 };
}
export function seedLayout(districtId='garden',templates=BUILDINGS){
 const choices=[
  [2,1,'courtyard'],[4,1,'terrace'],[5,1,'courtyard'],
  [1,2,'courtyard'],[2,2,'garden'],[4,2,'courtyard'],[5,2,'terrace'],
  [1,4,'terrace'],[2,4,'courtyard'],[4,4,'maker'],[5,4,'courtyard'],
  [2,5,'courtyard'],[4,5,'garden'],[2,6,'terrace'],[4,6,'courtyard']
 ];
 const offset=['west','ridge','east','meadow','garden','river'].indexOf(districtId);
 const list=[];
 for(let i=0;i<choices.length;i++){
  const [col,row,type]=choices[i];
  const template=offset>=0&&i%5===0?['courtyard','terrace','garden','maker'][offset%4]:type;
  const p={id:'example-'+districtId+'-'+(i+1),template,col,row,rotation:0};
  if(validatePlacement(list,p,templates).ok)list.push(p);
 }
 return list;
}
export function districtExport(districtId,layout,templates=BUILDINGS){
 const metrics=composeMetrics(layout,templates);
 return JSON.stringify({
  schema:COMPOSER_SCHEMA,status:'SCHEMATIC / UNPERMITTED / NOT GIS',
  districtId,canvas:CANVAS,gridCentersMeters:CENTERS,
  warnings:[
   'This is an invented 600 × 600 m neighborhood laboratory and cannot be mapped directly into CANOPY Living Atlas.',
   'Prototypes are supplied by the shared City Twin workspace when available; values remain conceptual and unverified.',
   'Reserved schematic zones are not actual setbacks, flood maps, habitats, or legal constraints.',
   'Transit distances are straight-line proxies, not accessible walking routes.',
   'Annual energy totals omit hourly mismatch, lifecycle emissions, export limits and site climate.',
   'Only domestic resident water is estimated; public, commercial, landscape and construction water are excluded.',
   'No utilities, hospitals, schools, sewage, emergency evacuation or affordability calculations are certified.'
  ],
  assumptions:{buildingSeparationM:CANVAS.buildingSeparationM,waterPerResidentLPerDay:110,
    solar:'Inherited Blueprint Studio assumed 19% solar capacity factor and default roof shares',
    occupancy:'Inherited per-building default occupancy and use factors',
    transit:'Three illustrative transit stops along an unverified east-west connection'},
  reservedZones:RESERVED,transitStops:TRANSIT_STOPS,placements:layout,prototypes:templates,metrics
 },null,2);
}
