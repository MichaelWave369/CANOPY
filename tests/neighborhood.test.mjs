import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS} from '../src/blueprint.js';
import {seedLayout,validateLayout,composeMetrics} from '../src/district.js';
import {NEIGHBORHOOD_SCHEMA,GRID_M,SERVICES,TARGETS,DEFAULT_CAPACITY,UNIT_RANGES,
 isWalkableNode,nearestWalkNode,routeBetween,routesForBuilding,evaluateServices,
 evaluateCosts,evaluateNeighborhood,neighborhoodExport} from '../src/neighborhood.js';

const near=(a,b,e=.0001)=>assert.ok(Math.abs(a-b)<=e,'Expected '+a+' near '+b);

test('reference network has 20m grid, service nodes, and clear un-gis status',()=>{
 assert.equal(GRID_M,20);
 assert.equal(SERVICES.length,4);
 assert.equal(TARGETS.length,7);
 assert.equal(NEIGHBORHOOD_SCHEMA,'canopy.neighborhood.v1');
 assert.ok(UNIT_RANGES.buildingLowUsdM2<UNIT_RANGES.buildingHighUsdM2);
});

test('protected woodlands, wetlands, food area, greenway and transit are excluded',()=>{
 assert.equal(isWalkableNode(60,60),false);
 assert.equal(isWalkableNode(540,540),false);
 assert.equal(isWalkableNode(100,520),false);
 assert.equal(isWalkableNode(540,200),false);
 assert.equal(isWalkableNode(180,300),false);
 assert.equal(isWalkableNode(100,300),true);
 assert.equal(isWalkableNode(300,300),true);
 assert.equal(isWalkableNode(500,300),true);
 assert.equal(isWalkableNode(200,200),true);
});

test('a conceptual route uses connected walkable grid nodes, not Euclidean shortcuts',()=>{
 const result=routeBetween({x:220,y:220},{x:420,y:220},[]);
 assert.equal(result.reachable,true);
 assert.equal(result.routeM,200);
 assert.equal(result.path[0].x,220);
 for(const p of result.path.slice(1,-1))assert.equal(isWalkableNode(p.x,p.y),true);
 assert.match(result.disclaimer,/not a constructed/);
});

test('paths do not use building interiors and connectors are reported',()=>{
 const b={id:'one',template:'courtyard',col:2,row:1,rotation:0};
 const r=routeBetween({x:220,y:140},{x:180,y:260},[b]);
 assert.equal(r.reachable,true);
 assert.ok(r.routeM>0);
 assert.ok(r.connectionM>0);
 for(const p of r.path.slice(1,-1))assert.equal(isWalkableNode(p.x,p.y,[b]),true);
 assert.throws(()=>routeBetween({x:220,y:140},{x:180,y:260},[{...b,col:20}]),RangeError);
});

test('route summaries include three stops, four services and selected destinations',()=>{
 const layout=seedLayout('garden');
 assert.equal(validateLayout(layout).ok,true);
 const route=routesForBuilding(layout[0],layout);
 assert.equal(route.services.length,4);
 assert.equal(route.all.length,7);
 assert.ok(route.connectedStops>=0&&route.connectedStops<=3);
});

test('service demand calculations surface shortfalls instead of pretending they are staffed',()=>{
 const r=evaluateServices(1000,{...DEFAULT_CAPACITY,schoolSeats:50,clinicVisitsPerYear:100,publicRoomSeats:20});
 assert.equal(r.school.required,130);
 assert.equal(r.school.gap,80);
 assert.equal(r.clinic.required,2800);
 assert.equal(r.clinic.gap,2700);
 assert.equal(r.publicRoom.required,60);
 assert.equal(r.publicRoom.gap,40);
 assert.throws(()=>evaluateServices(1000,{...DEFAULT_CAPACITY,schoolSeats:-2}),RangeError);
});

test('district population and building totals come from existing composer model',()=>{
 const layout=seedLayout('west'),a=evaluateNeighborhood(layout),b=composeMetrics(layout);
 assert.equal(a.metrics.estimatedResidents,b.estimatedResidents);
 assert.equal(a.metrics.housingUnits,b.housingUnits);
 assert.equal(a.routes.length,layout.length);
 assert.equal(a.pedestrian.totalBuildings,layout.length);
 assert.ok(a.pedestrian.within400m<=a.pedestrian.buildingsWithRoutedStop);
 assert.ok(a.pedestrian.buildingsWithRoutedStop<=layout.length);
 assert.ok(a.emergency.axisDistanceMaxM>=0);
 assert.equal(a.services.school.required,Math.ceil(b.estimatedResidents*.13));
});

test('cost bounds increase with area and multiplier and include three auditable phases',()=>{
 const layout=seedLayout('garden');
 const costs=evaluateCosts(layout);
 assert.ok(costs.highUsd>costs.lowUsd);
 assert.equal(costs.phases.length,3);
 assert.equal(costs.phases.reduce((n,p)=>n+p.buildings,0),layout.length);
 assert.equal(costs.phases.reduce((n,p)=>n+p.estimatedResidents,0),composeMetrics(layout).estimatedResidents);
 const low=evaluateCosts(layout,{...DEFAULT_CAPACITY,constructionMultiplier:.5});
 const high=evaluateCosts(layout,{...DEFAULT_CAPACITY,constructionMultiplier:2});
 assert.ok(low.lowUsd<costs.lowUsd);
 assert.ok(high.highUsd>costs.highUsd);
 assert.ok(costs.phases.every(p=>p.lowUsd<=p.highUsd));
 assert.throws(()=>evaluateCosts(layout,{...DEFAULT_CAPACITY,constructionMultiplier:Infinity}),RangeError);
});

test('empty neighborhood is safe, with no invented population, routes or demands',()=>{
 const a=evaluateNeighborhood([]);
 assert.equal(a.metrics.estimatedResidents,0);
 assert.equal(a.pedestrian.totalBuildings,0);
 assert.equal(a.routes.length,0);
 assert.equal(a.pedestrian.maxToStopM,null);
 assert.equal(a.services.school.required,0);
 assert.equal(a.costs.phases.reduce((n,p)=>n+p.buildings,0),0);
});

test('export records sources, boundary disclaimers and all scenario assumptions',()=>{
 const layout=seedLayout('ridge'),data=JSON.parse(neighborhoodExport('ridge',layout));
 assert.equal(data.schema,NEIGHBORHOOD_SCHEMA);
 assert.match(data.status,/NOT GIS/);
 assert.match(data.status,/NOT FOR CONSTRUCTION/);
 assert.equal(data.methodology.gridSpacingM,GRID_M);
 assert.equal(data.result.routes.length,layout.length);
 assert.equal(data.result.costs.inputs.networkLinearMeters,1200);
 assert.match(data.result.costs.limitations,/NO quotes/);
 assert.match(data.result.pedestrian.note,/No slopes/);
});

test('all four existing architectural prototypes remain usable',()=>{
 assert.equal(Object.keys(BUILDINGS).length,4);
 for(const k of Object.keys(BUILDINGS)){
  assert.ok(BUILDINGS[k].grossFloorAreaM2===undefined);
  assert.ok(BUILDINGS[k].floors>=4);
 }
 assert.equal(nearestWalkNode({x:260,y:180})?.x>=20,true);
 assert.throws(()=>nearestWalkNode({x:NaN,y:180}),RangeError);
});
