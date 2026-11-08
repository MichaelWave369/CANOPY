# CANOPY Mission Six | Infrastructure Nervous System

**SYNTHETIC GRAPH, NOT A CIVIL ENGINEERING DESIGN.** No land, pipe, pumping station, thermal plant, treatment process, water rights, surveyed conduit easement or drainage infrastructure has been verified.

This mission extends the *current in-memory District Composer building inventory*. A building placed, moved, rotated or deleted in the 600 × 600 m fictional quarter changes the loads assessed here. The software does not create a duplicate development model or claim to implement real utility operations.

## Four separately tracked systems

| System | Design quantity | What the result means | What it does not mean |
| --- | --- | --- | --- |
| Water | m³/day | Volume that can theoretically pass through a capacity-limited graph | Pressure, pumping, potable safety, legal supply, real flow |
| Wastewater | m³/day | Volume that reaches a central conceptual plant over a reverse-symmetric collection graph | Gravity feasibility, invert elevation, treatment approval, sanitary environmental compliance |
| District thermal | Peak MW | Schematic heating/cooling load theoretically conveyed to nodes | Heat exchanger/temperature differential, seasonal hourly dispatch, plant COP, safe heat rejection |
| Stormwater | m³/event | Event runoff volume handled by diagram pipes plus detention/release | Flow hydrograph, flood return period, safe inlet/outfall, pollutant removal, infiltration suitability |

The separate electricity **Living Systems Lab** remains the reference source for hourly electricity dispatch. Mission Six does **not** invent an electrical grid analysis or falsely interpret district thermal capacity as electricity.

## Corridor graph

Five invented public node coordinates:

- Central hub: (300,300) m
- West branch: (100,300) m
- North branch: (300,100) m
- East branch: (500,300) m
- South branch: (300,500) m

Eight conceptual links: four spokes from the hub and four outer diagonals providing hypothetical alternate paths. For all four utilities a user can disable one chosen link and recalculate its consequences.

**All link capacities are fictional**. The lines illustrate a *topological* layout only, not a spatially validated underground alignment, easement or environmental clearance. Diagonal connections and straight building hookups can cross schematic landscapes; the map is **not suitable for construction routing**. A link failure indicates abstract loss of capacity, not actual resilience, safe islanding or service continuity.

Each building connects to its closest conceptual node by Euclidean center-to-node distance, regardless of doors, land obstacles, trench limits, slopes or pipe infrastructure. It inherits default Blueprint Studio residents, gross floor area and program ratios.

### Source and loads

The model uses these **assumed**, not observed, rates:

- Domestic water: 110 liters per estimated resident per day.
- Nonresidential water: 4 liters per gross nonresidential m² per day.
- Wastewater: 82% of gross water demand enters the sewer planning case. Actual consumptive uses, leakage and return-flow shares require local study.
- Potential treated reuse: at most 28% of wastewater **collected by the network**, 30% of gross demand, and the user-set reuse plant capacity.
- Gross water demand = fresh water plus potential reclaimed supply, with reclaimed water not allowed to exceed collection/treatment assumptions.
- Freshwater intake requirement = gross demand minus potential reclaimed reuse. If freshwater capacity is insufficient, report a gap.
- Thermal peak: gross floor area × 45 W/m² × user-defined heat/cooling stress factor, unless intensity is changed in the sliders. This is not a climate-load calculation.

**Important:** Reclaimed water assumes certified end-use suitability in principle only. There is no pathogen removal, water-quality monitoring, chemical treatment specification, segregated potable/reclaimed pipe infrastructure or water-right approval. The software does not issue treatment certifications. Even when volume balances are satisfied, human operation and code-compliant design are essential.

## Maximum-flow approach

Mission Six creates an undirected-capacity abstraction using bidirectional residual links and an Edmonds–Karp maximum-flow solver for each utility. A single source at the hub represents treatment/distribution capacity. Every node is assigned demand derived from its buildings; the network computes delivered volume and the remainder unmet.

