/**
 * CANOPY Mission Three: conceptual, unpermitted building prototype calculator.
 * Geometry is a rectilinear perimeter block with a voided open-air court.
 * The resulting areas are planning quantities, NOT an architectural schedule.
 */
export const BLUEPRINT_SCHEMA = 'canopy.blueprint.v1';

export const MATERIALS = Object.freeze({
  timber: {
    label: 'Certified timber-hybrid',
    primary: 'Code-compliant mass timber/hybrid frame; noncombustible cores as required',
    envelope: 'High-performance, repairable rainscreen with external shading',
    consideration: 'Fire, acoustics, seismic demands, moisture detailing, sourcing and approvals remain site-specific.'
  },
  mineral: {
    label: 'Low-carbon mineral hybrid',
    primary: 'Code-compliant reinforced concrete or hybrid structure, with verified lower-carbon mix options',
    envelope: 'Durable insulated facade with reversible cladding where feasible',
    consideration: 'Cement mix, reinforcement, foundations, seismic design and environmental product declarations need review.'
  },
  modular: {
    label: 'Modular mixed structure',
    primary: 'Reused or new structural steel and modular infill with verified fire protection',
    envelope: 'Factory-built replaceable facade and service cassettes',
    consideration: 'Transport dimensions, connections, thermal bridges, fire and sound tests need project review.'
  }
});

export const BUILDINGS = Object.freeze({
  courtyard: {
    name: 'Living Courtyard',
    type: 'Mixed-use housing + shared gardens',
    widthM: 60, depthM: 48, courtWidthM: 28, courtDepthM: 22, floors: 6,
    residentialShare: 68, netEfficiency: 76, averageUnitM2: 72, occupancy: 2.15,
    solarRoofShare: 42, greenRoofShare: 28, annualEuiKwhM2: 65,
    floorToFloorM: 3.4, material: 'timber', districtId: 'west',
    note: 'Courtyard-centered housing, shared commons and ground-level neighborhood services.'
  },
  terrace: {
    name: 'Terrace Commons',
    type: 'Housing + civic / cultural spaces',
    widthM: 54, depthM: 42, courtWidthM: 24, courtDepthM: 18, floors: 5,
    residentialShare: 65, netEfficiency: 76, averageUnitM2: 69, occupancy: 2.05,
    solarRoofShare: 40, greenRoofShare: 30, annualEuiKwhM2: 68,
    floorToFloorM: 3.5, material: 'timber', districtId: 'ridge',
    note: 'Stepped communal blocks for walkable services, learning and all-age accessibility.'
  },
  maker: {
    name: 'Circular Works Hall',
    type: 'Repair + production + flexible homes',
    widthM: 72, depthM: 52, courtWidthM: 30, courtDepthM: 22, floors: 4,
    residentialShare: 22, netEfficiency: 70, averageUnitM2: 82, occupancy: 2.0,
    solarRoofShare: 48, greenRoofShare: 22, annualEuiKwhM2: 98,
    floorToFloorM: 4.0, material: 'mineral', districtId: 'meadow',
    note: 'Adaptable maker and repair spaces with accessible community and workforce services.'
  },
  garden: {
    name: 'Garden Forum House',
    type: 'Food education + market + housing',
    widthM: 56, depthM: 46, courtWidthM: 26, courtDepthM: 20, floors: 5,
    residentialShare: 48, netEfficiency: 72, averageUnitM2: 72, occupancy: 2.0,
    solarRoofShare: 34, greenRoofShare: 38, annualEuiKwhM2: 82,
    floorToFloorM: 3.6, material: 'modular', districtId: 'garden',
    note: 'Neighborhood teaching kitchens, growing facilities and market-facing mixed use.'
  }
});

export const FACTORS = Object.freeze({
  panelKwPerM2: 0.20,
  solarCapacityFactor: 0.19,
  hoursYear: 8760,
  minimumRoofReservePct: 15
});

const round = (number, digits=1) => Number(number.toFixed(digits));
const finiteRange = (label, value, lower, upper) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < lower || n > upper) throw new RangeError(label+' must be in ['+lower+', '+upper+']');
  return n;
};

