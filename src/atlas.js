import {DISTRICTS,LAND_USE} from './model.js';

/** Ungrounded schematic coordinates, not surveyed geography or legal design constraints. */
export const ATLAS_SCHEMA='canopy.atlas.v1';
export const SITE=Object.freeze({widthKm:4,heightKm:3,areaKm2:12,units:'normalized x/y percentage, (0,0) at northwest',status:'ILLUSTRATIVE / UNGEOREFERENCED'});
export const SETBACKS=Object.freeze({min:40,max:320,step:20,reference:120});
export const RIVER_HALF_WIDTH_PCT=2.4;
export const HABITAT=Object.freeze([
  {id:'northwest-woodland',name:'Upland woodland',x:20,y:9,rx:24,ry:15},
  {id:'northeast-woodland',name:'Eastern woodland',x:91,y:9,rx:15,ry:14},
  {id:'southwest-habitat',name:'Southern restoration edge',x:6,y:92,rx:16,ry:10}
]);
export const WETLANDS=Object.freeze([
  {id:'southern-wetland',name:'Wetland restoration cell',x:75,y:93,rx:16,ry:11}
]);
export const FARMS=Object.freeze([
  {id:'west-farm',x:7,y:46,width:22,height:11},
  {id:'east-farm',x:81,y:49,width:16,height:14},
  {id:'south-farm',x:22,y:88,width:20,height:9},
  {id:'north-farm',x:77,y:4,width:18,height:8}
]);
export const TRANSIT=Object.freeze([
  [[17.5,28],[41,23],[84,28]],
  [[17.5,28],[15.7,76.5],[40.7,68],[85,76],[84,28]],
  [[41,23],[40.7,68]]
]);
export function riverCenterX(y){
  const clamped=Math.max(0,Math.min(100,Number(y)));
  return 58.5+2.3*Math.sin(Math.PI*2*(clamped+6)/100);
}
export function metersToPercentX(meters){
  if(!Number.isFinite(meters)||meters<0)throw new RangeError('Setback must be nonnegative and finite.');
  return meters/(SITE.widthKm*1000)*100;
}
export function riparianHalfWidthPct(setbackMeters=SETBACKS.reference){
  return RIVER_HALF_WIDTH_PCT+metersToPercentX(setbackMeters);
}
export function insideEllipse(x,y,area){
  return Math.pow((x-area.x)/area.rx,2)+Math.pow((y-area.y)/area.ry,2)<=1;
}
export function classifyPoint(x,y,setbackMeters=SETBACKS.reference){
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Coordinates must be finite.');
  const region=HABITAT.find(a=>insideEllipse(x,y,a));
  if(region)return{class:'excluded',reason:'habitat',zone:region.id};
  const wetland=WETLANDS.find(a=>insideEllipse(x,y,a));
  if(wetland)return{class:'excluded',reason:'wetland',zone:wetland.id};
  const dx=Math.abs(x-riverCenterX(y));
  const halfWidth=riparianHalfWidthPct(setbackMeters);
  if(dx<=halfWidth)return{class:'excluded',reason:'riparian',zone:'river-reserve'};
  // Schematic river-edge review belt, NOT an actual flood hazard map.
  if(dx<=halfWidth+metersToPercentX(140))return{class:'review',reason:'river-edge',zone:'unverified-river-review-belt'};
  return{class:'unmapped',reason:'not-assessed',zone:null};
}
function sampleFootprint(d,radius=9){
  const points=[{x:d.x,y:d.y}];
  for(const rad of [.35,.7,1])for(let i=0;i<36;i++){
    const angle=i*2*Math.PI/36;
    // A round district footprint in physical length is scaled in plot axes.
    points.push({x:d.x+radius*rad*Math.cos(angle),y:d.y+radius*rad*(SITE.widthKm/SITE.heightKm)*Math.sin(angle)});
  }
  return points;
}
export function assessDistrict(d,setbackMeters=SETBACKS.reference){
  const sample=sampleFootprint(d),results=sample.map(p=>classifyPoint(p.x,p.y,setbackMeters));
  const conflicts=results.filter(r=>r.class==='excluded'),cautions=results.filter(r=>r.class==='review');
  return{id:d.id,name:d.name,
    status:conflicts.length?'review-overlap':cautions.length?'proximity-review':'not-flagged',
    exclusionSamples:conflicts.length,reviewSamples:cautions.length,totalSamples:results.length,
    flaggedReasons:[...new Set(conflicts.map(r=>r.reason))]};
}
export function estimateAtlas(setbackMeters=SETBACKS.reference){
  let excluded=0,review=0,unmapped=0;
  for(let y=.5;y<100;y++)for(let x=.5;x<100;x++){
    const type=classifyPoint(x,y,setbackMeters).class;
    if(type==='excluded')excluded++;
    else if(type==='review')review++;
    else unmapped++;
  }
  const total=excluded+review+unmapped,districts=DISTRICTS.map(d=>assessDistrict(d,setbackMeters));
  return{setbackMeters,excludedPct:+(excluded/total*100).toFixed(1),
    reviewPct:+(review/total*100).toFixed(1),
    unmappedPct:+(unmapped/total*100).toFixed(1),
    schematicExclusionKm2:+(excluded/total*SITE.areaKm2).toFixed(2),
    districts,overlapReviewCount:districts.filter(d=>d.status==='review-overlap').length};
}
export function riverPath(halfWidthPct){
  if(!Number.isFinite(halfWidthPct)||halfWidthPct<0)throw new RangeError('Invalid river half-width');
  const ys=Array.from({length:51},(_,i)=>i*2);
  const left=ys.map(y=>[riverCenterX(y)-halfWidthPct,y]);
  const right=[...ys].reverse().map(y=>[riverCenterX(y)+halfWidthPct,y]);
  return 'M'+[...left,...right].map(([x,y])=>(x*10).toFixed(2)+','+(y*7).toFixed(2)).join(' L')+' Z';
}
export function atlasExport(setbackMeters=SETBACKS.reference){
  const report=estimateAtlas(setbackMeters);
  return JSON.stringify({
    schema:ATLAS_SCHEMA,status:'SCHEMATIC / NOT REAL GIS',
    disclaimer:'Normalized illustrative zones only. Do not use for permitting, siting, safety, parcel selection or ecological determination.',
    coordinateSystem:{...SITE},
    methodology:{riparianSetbackMeters:setbackMeters,riverHalfWidthPercent:RIVER_HALF_WIDTH_PCT,
      bufferAxis:'horizontal percent width; illustrative only, not true perpendicular geodesic distance',
      footprintSampling:'District schematic area tested by 109 equally weighted points, not actual parcel footprints',
      raster:'100 x 100 sample cells; category area is approximate',
      hazards:'No terrain, flood elevations, rainfall, wildfire model, migration inventories or legal setbacks'},
    conceptualLandBudget:LAND_USE.map(l=>({name:l.name,percent:l.percent,areaKm2:l.area})),
    zones:{habitat:HABITAT,wetlands:WETLANDS,farms:FARMS,transit:TRANSIT},
    result:report
  },null,2);
}