- Water and sewage corridor assumptions are m³/day.
- Thermal capacities are peak MW and must not be interpreted as continuous energy (MWh) or thermal efficiency.
- For stormwater, link values are indicative m³/hour multiplied by event duration to approximate event conveyance capacity, with **no hydrograph, coincidence, storage routing, peak pressure or hydraulic head**.

The collection network is solved in the same undirected-capacity orientation as distribution for convenience. This is **not a sanitary sewer hydraulic model** and does not establish that gravity flows toward the hub.

### Stormwater scenario

A standalone hypothetical rain event:

    runoff_m³ = event_depth_mm ÷ 1000 × 360,000 m² × runoff_coefficient

The runoff is split into **five equal fictional catchment buckets** at the model's nodes. A central storage-and-release budget is:

    event_handling_m³ = detention_storage_m³
                      + (infiltration_m³_per_hour + permitted_outlet_m³_per_hour)
                      × event_duration_hours

The stormwater graph computes **conveyed** volume, capped by that central budget. Additional volume is reported as unhandled within the schematic. These formulas cannot calculate flood levels, actual rainfall intensity peaks, detention outlet design, true infiltration or downstream flow impacts. Rainfall, soil permeability, pollutant removal, channel protection and local laws require independent specialist study.

## Outputs and controls

In the District Composer, the Infrastructure Nervous System panel includes:

- Four utility tabs with delivered/required/shortfall summaries and switchable network colors.
- Editable hypothetical freshwater and reuse throughput, wastewater plant capacity, thermal hub capacity, thermal intensity/stress, rainfall depth, runoff, event duration, detention/infiltration/outlet limits.
- Presets for reference, water shortage, heat stress, downpour and a disconnected corridor.
- A selectable individual failed segment and recalculation of capacities through alternate paths.
- Water-cycle reconciliation with collected wastewater, reclaimed potential and freshwater need.
- Storm event volume/detention indicators.
- Locally downloaded versioned JSON with all displayed assumptions, link/node inventory, modeled building connections and results.

The JSON schema is **canopy.infrastructure.v1** and explicitly identifies the study as **SYNTHETIC UTILITIES / UNGEOREFERENCED / NOT FOR CONSTRUCTION**. No geospatial coordinates, real civil network, sensor readings or utility permits are implied. The export is client-side and no personal data is uploaded.

## Evidence still required

1. Select an actual, legally accessible site and establish real parcels, permitted easements and underground utility conflict maps.
2. Protect habitats and watersheds through field survey and authority-led environmental review.
3. Verify raw water supply rights, treatment systems, safe nonpotable reuse and continuous potable water quality.
4. Engineer pressurized supply networks, sewer invert elevations and pumps, wastewater treatment/discharge, pipe/material safety and emergency cross-connection protection.
5. Design thermal energy exchange, distribution temperatures, pumping, redundancy and measured heating/cooling loads.
6. Commission hydrologic/hydraulic drainage and flood studies with local design storms, safe overflow, detention, erosion, pollutant filtration and ecological flows.
7. Document capital and lifecycle costs with locally sourced bids, tariffs, environmental mitigation and resilience operations.
8. Integrate professional life safety, seismic, flood/wildfire and social-accessibility reviews; retain accountable human control and stop/rework authority.

## Deliberately unsolved

Mission Six does not claim the fictional 36-hectare district can operate independently, support 10,000 residents, satisfy the 48% citywide habitat target, or meet a utility service standard. It does not validate the water-based pilot or replace a licensed civil, mechanical, environmental or electrical engineer.

Next research rung: **a proper utility data provenance ledger** linking every capacity and demand assumption to verifiable datasets, plus a site-gated civil feasibility and cost model. Any GIS integration must wait for a real consented survey and established coordinate reference system.

Source lineage: the CANOPY unified master plan, Living Systems Laboratory, Living Atlas, Architectural Blueprint Studio, District Composer and Living Neighborhood; other contributor ideas are conceptual inputs, not field measurements.
