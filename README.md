# C.A.N.O.P.Y.

**Climate-Adaptive Network of Open Places for You**

A city designed to belong to its watershed.

CANOPY is an open-source architectural, ecological, and software research project. The goal is a replicable method for designing walkable, climate-adaptive neighborhoods that protect ecosystems, operate resilient utilities, and remain accessible to ordinary people.

## Mission Zero: reference model

- Reference area: 12 km², assumed 4 × 3 km study envelope
- Illustrative full population: 60,000 people
- Six walkable districts: West Grove, Ridge Commons, East Terrace, Meadow Works, Garden Forum, Riverlight
- Five circulatory systems: energy/heat, water, food, materials, and information
- Illustrative land budget: 15% building footprints; 48% habitat, water and ecological restoration; 25% productive/communal open landscape; 12% transit, civic hardscape and utilities
- Architecture: generally 4–7 stories, with courtyard prototypes and passive-first, code-compliant timber-hybrid systems

**All figures are concept assumptions, not surveyed properties, operational measurements, or verified feasibility.** The site suitability gate comes before any construction design.

## Interactive masterplan

This repository contains a React + Vite masterplan explorer with six selectable districts, interconnected city systems, conceptual land budgets, and a research/feasibility ledger.

Run locally:

1. Install Node.js 22 or newer.
2. Run npm install.
3. Run npm run dev.
4. For validation, run npm test and npm run build.

The GitHub Pages workflow builds the app on pushes to main and validates pull requests. The repository may need GitHub Pages configured to deploy from GitHub Actions under Settings → Pages.

## Mission One: Living Systems Laboratory

Use the **Living lab** tab in the React explorer to test synthetic 8,760-hour electricity supply/demand plus battery dispatch and a separate daily water/reuse balance. Choose reference, passive-first, low-supply and drought presets; adjust sliders; inspect grid imports and water supply gaps; download an explicitly synthetic JSON scenario for reproducible discussion.

The modeling code is pure and unit tested, and the UI distinguishes candidate surplus from guaranteed exports. These models are **not site-specific forecasts or regulatory proof**. Read the detailed [methodology and limits](docs/SCENARIOS.md).

## Mission Two: Living Atlas

Use **Living atlas** in the React explorer to inspect the six districts against illustrative habitat, river-setback, river-edge review, agriculture and transit overlays. Change the synthetic river protection width (40–320 m), compare district proximity conflicts, and export a versioned schematic planning record. The six mandatory site-readiness gates remain explicitly **NOT VERIFIED**.

This is **not a real GIS map** and contains no real land, geodetic coordinates or hazard surveys. The [Living Atlas methodology](docs/ATLAS.md) explains the diagram's limitations and the evidence needed before actual site decisions.

## Mission Three: Architectural Blueprint Studio

Use **Blueprints** in the React explorer to design from four editable conceptual building archetypes: Living Courtyard, Terrace Commons, Circular Works Hall and Garden Forum House. Adjust block/courtyard dimensions, story counts, housing and roof allocations, and view schematic ground, typical and roof drawings plus a courtyard section. Explore structural alternatives and see synthetic housing, energy and area results.

Export **concept-labeled JSON**, download a standalone **schematic SVG plan**, or print a **two-part architectural planning sheet**. These are architectural ideation artifacts, **not permits, certified drawings, a real site plan, surveyed dimensions, or code compliance**. See the [Blueprint Studio model and evidence boundaries](docs/BLUEPRINT-STUDIO.md).

## Mission Four: District Composer

Open **Districts** in the CANOPY explorer to arrange the four Blueprint Studio building prototypes onto a fictional **600 × 600 m** neighborhood canvas. Select any of the six district contexts, add blocks to an accessible 7 × 7 location grid, rotate or move them, clear or restore examples, and toggle visual layers for protected habitat, food production, public commons, pedestrian spine, and transit.

Proposed placements are rejected when they overlap protected diagram zones, leave the illustrative study envelope, or violate a schematic 10 m block separation. **Turning off a visual layer does not disable protection.**

The results show indicative housing, occupancy, building coverage, rooftop PV, annual electrical use, domestic-only water consumption and straight-line distances to three proposed tram stops. Export versioned **unpermitted JSON** locally. There is no GIS, real neighborhood, legal setback, walking network, actual utility study, construction cost, or certified buildability. See [District Composer methodology](docs/DISTRICT-COMPOSER.md).

## Mission Five: Living Neighborhood

The **Living Neighborhood** panel inside **Districts** uses the *same edited neighborhood layout*, not a second model. It adds a synthetic **20 m walking network** avoiding conceptual ecological, farmland and building obstructions; model routes from selected buildings to transit, school, clinic, food hub and commons; and compares capacity assumptions against residents. Emergency access is a distance **warning proxy only**, not a fire-lane design.

