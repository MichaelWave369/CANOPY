# CANOPY Mission Five | The Living Neighborhood

**STATUS: FICTIONAL CONCEPT. NO ACTUAL NEIGHBORHOOD, VERIFIED SERVICE, APPROVED ROUTE, COST BID OR GIS DATA.**

Mission Five extends the six-context District Composer with a synthetic walking network, demand-versus-capacity checks for communal facilities, an emergency-spine-distance warning, and a sensitivity-only capital phasing model. All of these computations use the current **600 × 600 m fictional neighborhood** and its four fixed Blueprint Studio building archetypes.

## Pedestrian routing: 20 m local grid

- Local X/Y coordinates, 20 m spacing from 20 through 580 m. Cardinal (four-way) steps only. No diagonal jumps.
- Buildings and schematic protected habitat/food zones are impassable in the network.
- A fictional east/west transit/emergency avenue at Y=283–317 m is crossed only at X=100, 300 or 500 m, with stops at each point. Those crossings are presumed markers, **not designed or safety-audited intersections**.
- Civil commons and the north/south walkway are traversable in the schematic.
- School at (180,260), clinic (420,260), food hub (220,420), and civic commons (300,260) are **candidate service reference points**, not reserved or approved built facilities.
- Building doors and service entries are NOT designed; the nearest passable grid node is connected using a straight segment. Endpoints with an entry gap longer than 90 m are treated as unreachable.
- Shortest paths are found with breadth-first search over the 20 m four-direction graph. Output is 20 m per traversed edge plus the two schematic, unverified access legs. The dashed and colored visual is not a sidewalk or geotechnical map.
- Each building is evaluated to the three transit stations and four service references. The nearest reachable transit stop and the number with routes of **400 m or less** are reported as an exploratory metric.

### What this does NOT prove

No surveyed sidewalks, gates, gradients, curb ramps, doors, safe crossings, surface quality, wheelchair accessibility, transit operations, route security, flood/heat exposure or travel time. A 400 m target is a hypothesis, not a statutory accessibility threshold. Some routes may be geometrically connected on the grid but physically impossible in the real world.

## Emergency access warning

The model reports the largest direct distance between a building envelope and either the X=300 or Y=300 **illustrative centerline**. This is a simple spatial indicator, *not* the distance along a drivable road, fire apparatus access, maximum hose lay, turning radius, ladder reach, vehicle loading, evacuation distance, water supply, emergency response time, or permit determination. A value below a threshold is never a certification.

## Service demand, not provision

Default editable scenario capacities:

| Service | Demand formula | Example planned capacity |
| --- | --- | --- |
| School seats | Residents × 0.13, rounded up | 180 seats |
| Clinic appointments/year | Residents × 2.8, rounded up | 4,500 visits/year |
| Community gathering room seats | Residents × 0.06, rounded up | 140 seats |

The output shows the greater of zero or **calculated demand minus user-selected hypothetical capacity**. These ratios aren't demographic studies, approved school or healthcare standards, occupancy classifications, staffing plans, funding commitments, or evidence those facilities exist. Site-specific census/school-age/clinical data and local service providers must validate all inputs.

## Hypothetical development costs

**Every USD unit rate below is a placeholder for testing scenarios, not a verified 2026 market estimate, supplier quote, pro forma, or feasibility result.** The model supports an adjustable construction-cost factor from 0.5× to 2×.

| Component | Low assumption | High assumption |
| --- | ---: | ---: |
| Building construction (gross floor area) | $2,900/m² | $5,400/m² |
| Linear district infrastructure | $2,200/m | $9,000/m |
| Improved public realm/restoration | $55/m² | $175/m² |
| Shared services allowance | $6,000/resident | $18,000/resident |
| Contingency | 15% | 30% |

Additional assumed quantities: 1,200 m of district linear network, 35,000 m² of improved communal/public-realm landscape, and building gross floor areas/housing counts inherited from Blueprint Studio. These areas are not parcel take-offs; protected habitat is not presumed to need paid landscaping.

Illustrative total:

    low = (gross floor area × 2900 + network length × 2200
          + 35,000 × 55 + residents × 6000) × cost factor × 1.15
    high = (gross floor area × 5400 + network length × 9000
           + 35,000 × 175 + residents × 18000) × cost factor × 1.30

Phases 1, 2 and 3 are arbitrary allocations of every third building by **insertion order**, not engineered project sequencing. Shared infrastructure/public realm is split 50%, 30%, 20% respectively. This is a transparent scenario partition, not a contractor or capital delivery plan.

**Excluded**: land purchase, title, environmental remediation, lender financing, planning/legal fees, insurance, permits, taxes, local labor and wage rules, inflation, long-term operations and asset maintenance, actual utilities, verified drainage, construction scheduling, community benefit agreements, habitat stewardship and risk-adjusted contingency. Real budget work must ground all these inputs.

## Integration and input state

The Living Neighborhood panel appears inside the existing **District Composer**, reusing the *same in-memory layout* for the selected district. There is no disconnected duplicate building inventory. User edits to building positions or types update the route/capacity/cost results immediately.

The panel has temporary local UI state for school/clinic/community capacities, cost factor, a selected building and destination. It introduces no external data collection, location permissions, background AI agent or user-data telemetry.

## Export

Local JSON exported with schema **canopy.neighborhood.v1** includes the selected district, fictional canvas constraints, service points, test assumptions, phase costs, routing point series, accessibility caveats and computed outcomes. The export is marked **FICTIONAL CONCEPT / NOT GIS / NOT FOR CONSTRUCTION** and should not be treated as a site survey, building permit, walking map, capital estimate, or real operational resilience plan.

## Evidence gates before a pilot neighborhood

1. Obtain lawful site rights and documented community/Indigenous consent and housing affordability plan.
2. Survey ecological constraints, stormwater drainage, riparian zones, flood/fire/seismic/geotechnical hazards.
3. Design and survey accessible streets, sidewalks, emergency vehicle and freight routes, traffic crossings and utility corridors with qualified professionals.
4. Validate demographic service demand, school/clinic partnerships and operational staffing.
5. Ground costs in local quantities, competitive pricing, lifecycle finance, land and public works requirements.
6. Audit real hourly electricity and heat loads, water supply and wastewater networks across a staged opening.
7. Establish independent public review and a stop/redesign decision process if habitat or community outcomes are adversely affected.

## Next research rungs

- Modeled walk routing over an actual accessible, surveyed topological street network with slope/crossing penalties.
- Building doors, accessible entry choices, ground floor uses and parcel-specific density constraints.
- Stormwater detention and decentralized water/thermal/utility capacity checks with measured sites.
- Phased capital and operating cost modeling with documented local sources and uncertainty bands.
- Integration with georeferenced Atlas and verified environmental and civil engineering studies.

This study inherits limitations from CANOPY's Living Atlas, Living Systems Lab, Blueprint Studio and District Composer. Prior artistic/multi-model design contributions are conceptual only, not independent engineering certification.
