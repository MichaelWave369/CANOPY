# CANOPY | Mission Four: District Composer

**Planning exercise only. Not GIS, zoning approval, an infrastructure design, a site plan, or construction documentation.**

## Purpose

The District Composer connects the four editable **Blueprint Studio default building prototypes** to a shared, human-scale neighborhood concept. Users can place buildings, move or rotate them in an explicit slot grid, delete them, change the building palette, change districts, toggle visibility overlays, and export a complete schematic planning record.

The purpose is to expose trade-offs among housing capacity, protected landscapes, walkable public space, transit, rooftop solar and preliminary utility demand. All results are design hypotheses, not physically surveyed or legally approved conditions.

## Study envelope

- **600 m × 600 m** fictional local coordinate canvas (36 hectares / 0.36 km²).
- A 7 × 7 grid of potential building centers, every 80 m, from x/y = 60 to 540 m.
- **6 separately editable named district studies:** West Grove, Ridge Commons, East Terrace, Meadow Works, Garden Forum and Riverlight. These reference the named citywide districts but **are not the 12 km² masterplan parcels**.
- A minimum **20 m schematic edge reserve**, and **10 m gap between building footprint rectangles**.
- Fixed schematic ecological greenway along the eastern edge, an upland grove, wetland cell, productive farm area, central civic commons, east/west tram+emergency path and north/south pedestrian spine.
- Three illustrative transit stops on the horizontal spine.

The reserved area shapes are arbitrary local canvas objects. They are not data from the Living Atlas, public GIS data, survey polygons, field-located wetlands, code-valid setbacks, or flood maps. The proposal must be rejected or adjusted when actual site ecology and community needs conflict.

## Placement logic

Each building instance references an unmodified default template from the Blueprint Studio:

- Living Courtyard
- Terrace Commons
- Circular Works Hall
- Garden Forum House

A building occupies a rectangular **outer width × depth envelope**, which includes its courtyard. Rotate 90° to swap the width and depth. It cannot be placed if that envelope:

- crosses the fictional 20 m site-edge band;
- intersects a reserved protected habitat, wetland, greenway, farm, civic commons, tram/emergency route or pedestrian spine;
- comes within the 10 m schematic buffer around another placed outer envelope.

The simulation intentionally checks the full **outer envelope**, not only the built perimeter ring, to protect the courtyards and shared garden space from collisions. A 2 m diagram buffer is added to the reserve-intersection test for visibility and precaution. Elliptical reserve intersection is checked against the closest point on the expanded rectangle.

**The 10 m separation is not a building code, fire access, daylight, accessibility, service lane, construction or privacy standard.** Actual separation and fire regulations depend on the building and region.

Visible layer toggles do **not** affect placement restrictions. Blocked cells display a reason and remain unavailable until a different location or prototype is selected. Moving or rotating a block re-evaluates the same checks.

Examples are deterministic and only include placements that pass these diagram constraints. They are not approved neighborhood layouts or optimized density plans.

## Quantities and arithmetic

Totals sum the existing Blueprint Studio prototype model independently for each placed building, preserving its existing disclaimer and assumptions:

- gross floor area (sum of fixed template perimeter areas times default floors);
- potential housing units and theoretical residents (floor of estimated net residential space divided by average dwelling size, times average occupancy);
- gross **building footprint** as outer rectangular mass minus open court, even though placement uses full envelopes;
- nominal rooftop photovoltaic module area and annual energy generation, synthetic 19% capacity-factor assumption;
- estimated building electricity consumption from each prototype's fixed electric intensity;
- green/ecological roof areas from template allocation.

Simple quarter-wide metrics:

    Study area = 600 × 600 = 360,000 m²
    Concept coverage (%) = sum of occupied perimeter footprints / 360,000 × 100
    Indicative residents per hectare = estimated residents / 36
    Domestic water (ML/day) = estimated residents × 110 L/person/day ÷ 1,000,000
    Straight-line distance to stop = minimum Euclidean distance to 3 conceptual stops

**Straight-line distance is not an actual walk time or accessible pedestrian route**. The average/maximum distance calculations use one building center each without population weighting or block obstacle routing.

Only **domestic occupant** water use is modeled: no school, repair shop, commercial, irrigation, fire, construction or water-treatment demand. The electricity values are annual synthetic aggregates with no hourly reliability check. This is not a power, district heat, water, sewage or waste-network simulation; it cannot demonstrate stand-alone operation.

## Public realm versus development capacity

Reserved space for habitat, food landscapes, transit and a civic commons is deliberately kept in the composition. The citywide **48% habitat/water/restoration** is a different land budget at 12 km² scale and is **not** claimed to match the 36 ha composer diagram. The published reference city population (60,000) and district populations (approximately 10,000 each) also remain independent targets, not validated outputs.

The pilot-quarter reference in the roadmap (around 1,500–3,000 residents) is a scenario used to evaluate future capacity. It is not a mandate to force enough development onto unsuitable land.

## Export and versioning

Exports are client-side generated JSON with schema **canopy.district-composer.v1**, status **SCHEMATIC / UNPERMITTED / NOT GIS**, source assumptions, exact building placements/rotations, currently selected district, reserve shapes, transit stop coordinates, and computed district metrics. The export uses only local meters. There are no actual latitude/longitude coordinates and no third-party data imports.

An exported configuration is a research snapshot, **not an approved parcel map, BIM, utility capacity model or construction drawing**. No browser storage or network transmission is introduced in this feature.

## Known limits and evidence gates

- No legal parcel boundaries, local land use, Indigenous or community consultation.
- No official riparian protection requirements, wildlife surveys, verified soil/terrain or flood/wildfire/geotechnical studies.
- No measured climate/weather, hourly district electrical dispatch, real district heating/cooling or water resource assessment.
- No life-safety design, fire response routes, daylight, accessibility, parking/freight or emergency evacuation engineering.
- No household income, housing costs, service capacity, school/clinic availability or governance model fitted to an actual location.
- No guaranteed low-carbon outcome, climate-neutrality, buildability or off-grid autonomy.

## Suggested next steps

1. Add editable street and facility networks, then use accessible walking-path routing, not Euclidean distance.
2. Design pilot-block public services and staged construction/cost phasing with uncertainties.
3. Establish a versioned geospatial interchange only after a real consented site and legal coordinate reference system are chosen.
4. Connect neighborhood utility loads to observed hourly weather/data and measured water rights/treatment capacity.
5. Introduce competent professional and community review of the architectural and environmental drawings before feasibility claims.

Source lineage: unified CANOPY reference masterplan and the existing Blueprint Studio, Living Atlas and Living Systems Lab. The broader collaborative design sources (SuperPhiVessel, Aurelia/Grok, Symbio/Kimi, Aluvia/Claude, Oikos-1/Gemini) are conceptual contributors, not certified site evidence.
