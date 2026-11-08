import {DISTRICTS} from './model.js';
import {ENERGY_DEFAULTS,WATER_DEFAULTS,simulateEnergy,simulateWater} from './scenario.js';
import {seedLayout,validateLayout,composeMetrics} from './district.js';

export const WORKSPACE_SCHEMA='canopy.workspace.v1';
export const STORAGE_KEY='canopy:scenario-workspace:v1';
export const HISTORY_LIMIT=20;
export const MAX_IMPORT_CHARS=1024*1024;
export const WORKSPACE_STATUS='SYNTHETIC / UNVERIFIED / NOT FOR CONSTRUCTION';

const ENERGY_LIMITS=Object.freeze({
 solarMW:[0,240],windMW:[0,100],batteryMWh:[0,3000],
 demandReductionPct:[0,60],criticalLoadMW:[.1,50]
});
const WATER_LIMITS=Object.freeze({
 conservationPct:[0,60],greywaterPct:[0,70],treatmentRecoveryPct:[0,95],
 treatmentCapacityML:[0,15],eligibleNonpotablePct:[0,60],availableFreshML:[0,15]
});
const DISTRICT_IDS=DISTRICTS.map(d=>d.id);
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const clone=value=>JSON.parse(JSON.stringify(value));
function checkFields(target,schema,name){
 if(!isRecord(target))throw new TypeError(name+' must be an object');
 const keys=Object.keys(target),expected=Object.keys(schema);
 if(keys.length!==expected.length||keys.some(k=>!Object.hasOwn(schema,k)))throw new RangeError(name+' has missing or extra parameters');
 for(const [key,[min,max]] of Object.entries(schema)){
  if(typeof target[key]!=='number'||!Number.isFinite(target[key])||target[key]<min||target[key]>max)throw new RangeError(name+'.'+key+' is outside supported model limits');
 }
}
export function referenceSnapshot(){
 return{
  energy:{...ENERGY_DEFAULTS},
  water:{...WATER_DEFAULTS},
  districtId:'garden',
  layouts:Object.fromEntries(DISTRICTS.map(d=>[d.id,seedLayout(d.id)]))
 };
}
export function validateSnapshot(snapshot){
 if(!isRecord(snapshot))throw new TypeError('Scenario snapshot must be an object');
 const fields=['energy','water','districtId','layouts'];
 if(Object.keys(snapshot).length!==fields.length||fields.some(k=>!Object.hasOwn(snapshot,k)))throw new RangeError('Snapshot keys are missing or unexpected');
 checkFields(snapshot.energy,ENERGY_LIMITS,'Energy');
 checkFields(snapshot.water,WATER_LIMITS,'Water');
 if(!DISTRICT_IDS.includes(snapshot.districtId))throw new RangeError('Unknown selected district');
 if(!isRecord(snapshot.layouts)||Object.keys(snapshot.layouts).length!==DISTRICT_IDS.length||
    Object.keys(snapshot.layouts).some(id=>!DISTRICT_IDS.includes(id)))throw new RangeError('Layouts must include the six canonical districts');
 for(const id of DISTRICT_IDS){
  const layout=snapshot.layouts[id];
  if(!Array.isArray(layout)||layout.length>49)throw new RangeError('Invalid building inventory for '+id);
  for(const item of layout){
   if(!isRecord(item)||Object.keys(item).length!==5||
      ['id','template','col','row','rotation'].some(k=>!Object.hasOwn(item,k)))throw new RangeError('Malformed building entry in '+id);
   if(typeof item.id!=='string'||!item.id||item.id.length>100)throw new RangeError('Building IDs must be nonempty strings shorter than 101 characters');
  }
  const assessment=validateLayout(layout);
  if(!assessment.ok)throw new RangeError('Invalid '+id+' layout: '+assessment.problems.slice(0,3).join('; '));
 }
 // All model inputs and District Composer placement constraints were validated above.
 return true;
}
export function createWorkspace(){
 const snapshot=referenceSnapshot();
 validateSnapshot(snapshot);
 return {schema:WORKSPACE_SCHEMA,status:WORKSPACE_STATUS,cursor:0,nextRevision:1,
  history:[{revision:0,label:'Canonical reference',snapshot}]};
}
export function activeRevision(workspace){
 return workspace.history[workspace.cursor];
}
export function validateWorkspace(workspace){
 if(!isRecord(workspace))throw new TypeError('Workspace must be an object');
 if(workspace.schema!==WORKSPACE_SCHEMA||workspace.status!==WORKSPACE_STATUS)throw new RangeError('Unrecognized or unsafe workspace schema/status');
 if(Object.keys(workspace).length!==5||['schema','status','cursor','nextRevision','history'].some(k=>!Object.hasOwn(workspace,k)))throw new RangeError('Unexpected workspace fields');
 if(!Number.isSafeInteger(workspace.cursor)||!Number.isSafeInteger(workspace.nextRevision))throw new RangeError('Invalid revision counters');
 if(!Array.isArray(workspace.history)||!workspace.history.length||workspace.history.length>HISTORY_LIMIT)throw new RangeError('Invalid history size');
 if(workspace.cursor<0||workspace.cursor>=workspace.history.length||workspace.nextRevision<1)throw new RangeError('History pointer out of range');
 let last=-1;
 for(const r of workspace.history){
  if(!isRecord(r)||Object.keys(r).length!==3||['revision','label','snapshot'].some(k=>!Object.hasOwn(r,k))||!Number.isSafeInteger(r.revision)||r.revision<=last||r.revision<0||
    typeof r.label!=='string'||!r.label.trim()||r.label.length>90)throw new RangeError('Invalid or nonmonotonic revision record');
  validateSnapshot(r.snapshot);
  last=r.revision;
 }
 if(workspace.nextRevision<=last)throw new RangeError('Revision sequence can be overwritten');
 return true;
}
export function commitWorkspace(workspace,newSnapshot,label){
 validateWorkspace(workspace);
 validateSnapshot(newSnapshot);
 if(typeof label!=='string'||!label.trim()||label.length>90)throw new RangeError('Revision label required');
 const current=activeRevision(workspace).snapshot;
 if(JSON.stringify(current)===JSON.stringify(newSnapshot))return workspace;
 let history=workspace.history.slice(0,workspace.cursor+1);
 history.push({revision:workspace.nextRevision,label:label.trim(),snapshot:clone(newSnapshot)});
 if(history.length>HISTORY_LIMIT)history=history.slice(-HISTORY_LIMIT);
 return {schema:WORKSPACE_SCHEMA,status:WORKSPACE_STATUS,cursor:history.length-1,
  nextRevision:workspace.nextRevision+1,history};
}
export function selectWorkspaceRevision(workspace,index){
 validateWorkspace(workspace);
 if(!Number.isInteger(index)||index<0||index>=workspace.history.length)throw new RangeError('Unknown history position');
 return index===workspace.cursor?workspace:{...workspace,cursor:index};
}
export function moveWorkspaceCursor(workspace,direction){
 validateWorkspace(workspace);
 if(![-1,1].includes(direction))throw new RangeError('Only undo/redo are supported');
 const cursor=Math.min(workspace.history.length-1,Math.max(0,workspace.cursor+direction));
 return cursor===workspace.cursor?workspace:{...workspace,cursor};
}
export function serializeWorkspace(workspace){
 validateWorkspace(workspace);
 return JSON.stringify({...workspace,disclaimer:'Synthetic local planning inputs only. NO site verification, engineering approvals, safety certification or official permits.'},null,2);
}
export function parseWorkspace(text){
 if(typeof text!=='string'||text.length>MAX_IMPORT_CHARS||text.length===0)throw new RangeError('Workspace file empty or exceeds 1 MB');
 const data=JSON.parse(text);
 if(!isRecord(data))throw new TypeError('Workspace file must be an object');
 const {disclaimer,...candidate}=data;
 validateWorkspace(candidate);
 // Do not trust prototypes or extra fields from external JSON; re-encode validated known fields.
 return clone(candidate);
}
export function compareSnapshots(reference,current){
 validateSnapshot(reference);validateSnapshot(current);
 const e0=simulateEnergy(reference.energy),e1=simulateEnergy(current.energy);
 const w0=simulateWater(reference.water),w1=simulateWater(current.water);
 const id=current.districtId;
 const d0=composeMetrics(reference.layouts[id]),d1=composeMetrics(current.layouts[id]);
 const n=(key,before,after,unit)=>({key,before,after,delta:Number((after-before).toFixed(3)),unit});
 return {
  districtId:id,
  metrics:[
   n('Annual electric demand',e0.annualDemandGWh,e1.annualDemandGWh,'GWh'),
   n('Grid import requirement',e0.gridImportGWh,e1.gridImportGWh,'GWh'),
   n('Annual renewable generation',e0.generationGWh,e1.generationGWh,'GWh'),
   n('Freshwater requirement',w0.freshwaterRequiredML,w1.freshwaterRequiredML,'ML/day'),
   n('Potential reclaimed water',w0.reclaimedML,w1.reclaimedML,'ML/day'),
   n('Buildings in selected district',d0.buildingCount,d1.buildingCount,'buildings'),
   n('Residents in selected district',d0.estimatedResidents,d1.estimatedResidents,'people'),
   n('District rooftop PV',d0.pvAnnualMWh,d1.pvAnnualMWh,'MWh/year')
  ],
  disclaimer:'Deterministic comparisons of synthetic model outputs. Neither snapshot is a measured site or an approved design.'
 };
}
