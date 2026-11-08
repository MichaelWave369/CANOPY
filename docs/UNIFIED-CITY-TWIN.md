# CANOPY Mission Nine | Unified City Twin v2

**Status: SYNTHETIC / UNVERIFIED / NOT FOR CONSTRUCTION.**

Mission Nine upgrades the CANOPY Shared Scenario Core so one browser-local, versioned project scenario can coordinate most of the previously independent planning modules. It is **not** a geospatial digital twin of a real city, a building information model, an engineering sign-off, or observed ecological monitoring.

## Scope of the coordinated reference model

The \`canopy.workspace.v2\` snapshot includes:

| Source system | Shared state | Downstream effects |
| --- | --- | --- |
| Living Systems Laboratory | Solar, wind, battery, annual demand profile parameters; water treatment and conservation | Hourly synthetic dispatch and daily water model, evidence ledger |
| Blueprint Studio | Four complete canonical prototype objects, including floor count, width/depth/court, program mix, roof PV/planting, materials | District housing, floor area, rooftop PV, building footprints, Neighborhood services/costs, district thermal/water loads, Evidence Engine |
| Living Atlas | Synthetic river setback width in 20 m steps, 40–320 m | Reference Atlas exclusion/review evaluation and evidence claims |
| District Composer | Selected district, six independent local layouts | Placement constraints, downstream community and infrastructure models |
| Living Neighborhood | School seats, clinic appointments/year, civic seats, construction cost factor | Service gap estimates and **hypothetical** capital sensitivity |
| Infrastructure Nervous System | Plant capacities, nominal pipe throughput, thermal load assumptions, rain and detention allowances, failed segment | Maximum-flow demand/shortfall and graph responses |
| Evidence Engine | Reads the live shared model, **not external field evidence** | Updates model-linked records and keeps every external approval gate **NOT VERIFIED** |
| Workspace | Complete snapshot, history cursor and local revision sequence | Undo/redo, JSON import/export, baseline comparison, browser persistence |

The shared scenario also extends baseline comparison to total district gross floor area, Atlas's fictional exclusion share, school seats shortfall, synthetic thermal demand and potable-network capacity shortfall.

## Prototype editing safeguards

Each building template retains a fixed identity and descriptive metadata. Editable numeric/design fields are checked by the existing Blueprint Studio calculator. The common workspace then checks **all six district layouts** against the proposed prototype outer envelopes, fictional conservation restrictions, and 10 m conceptual building separation. If an edit would make any existing layout invalid, the Blueprint Studio **rejects the change** and displays a reason rather than silently displacing an existing building or allowing an ecological overlap.

A schematic housing result is not a guaranteed legal dwelling yield. Rooftop PV output uses synthetic capacity factors. The material options are not engineered or approved structural designs.

The 600 × 600 m District Composer canvas **is not geographically registered** to the 4 × 3 km Living Atlas canvas. Altering the latter's river buffer does not automatically alter the former's independent fictional protected zones. The only shared cross-system relationship in Mission Nine is **traceable scenario state and recomputed model arithmetic**, not physical spatial overlay or joint permit eligibility.

## Schema and migration

- New schema: \`canopy.workspace.v2\`.
- New browser key: \`canopy:scenario-workspace:v2\`.
- Prior schema/key: \`canopy.workspace.v1\` / \`canopy:scenario-workspace:v1\`.
- First load checks the new local key; if absent it reads the old key, validates it and migrates its revision history.
- Old v1 JSON exports are also accepted when valid: the migration adds the four canonical prototype definitions, original river setback, default community capacity and default infrastructure assumptions **to each historical snapshot**. It preserves existing energy/water values, all six district layouts, selection, history order, revision IDs and undo/redo cursor.
- The imported result is validated as v2 and saved under the v2 key. Unsupported new keys, modified prototype identity fields, bogus approvals or illegal dimension/massing changes are rejected.
- There is **no unvalidated automatic elevation** of permissions, project readiness or source provenance. The old v1 key is left untouched rather than destructively deleted.

The migration cannot fabricate older prototype edits that were never shared in v1. Such formerly local-only values appropriately resume from known canonical defaults.

## Versioned session behavior

- A meaningful edit writes an immutable project snapshot; a no-op does not increment the revision.
- Undo/redo and direct revision selection replay the entire shared scenario.
- Editing an older revision creates a new branch tip and discards only subsequent **in-browser redo history**, not externally exported JSON backups.
- Only the most recent 20 revisions are retained in local browser storage. Browser clearing, private mode or quota errors can remove them.
- Exports contain full JSON snapshots. Imports are limited to 1 MiB and validate model ranges, six district inventories, prototype geometry, version and status.
- This is a **local convenience history**, not collaborative cloud persistence, authenticated source attestation, an append-only ledger, or a controlled construction change-order audit.

## Explicit modeling boundaries

The system still has **no real site selected**. The fictional canvases do not establish real land, flood safety, environmental protection, water rights, accessible routes, usable building envelopes, building code, school/clinic availability, construction prices, material sourcing or genuine utility resilience.

Annual citywide energy and water models retain their own conceptual scale; rooftop per-building solar and district utilities are **not** automatically incorporated into the citywide hourly electricity budget. Do not sum unlike scenario scales or treat them as one physically calibrated system.

Independent professional, community, legal and environmental reviews are still required. The Evidence Engine's eight external approval gates remain blocked, regardless of how well an internal model reconciles.

## Test coverage

\`tests/citytwin.test.mjs\` verifies:
- v2 field validation and canonical defaults;
- building floors and rooftop PV propagating through district and utility totals;
- invalid prototype width changes rejected when layouts conflict;
- synthetic river-setback effect;
- community and infrastructure shortfall propagation;
- v1 migration with revision ID preservation and refusal of fabricated approvals;
- reproducible export/restore of v2 revisions.

Previous unit tests for the original v1 model functions continue to run. The existing v1 workspace suite is updated for the new storage key, keeping other regression expectations intact.

## Next engineering steps

1. Introduce authoritative, consented geospatial site data and projected coordinate reference systems, with ecological field-survey provenance.
2. Map site-verified parcels, building entries, accessible paths, real ground slopes and wildlife corridors through an appropriately governed GIS pipeline.
3. Integrate measured hourly energy and thermal loads, water quality and legal supply, stormwater hydraulic modeling, and engineering-approved network capacity.
4. Add well-defined CAD/BIM geometry and independently verified architectural/civil drawings when the design is suitable.
5. Upgrade the local evidence ledger into an externally reviewed, permissioned audit process with signed sources, contradictory evidence and historical revocation handling.

Until those steps are done, CANOPY remains an open-source **urban systems research prototype**, not a construction-ready city.
