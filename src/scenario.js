/** Synthetic planning inputs, not a site-specific engineering forecast. */
export const ENERGY_DEFAULTS=Object.freeze({solarMW:105,windMW:25,batteryMWh:500,demandReductionPct:0,criticalLoadMW:5});
export const WATER_DEFAULTS=Object.freeze({conservationPct:10,greywaterPct:45,treatmentRecoveryPct:80,treatmentCapacityML:3,eligibleNonpotablePct:35,availableFreshML:6});
export const ENERGY_PRESETS=Object.freeze({
  baseline:{label:'Reference',...ENERGY_DEFAULTS},
  lean:{label:'Passive-first',solarMW:105,windMW:25,batteryMWh:650,demandReductionPct:25,criticalLoadMW:5},
  stress:{label:'Low supply',solarMW:65,windMW:10,batteryMWh:250,demandReductionPct:0,criticalLoadMW:5}
});
export const WATER_PRESETS=Object.freeze({
  baseline:{label:'Reference',...WATER_DEFAULTS},
  conservation:{label:'Conserve',...WATER_DEFAULTS,conservationPct:30,treatmentCapacityML:3.5},
  drought:{label:'Drought',...WATER_DEFAULTS,availableFreshML:3}
});
const MONTHS=[['Jan',31],['Feb',28],['Mar',31],['Apr',30],['May',31],['Jun',30],['Jul',31],['Aug',31],['Sep',30],['Oct',31],['Nov',30],['Dec',31]];
const HOURS=365*24,BASE_LOAD_MWH=240000,SOLAR_CF=.19,WIND_CF=.30,STORAGE_EFF=Math.sqrt(.86);
const round=(x,n=1)=>Number(x.toFixed(n));
function bound(v,min,max){const n=Number(v);if(!Number.isFinite(n))throw new RangeError('All scenario values must be finite.');return Math.max(min,Math.min(max,n));}
function solarWeight(day,hour){const daylight=12+4*Math.cos(2*Math.PI*(day-172)/365),start=12-daylight/2,t=(hour-start)/daylight;return t>0&&t<1?Math.sin(Math.PI*t)*(1+.16*Math.cos(2*Math.PI*(day-172)/365)):0;}
function windWeight(day,hour){return 1+.22*Math.cos(2*Math.PI*(day-15)/365)+.18*Math.cos(2*Math.PI*(hour-2)/24)+.10*Math.sin(2*Math.PI*day/29);}
function demandWeight(day,hour){return 1+.18*Math.cos(2*Math.PI*(hour-19)/24)+.10*Math.cos(2*Math.PI*(day-8)/365);}
const SHAPES=(()=>{const solar=new Float64Array(HOURS),wind=new Float64Array(HOURS),demand=new Float64Array(HOURS);let solarTotal=0,windTotal=0,demandTotal=0;for(let day=0;day<365;day++)for(let hour=0;hour<24;hour++){const i=day*24+hour;solar[i]=solarWeight(day,hour);wind[i]=windWeight(day,hour);demand[i]=demandWeight(day,hour);solarTotal+=solar[i];windTotal+=wind[i];demandTotal+=demand[i];}return{solar,wind,demand,solarTotal,windTotal,demandTotal};})();
export function simulateEnergy(input=ENERGY_DEFAULTS){
  const solarMW=bound(input.solarMW??105,0,240),windMW=bound(input.windMW??25,0,100),batteryMWh=bound(input.batteryMWh??500,0,3000),demandReductionPct=bound(input.demandReductionPct??0,0,60),criticalLoadMW=bound(input.criticalLoadMW??5,.1,50);
  const demandMWh=BASE_LOAD_MWH*(1-demandReductionPct/100),solarMWh=solarMW*HOURS*SOLAR_CF,windMWh=windMW*HOURS*WIND_CF;
  const monthly=MONTHS.map(([name])=>({name,demandMWh:0,generationMWh:0,importedMWh:0,surplusMWh:0}));
  let month=0,endDay=MONTHS[0][1],soc=0,imported=0,surplus=0,charged=0,discharged=0,losses=0,peakGridImportMW=0;
  const powerMW=batteryMWh/4;
  for(let i=0;i<HOURS;i++){
    const day=Math.floor(i/24);
    if(day>=endDay){month++;endDay+=MONTHS[month][1];}
    const solar=solarMWh*SHAPES.solar[i]/SHAPES.solarTotal,wind=windMWh*SHAPES.wind[i]/SHAPES.windTotal;
    const gen=solar+wind,load=demandMWh*SHAPES.demand[i]/SHAPES.demandTotal;
    monthly[month].generationMWh+=gen;monthly[month].demandMWh+=load;
    if(gen>=load){
      const extra=gen-load,charge=Math.min(extra,powerMW,(batteryMWh-soc)/STORAGE_EFF);
      soc+=charge*STORAGE_EFF;charged+=charge;losses+=charge*(1-STORAGE_EFF);
      const excess=extra-charge;surplus+=excess;monthly[month].surplusMWh+=excess;
    }else{
      const deficit=load-gen,discharge=Math.min(deficit,powerMW,soc*STORAGE_EFF);
      soc-=discharge/STORAGE_EFF;discharged+=discharge;losses+=discharge*(1/STORAGE_EFF-1);
      const need=deficit-discharge;imported+=need;peakGridImportMW=Math.max(peakGridImportMW,need);monthly[month].importedMWh+=need;
    }
  }
  return{
    inputs:{solarMW,windMW,batteryMWh,demandReductionPct,criticalLoadMW},
    annualDemandGWh:round(demandMWh/1000,2),generationGWh:round((solarMWh+windMWh)/1000,2),
    localSharePct:round((demandMWh-imported)*100/demandMWh),
    gridImportGWh:round(imported/1000,2),possibleSurplusGWh:round(surplus/1000,2),
    batteryLossGWh:round(losses/1000,3),batteryChargedGWh:round(charged/1000,3),batteryDischargedGWh:round(discharged/1000,3),
    finalStorageMWh:round(soc,2),peakGridImportMW:round(peakGridImportMW,2),
    potentialCriticalHours:round(.8*batteryMWh*STORAGE_EFF/criticalLoadMW),
    balanceErrorMWh:solarMWh+windMWh+imported-demandMWh-surplus-losses-soc,
    monthly:monthly.map(m=>({name:m.name,demandGWh:round(m.demandMWh/1000,2),generationGWh:round(m.generationMWh/1000,2),gridImportGWh:round(m.importedMWh/1000,2),possibleSurplusGWh:round(m.surplusMWh/1000,2)}))
  };
}
export function simulateWater(input=WATER_DEFAULTS){
  const conservationPct=bound(input.conservationPct??10,0,60),greywaterPct=bound(input.greywaterPct??45,0,70),treatmentRecoveryPct=bound(input.treatmentRecoveryPct??80,0,95),treatmentCapacityML=bound(input.treatmentCapacityML??3,0,15),eligibleNonpotablePct=bound(input.eligibleNonpotablePct??35,0,60),availableFreshML=bound(input.availableFreshML??6,0,15);
  const grossUseML=8*(1-conservationPct/100),greywaterProducedML=grossUseML*greywaterPct/100,eligibleReuseML=grossUseML*eligibleNonpotablePct/100;
  const reclaimedML=Math.min(greywaterProducedML*treatmentRecoveryPct/100,treatmentCapacityML,eligibleReuseML);
  const freshwaterRequiredML=grossUseML-reclaimedML,waterGapML=Math.max(0,freshwaterRequiredML-availableFreshML);
  return{
    inputs:{conservationPct,greywaterPct,treatmentRecoveryPct,treatmentCapacityML,eligibleNonpotablePct,availableFreshML},
    grossUseML:round(grossUseML,3),greywaterProducedML:round(greywaterProducedML,3),reclaimedML:round(reclaimedML,3),
    freshwaterRequiredML:round(freshwaterRequiredML,3),hypotheticalWaterGapML:round(waterGapML,3),
    shareSuppliedByReusePct:grossUseML?round(reclaimedML/grossUseML*100):0,
    raw:{grossUseML,greywaterProducedML,reclaimedML,freshwaterRequiredML,waterGapML}
  };
}
export function scenarioExport(energyInput,waterInput){
  return JSON.stringify({
    schema:'canopy.scenario.v1',status:'SYNTHETIC_PLANNING_EXERCISE',
    assumptions:{
      referenceAreaKm2:12,referencePopulation:60000,baselineElectricityGWh:240,
      solarCapacityFactor:SOLAR_CF,windCapacityFactor:WIND_CF,storageRoundtripEfficiency:.86,
      baselineWaterMLPerDay:8,profile:'deterministic synthetic 365-day non-site-specific hourly profile',
      gridRole:'all deficits imported; remaining surplus is potential export or curtailment',
      waterScope:'steady-state hypothetical non-potable reuse, not regulatory water rights or treatment certification'
    },
    energy:simulateEnergy(energyInput),water:simulateWater(waterInput)
  },null,2);
}
