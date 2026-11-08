# CANOPY Mission Seven | Evidence Engine

**MODEL TRACEABILITY ONLY. NO FIELD VERIFICATION. NOT FOR CONSTRUCTION.**

Mission Seven is an open-source source-of-truth **foundation** for CANOPY's already published conceptual model. It does not make the synthetic master plan true, certified or site-ready. Instead it exposes precisely **which assumptions and calculations created individual claims** and keeps all independent engineering, environmental and community evidence gates in an explicitly unverified state.

## Scope and provenance

Version: \`canopy.evidence.v1\`.

The Evidence Engine imports canonical source modules and computes a **read-only default/reference snapshot**. It records thirty-plus traceable model values across eight domains:

1. City and land area/population/land-use categories.
2. Energy capacity assumptions, annual synthetic demand/generation, residual grid imports and storage.
3. Water reference, conservation-adjusted demand, treatment-capped reuse and freshwater need.
4. Living Atlas hypothetical riparian setback and invented protected overlay share.
5. Blueprint Studio courtyard prototype envelope, floor areas, housing and rooftop PV.
6. District Composer's fixed Garden Forum example buildings and indicative resident yields.
7. Living Neighborhood's example routing-to-stops, school capacity difference and fictional low-capital case.
8. Infrastructure Nervous System's default district water, nonpotable reuse, thermal and event-stormwater outcomes.

Each claim has a **stable ID**, domain, numerical value, unit, classification, source file/symbol, summary of calculation, scenario scope, outside-verification requirement and blocking review gate.

**An internal code source is not an independently reliable external dataset.** All records are marked site evidence **not-verified**. A model-derived number is sometimes computed exactly under its assumptions, but it cannot establish the correctness, timeliness, permissions, legality, real conditions, biodiversity, safe construction or affordability of those assumptions.

## Current scenario limitations

The existing React application keeps slider states in each tool's own component. Therefore the Evidence Engine currently captures the **canonical default inputs** and one fixed example Garden Forum District Composer layout, not what happens to be edited in another panel. The UI and JSON explicitly declare this limitation.

No real site, parcels, lat/longitude, observations, utility metering, water sampling, hydrologic survey, engineering stamps, accessible route inventory, housing affordability data, independent bids or environmental consents are connected or asserted. All economic unit rates in the Living Neighborhood model remain hypothetical placeholders, **not market estimates**.

## Classification and what it means

| Type | Meaning | Site verification |
| --- | --- | --- |
| \`assumption\` | A chosen numerical starting value or design target | Not verified |
| \`derived\` | A value computed by repository source code from synthetic inputs | Not verified |
| \`design-rule\` | A rule used to draw or constrain a fictional planning study | Not verified |

These are **types of source lineage**, not confidence rankings. The model should never equate calculated values with measured truth.

## Eight external-evidence gates

| Gate | Required assessment | Accountable party |
| --- | --- | --- |
| Land rights and consent | Property access, title/land-use, community and Indigenous consultation | Legal counsel, landowners and communities |
| Ecology and hydrology | Habitat, biodiversity, riparian, water resource and land stewardship baselines | Qualified independent ecologists/watershed experts |
| Hazard and life safety | Flood, wildfire, geotechnics, seismic and climate risk | Local qualified engineering and relevant authorities |
| Water rights/treatment | Source/discharge permissions, quality and reuse compliance | Water agencies and environmental engineers |
| Energy and resilience | Observed hourly profiles, weather, interconnection, safe load-tier outages | Independent electrical/thermal engineers and utilities |
| Architecture/accessibility | Surveyed parcel layouts, building code, structure, fire/egress and accessible routes | Qualified licensed designers and officials |
| Housing/services | Equity and affordability, verified school/clinic operations and community governance | Residents, housing authorities, service providers |
| Costs and financing | Real civil quantities, estimates/competitive quotes and lifecycle financing | Independent cost, procurement and finance reviewers |

All eight gates in \`src/evidence.js\` are **hardcoded not-verified**. The program intentionally has **no control to mark them verified**. This is appropriate because the system does not yet accept, authenticate or independently assess external supporting documents.

## Data contract and invariants

The module exposes:

- \`buildEvidenceLedger()\`: recomputes baseline values from existing exported reference models.
- \`validateEvidenceLedger(records,gates)\`: checks stable IDs, domains, source paths, finite numerical values, methodology, gate linkage and disallows unsupported status elevation or invented external evidence.
- \`evidenceExport(records,gates)\`: exports structured, locally produced JSON only after structural validation.

The export includes the unverified eight-gate register, all records, reference inputs, limitations and audit summary. It is deterministic and labeled **MODEL TRACEABILITY ONLY / NO FIELD VERIFICATION / NOT FOR CONSTRUCTION**. It is **not an engineering drawing, construction certificate, field dataset, actual environmental finding, planning permit, warranty or signed verification report**.

The \`audit.ok\` result measures **internal register consistency**, not safety or field certainty. \`audit.constructionClearance\` is always \`false\`. Future verified readiness must be designed as a separate workflow subject to access controls, provenance checks and authorized reviewers.

## Risks intentionally avoided

- Treating an internal calculation as an independent measurement.
- Using the same value as both an input assumption and evidence of its own validity.
- Equating 100% land-budget arithmetic with actual mapped ecological space.
- Conflating 8 ML/day **gross original water reference** with the conservation-adjusted model result.
- Confusing 240 GWh annual demand with hourly reliability or using annual local production to claim off-grid status.
- Equating a synthetic 20 m walking grid with real accessible pedestrian travel.
- Treating fictional construction costs as contemporary supplier quotes.
- Allowing a user to tick a checkbox and quietly mark land, water, structural or public safety as approved.

## Future evidence-ingestion architecture (proposal, NOT delivered)

A future separate review workflow should enforce:

1. A user-consented, lawful source with file digest, document type, named submitter, revision and dated provenance.
2. Real-world geospatial location, time window, method, units, calibration and uncertainty, only where appropriate and permitted.
3. Independent verification by qualified authorized reviewers; separation of submitter and approver; audit history.
4. Contradiction and supersession tracking, source reliability review, expiry and revocation, without automatically discarding older evidence.
5. Distinct statuses: **submitted**, **under review**, **accepted** or **rejected**, with reason and reviewer. Never map these onto construction permission by themselves.
6. Hard linkage to external authorities: zoning approvals, watershed rules, environmental review, utility permissions, fire/seismic/accessibility code and community governance.
7. Read-only public dashboards with personal information minimized and sensitive ecological locations properly protected.
8. Cryptographic integrity and access control using actual signing keys and verifiable hashes, not implied by version string or a token.

No such approvals, measurements, signatures or verified field records exist in Mission Seven. Future work should also unify per-panel scenario state for true live parameter lineage and expose source revision identifiers and machine-validated unit conversions.

## Reproducibility and tests

- Source: \`src/evidence.js\`
- UI: \`src/EvidenceEngine.jsx\` and \`src/evidence.css\`
- Tests: \`tests/evidence.test.mjs\` (source reconciliation, conservative claims, status tampering, JSON export and scenario provenance)
- Prior modules: \`src/model.js\`, \`src/scenario.js\`, \`src/atlas.js\`, \`src/blueprint.js\`, \`src/district.js\`, \`src/neighborhood.js\`, \`src/infrastructure.js\`

The browser downloads the evidence ledger locally. It does not automatically transmit personal data, sensor telemetry or source documents.

**Decision rule:** No matter how complete or attractive CANOPY's reference model becomes, it cannot be represented as a real development site, a permitted design, an engineered utility system or a ready-to-build community without legally required external studies and independent human oversight.