export function calculateBuilding(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Building input required');
  const widthM = finiteRange('Width', input.widthM, 30, 110);
  const depthM = finiteRange('Depth', input.depthM, 28, 85);
  const courtWidthM = finiteRange('Courtyard width', input.courtWidthM, 8, 70);
  const courtDepthM = finiteRange('Courtyard depth', input.courtDepthM, 8, 60);
  const floors = finiteRange('Floors', input.floors, 3, 10);
  if (!Number.isInteger(floors)) throw new RangeError('Floor count must be an integer');
  const residentialShare=finiteRange('Residential share',input.residentialShare,0,100);
  const netEfficiency=finiteRange('Net efficiency',input.netEfficiency,40,95);
  const averageUnitM2=finiteRange('Average unit area',input.averageUnitM2,35,160);
  const occupancy=finiteRange('Average occupancy',input.occupancy,1,6);
  const solarRoofShare=finiteRange('Solar roof share',input.solarRoofShare,0,85);
  const greenRoofShare=finiteRange('Green roof share',input.greenRoofShare,0,85);
  const annualEuiKwhM2=finiteRange('Electric end-use intensity',input.annualEuiKwhM2,20,250);
  const floorToFloorM=finiteRange('Floor-to-floor height',input.floorToFloorM,2.8,6);
  if (!MATERIALS[input.material]) throw new RangeError('Unknown conceptual material system');
  if (courtWidthM >= widthM || courtDepthM >= depthM) throw new RangeError('Courtyard cannot be larger than the block');
  if (solarRoofShare+greenRoofShare > 100-FACTORS.minimumRoofReservePct) throw new RangeError('At least 15% of the roof must remain for access / services');
  const wingWidthM=(widthM-courtWidthM)/2, wingDepthM=(depthM-courtDepthM)/2;
  if (Math.min(wingWidthM,wingDepthM)<7) throw new RangeError('A conceptual minimum 7 m perimeter wing is required');
  const outerAreaM2=widthM*depthM, courtyardAreaM2=courtWidthM*courtDepthM;
  const footprintM2=outerAreaM2-courtyardAreaM2;
  const grossFloorAreaM2=footprintM2*floors;
  const estimatedNetAreaM2=grossFloorAreaM2*netEfficiency/100;
  const residentialNetM2=estimatedNetAreaM2*residentialShare/100;
  const housingUnits=Math.floor(residentialNetM2/averageUnitM2);
  const estimatedResidents=Math.round(housingUnits*occupancy);
  const solarAreaM2=footprintM2*solarRoofShare/100;
  const greenRoofAreaM2=footprintM2*greenRoofShare/100;
  const reservedRoofM2=footprintM2-solarAreaM2-greenRoofAreaM2;
  const pvKWp=solarAreaM2*FACTORS.panelKwPerM2;
  const pvAnnualMWh=pvKWp*FACTORS.hoursYear*FACTORS.solarCapacityFactor/1000;
  const electricAnnualMWh=grossFloorAreaM2*annualEuiKwhM2/1000;
  const referencePvSharePct=electricAnnualMWh>0?pvAnnualMWh/electricAnnualMWh*100:0;
  const checks=[
    {id:'courtyard',state:'concept-review',name:'Open courtyard provision',detail:'Open-to-sky courtyard '+round(courtyardAreaM2)+' m²; microclimate and daylight simulations required'},
    {id:'wing',state:Math.min(wingWidthM,wingDepthM)>16?'design-review':'concept-review',name:'Perimeter wing dimensions',detail:'Width '+round(wingWidthM)+' m and depth '+round(wingDepthM)+' m; not a daylight, ventilation or egress clearance'},
    {id:'roof',state:'concept-review',name:'Roof separation',detail:'Solar '+solarRoofShare+'%, habitat '+greenRoofShare+'%, access/services '+round(100-solarRoofShare-greenRoofShare)+'%'},
    {id:'safety',state:'not-verified',name:'Life safety + accessibility',detail:'Two drawn core markers do not establish code-compliant stairs, elevators, egress, fire or seismic design'},
    {id:'ecology',state:'not-verified',name:'Real parcel + ecological approval',detail:'No lot, foundations, flood limits, habitat survey, water rights or utilities have been approved'}
  ];
  return {
    input: {...input,widthM,depthM,courtWidthM,courtDepthM,floors,material:input.material},
    outerAreaM2:round(outerAreaM2),courtyardAreaM2:round(courtyardAreaM2),footprintM2:round(footprintM2),
    grossFloorAreaM2:round(grossFloorAreaM2),estimatedNetAreaM2:round(estimatedNetAreaM2),
    residentialNetM2:round(residentialNetM2),housingUnits,estimatedResidents,
    wingWidthM:round(wingWidthM),wingDepthM:round(wingDepthM),heightM:round(floors*floorToFloorM),
    solarAreaM2:round(solarAreaM2),greenRoofAreaM2:round(greenRoofAreaM2),reservedRoofM2:round(reservedRoofM2),
    pvKWp:round(pvKWp),pvAnnualMWh:round(pvAnnualMWh),
    electricAnnualMWh:round(electricAnnualMWh),referencePvSharePct:round(referencePvSharePct),
    checks
  };
}
export function blueprintExport(input,planLevel='typical') {
  if (!['ground','typical','roof'].includes(planLevel)) throw new RangeError('Unknown plan level');
  const quantities=calculateBuilding(input);
  return JSON.stringify({
    schema:BLUEPRINT_SCHEMA,status:'CONCEPT DESIGN / NOT FOR CONSTRUCTION',
    coordinateSystem:'local meters only, no georeference and no parcel',
    source:'CANOPY architectural concept, Mission Three Blueprint Studio',
    assumptions:{...FACTORS,
      grossFloorArea:'(outer rectangle area minus central open court) multiplied by floor count',
      residentialUnits:'floor(gross floor area × net efficiency × residential share / typical unit net area)',
      roofAreas:'PV and ecological roof shares refer to footprint roof area; minimum 15% reserved for access/services',
      solar:'PV area × 0.20 kWp/m2 × 8760 h × 19% assumed capacity factor; no site irradiance or equipment loss study',
      electricity:'gross floor area × assumed annual electric end-use kWh/m2; not a thermal load or energy code compliance result',
      lifeSafety:'Core markers, circulation and distances are illustrative, not reviewed egress or accessibility geometry'},
    planLevel,material:MATERIALS[input.material],building:quantities
  },null,2);
}
