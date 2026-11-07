# CANOPY | Mission Three: Architectural Blueprint Studio

**Concept design only. Not a construction document, licensed architectural submission, fire plan, geotechnical report, approval, or certified energy model.**

## Relationship to the masterplan

The CANOPY reference describes a 12 km², six-district city with an illustrative **4–7-story mixed-use** building family, living courtyards, code-compliant timber/other structural hybrids, protected ecology and accessible transit. Mission Three creates editable **local-meter** area studies, not building siting decisions.

| Prototype | Intended use | Initial width × depth | Courtyard | Stories | Conceptual structure |
| --- | --- | --- | --- | --- | --- |
| Living Courtyard | Homes and shared gardens | 60 × 48 m | 28 × 22 m | 6 | Certified timber hybrid |
| Terrace Commons | Homes and civic spaces | 54 × 42 m | 24 × 18 m | 5 | Certified timber hybrid |
| Circular Works Hall | Repair, light production and homes | 72 × 52 m | 30 × 22 m | 4 | Low-carbon mineral hybrid |
| Garden Forum House | Food market, education and homes | 56 × 46 m | 26 × 20 m | 5 | Modular mixed structure |

These are invented massing prototypes, **not existing buildings or agreed construction solutions**. Dimension, program, roof allocation and assumed electricity demand can be changed.

## Rough massing geometry

    outer block area = width × depth
    open courtyard area = courtyard width × courtyard depth
    perimeter footprint = outer block area − open courtyard area
    conceptual gross floor area = perimeter footprint × floors

This is not legally defined floor-area ratio, compliant building area, rentable area, or a reviewed residential schedule. Every story is assumed to share the same ring footprint. The calculator omits balconies, double-height spaces, corridors by floor, stair wells, elevators, service risers and local zoning controls. A minimum 7 m wing is only a guard against unreasonable drawn geometry, NOT a fire/accessibility/daylighting rule.

Two stair/core markers on the diagram are purely symbolic. Ground, typical and roof diagrams do not contain doors or code-checked exit routes. Sections show massing and the open courtyard, not structural, fire, thermal or accessibility engineering.

## Program and housing

    net floor area = gross floor area × assumed net efficiency
    residential net area = net floor area × assumed residential use share
    housing count = floor(residential net area / estimated typical dwelling area)
    estimated residents = housing count × occupancy assumption, rounded

The results are rough *potential*, not guaranteed housing yield. They omit legal bedroom mix, circulation and fire constraints, accessibility, daylight, acoustic needs, tenure and affordability tests.

## Roof budget

    PV module area + habitat roof area + service/access reserve = perimeter roof area

At least **15%** is reserved for unspecified equipment, access and services in the concept model. This does not establish compliance with roof load limits, fire access requirements, fire separation, rainwater drainage, root barriers, habitat value or maintenance clearances. The diagram color partitions the ring area approximately by user-controlled shares.

## Electricity model

    PV nameplate (kWp) = PV area (m²) × 0.20 kWp/m²
    annual rooftop PV (MWh) = PV kWp × 8,760 h × 19% assumed capacity factor / 1,000
    annual electric end use (MWh) = gross area × assumed kWh/m²/year / 1,000

These are **synthetic planning estimates**, not measured site data. The 19% capacity factor mirrors the prior Living Systems Lab reference. No real irradiance, roof orientation, shading, degradation, inverter losses, grid connection, lifecycle carbon, seasonal matching or hourly energy use is modeled. Annual PV should never be represented as full energy autonomy.

## Material options

- **Certified timber hybrid:** preferred conceptual option, pending fire, seismic, acoustic, moisture, carbon and sourcing review.
- **Low-carbon mineral hybrid:** conventional mineral structure with appropriate proven low-carbon alternatives and verified product documentation.
- **Modular mixed structure:** code-approved modular/steel/infill combinations, subject to connection, fire, transport, thermal and acoustic engineering.

Experimental structural mycelium, living root foundations and speculative alternatives from the wider design workshop are NOT offered as real load-bearing options.

## Exports and printing

- Versioned JSON: schema canopy.blueprint.v1, full inputs/quantities, methods and NOT FOR CONSTRUCTION status.
- Standalone SVG for the selected plan layer, not a BIM drawing, architectural scale document, survey, or georeferenced site plan.
- Browser-printable concept quantity sheet with selected plan, massing section, material choice and evidence checks. Print uses A4 portrait styles; browser pagination may vary.

No personal data is sent to a server through the blueprint controls.

## Required external review

Before actual building design or siting: property/legal rights; ecology and community consultation; flood, fire and seismic surveys; qualified code, accessibility, life safety and structure; mechanical/electrical/plumbing design; daylight and thermal performance; certified materials; verified supply chains; lifecycle costs and housing affordability; measured weather data and utility studies.

**The selected district is contextual only.** No building footprint is placed on surveyed land, and none of the schematic Living Atlas review flags counts as land-use permission.

## Next steps

- Validated apartment mix, corridors and egress with licensed architects.
- Genuine CAD/BIM interchange and scale-correct production drawings with source geometry.
- Georeferenced GIS building footprint overlays when a real site is legally available.
- Measured energy/weather simulations, climate-specific roof systems and lifecycle models.
- Browser/device print validation and an architecture drawing revision system.

Source lineage: original CANOPY masterplan and multi-model synthesis (SuperPhiVessel, Aurelia/Grok, Symbio/Kimi, Aluvia/Claude, Oikos-1/Gemini). Creative inputs are hypotheses, not construction evidence.
