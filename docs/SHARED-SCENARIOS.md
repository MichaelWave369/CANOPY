# CANOPY Mission Eight | Shared Scenario Core

**SYNTHETIC / UNVERIFIED / NOT FOR CONSTRUCTION.**

This release establishes a common, versioned local scenario that links CANOPY's Living Systems Laboratory, District Composer, Living Neighborhood, Infrastructure Nervous System and the dynamic subset of the Evidence Engine. It is software state management, **not** a site-specific digital twin, survey, external evidence service, or certified engineering model.

## Architecture

- Pure model: \`src/workspace.js\` with independent validation, immutable commits, comparisons, undo/redo, revision selection and JSON import/export.
- React provider: \`src/WorkspaceContext.jsx\`, mounted at \`src/main.jsx\`. All connected modules consume the **same snapshot** through \`useWorkspace()\`.
- User interface: \`src/WorkspacePanel.jsx\`, \`src/workspace.css\`. Workspace navigation appears before the Living Systems Lab.
- Regression tests: \`tests/workspace.test.mjs\`, including cross-model recomputation, invalid import rejection, revision history and evidence integrity.

## Schema

The \`canopy.workspace.v1\` document contains:

    schema: canopy.workspace.v1
    status: SYNTHETIC / UNVERIFIED / NOT FOR CONSTRUCTION
    cursor: index of currently selected revision
    nextRevision: monotonically increasing local revision counter
    history: up to 20 entries, each with revision, label, snapshot

Each snapshot has:

    energy: synthetic energy scenario inputs from ScenarioLab
    water: synthetic water scenario inputs from ScenarioLab
    districtId: selected one of six canonical district IDs
    layouts: six District Composer lists of schematic building placements

The values and layout shapes are validated against known model bounds and **existing District Composer placement restrictions**. Unknown fields and unsupported or out-of-range values are rejected instead of silently accepted. This is defensive data validation, **not authentication**. Local revision numbers do not certify authorship, provenance, measurements or permission.

## Live propagation

1. Moving an energy or water slider commits a new workspace revision. Existing synthetic energy/water models immediately recalculate.
2. Changing selected district or adding/moving/deleting blocks commits to the corresponding district layout while preserving the other five.
3. The Living Neighborhood and Infrastructure Nervous System already consume \`DistrictComposer\`'s current layout by props; both therefore update when the shared district layout changes.
4. The Evidence Engine's underlying model ledger now accepts a shared snapshot and reuses its energy/water parameters and selected district layout. It recalculates model-linked energy, water, housing, community services, cost assumptions and infrastructure records. Code-derived numbers still do **not** constitute independent evidence.
5. The Workspace comparison panel compares the *selected district* on both sides and separately reports synthetic energy, water, housing and PV changes.

### Intentionally **not** connected in Mission Eight

Blueprint Studio's editable prototype dimensions, Living Atlas's independent setback slider, and the Living Neighborhood/Infrastructure panels' dedicated school/clinic, weather/storm, utility capacity and cost-factor sliders **remain local component state**. Their Evidence Engine records are still examples from their canonical default inputs, not live readings of those standalone sliders. The simple main-page Reality Ledger also shows original conceptual masterplan assumptions rather than the current scenario. This limitation is explicit in the UI.

A later schema revision should introduce canonical, validated controls and shared scenario provenance for these independent models with migration tests, rather than falsely claiming full synchronization.

## History, branching and restoration

- Every meaningful edit creates an immutable snapshot with an incrementing, *local* revision ID.
- Undo and redo move the cursor through the retained history.
- Clicking an older history entry selects its snapshot. Committing a new edit from that point **discards the future redo branch**; it assigns a fresh local revision ID so the superseded revisions aren't silently reused.
- A maximum of 20 snapshots is retained. Older versions are deleted as the local rolling history advances. Export to JSON for durable backup.
- A no-op change does not create another revision.
- A **Reset local workspace** action requires confirmation and restores the canonical default, replacing history. It does not affect any external repository data.

This is a convenience revision log. It is not an append-only legal audit trail, tamper-proof ledger, signed event stream, collaboration protocol, or controlled approval history.

## Persistence and transport

The provider persists a serialized workspace in browser \`localStorage\` under \`canopy:scenario-workspace:v1\`. This works on the same browser profile and origin only and is subject to quota limits, private browsing restrictions and user deletion. There is no remote synchronization, telemetry or user account.

The workspace can be downloaded as local JSON and restored using the import file picker. It rejects files above 1 MiB, wrong schema/status, unsupported values, malformed geometry, invalid revision order, unknown root fields and attempts to invent verification status. If a saved browser snapshot is corrupted or incompatible, the UI falls back to canonical defaults and explains the issue. If storage writes fail, it advises exporting a file.

Local JSON files are **not encrypted or authenticated**. Users must treat imported files as untrusted, avoid sharing identifying details, and keep verified external evidence in a separately protected review system.

## Model boundaries

The workspace uses deterministic synthetic default assumptions for a fictional 12 km² city and a 600 × 600 m neighborhood study canvas. It does **not** supply measured site GIS, hourly meter data, lawful freshwater rights, treated-water quality, licensed architectural plans, verified transit/ADA routes, clinical/school provision, construction cost bids or installed infrastructure. It cannot approve anything.

The Evidence Engine retains all eight real-world review gates in \`NOT VERIFIED\` state, even when the internal model calculation reconciles correctly. An internal integrity check means input structure and arithmetic lineage are consistent, **not** that a design is feasible or safe.

## Future rungs

- Extend the shared, typed schema to standalone Blueprint Studio, Atlas and community/utility facility assumptions, with stable migrations.
- Add side-by-side named scenario branches and uncertainty/sensitivity bundles.
- Build an independently permissioned, reviewed external evidence ingestion pipeline with source citations, timestamps, signed revision history and revocation.
- Introduce real, consented GIS land and ecological observations and independently validated weather, water, utility and housing datasets.
- Connect district loads to genuine hourly simulations, civil/architectural code review and verified lifecycle costs before physical-site decisions.