A phased low/high construction cost sensitivity model uses openly documented **invented USD unit rates**, not actual quotations or a project budget. Change school, clinic, civic-room capacity and the cost multiplier. Export a complete **`canopy.neighborhood.v1` fictional scenario** as local JSON. See [methods, limitations and evidence gates](docs/LIVING-NEIGHBORHOOD.md).

## Mission Six: Infrastructure Nervous System

The **Infrastructure Nervous System** panel inside the District Composer uses the **same current block inventory** to calculate illustrative water, wastewater, district thermal and stormwater loads across an explicit five-node/eight-link utility graph. Each network has separate capacity limits, demand/shortfall reports and a selectable disabled corridor.

Adjust hypothetical water supply/reuse, sewage treatment, heating/cooling peak intensity, design rainfall, detention and release allowances. Study water shortage, heat stress, downpour and link outage scenarios. Export a versioned **canopy.infrastructure.v1** JSON model that includes the assumptions.

**No utility is built or approved.** These are invented network capacities, schematic straight connections and simplified maximum-flow quantities, not hydraulic/heat/flood simulations, operational safety assessments, legally permitted water rights or actual underground easements. See [methods and evidence requirements](docs/INFRASTRUCTURE.md).

## Mission Seven: Evidence Engine

Open **Evidence engine** in the CANOPY explorer to inspect the repository's **default reference** numbers and their origins. Search and filter source-linked records across city planning, electricity, water, ecology, architecture, district composition, community services and utilities. Every entry provides its formula, source module, relevant external evidence requirement and blocking real-world review gate.

The **eight construction evidence gates remain NOT VERIFIED**. The registry validates its own structure and exports a reproducible **canopy.evidence.v1** JSON model ledger, but it does **not** accept independent field evidence or grant permits. Values currently refer to canonical default scenarios, not unsaved edits in other panels. See the [Evidence Engine contract and future verified-data workflow](docs/EVIDENCE-ENGINE.md).

## Core documents

- [Masterplan](docs/MASTERPLAN.md): urban form, land suitability, districts, mobility and controls
- [Decision register](docs/DECISIONS.md): assumptions and explicit design resolutions
- [Research ledger](docs/RESEARCH-LEDGER.md): baseline technology, pilot studies, speculative proposals and red lines
- [Roadmap](docs/ROADMAP.md): evidence-gated development phases
- [Living Systems Lab](docs/SCENARIOS.md): synthetic electricity and water model, assumptions, limitations
- [Living Atlas](docs/ATLAS.md): normalized reference site overlays, sampling, field-data requirements
- [Architectural Blueprint Studio](docs/BLUEPRINT-STUDIO.md): typologies, conceptual geometry, roof assumptions and evidence gates
- [District Composer](docs/DISTRICT-COMPOSER.md): multi-building neighborhood composition, constraints, infrastructure assumptions and provenance
- [Living Neighborhood](docs/LIVING-NEIGHBORHOOD.md): synthetic routed walks, service demand/capacity, emergency access proxies and capital sensitivity
- [Infrastructure Nervous System](docs/INFRASTRUCTURE.md): topology, hypothetical plant capacities, supply and drainage balances, failures and limits
- [Evidence Engine](docs/EVIDENCE-ENGINE.md): source-linked model claims, status safeguards, real-world evidence gates and reproducible baseline export

## Principles

1. Site ecology before shape. Protect river corridors, floodplains, habitat and community rights.
2. Passive first. Buildings must reduce loads before adding intelligent controls.
3. No magical energy accounting. Track gross demand, generation, storage, losses and imports separately.
4. No fictitious self-sufficiency. Record food imports, water rights, treatment boundaries and ecological impacts.
5. Edge intelligence, accountable governance. AI recommends; qualified people and democratic institutions decide.
6. No surveillance city. Public ecological measurements, minimal personal information.
7. Affordability and accessibility are design requirements, not luxury upgrades.

## Provenance

Unified from a 2026 collaborative design exercise: CANOPY reference layout; SuperPhiVessel's conceptual systems frames; Grok/Aurelia's passive-first architecture; Kimi/Symbio's five circulatory systems; Claude/Aluvia's watershed and governance safeguards; and Gemini/Oikos-1's experimental materials and adaptive elements. These proposals are design inputs, not independently verified engineering results. See the decision and research ledgers.

## License

MIT. Research and design documentation are shared to support adaptation, review, and improvement. Real construction requires appropriately qualified professionals, local approvals, ecological assessment and independent safety review.
