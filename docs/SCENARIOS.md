# CANOPY Living Systems Lab | Model contract

**STATUS: SYNTHETIC PLANNING EXERCISE. NOT MEASURED PERFORMANCE.**

Mission One introduces deterministic electricity and water scenarios to help challenge CANOPY's assumptions. Not a site-specific weather forecast, an electrical interconnection study, a water-quality certificate or a building permit.

## Electricity: synthetic 8,760-hour year

Reference assumptions: 60,000 residents; 240 GWh annual gross demand; 105 MWp PV; 25 MW wind; 500 MWh battery; 5 MW critical load. Critical load means emergency services, not the entire city's consumption.

- Solar: synthetic daylight with seasonal variation, normalized to an assumed 19% capacity factor. No observed irradiance or latitude.
- Wind: deterministic seasonal/daily smooth shape, normalized to an assumed 30% capacity factor. Not observed wind or siting feasibility.
- Demand: synthetic evening and winter variability, normalized to the annual total. Demand reduction scales it.
- Storage: begins empty, four-hour power limit, 86% AC round-trip efficiency. Excess generation charges storage; storage discharges to cover shortfalls. Grid imports cover the residual. Grid does not charge storage in the model.
- Surplus after charging is **potential surplus**, not guaranteed export. Grid limits and curtailment policy are not modeled.
- Outage-duration illustration separately assumes 80% charged capacity at outage start, fully assigned to critical loads, and no renewable input. **Not simultaneously guaranteed with normal daily battery dispatch.**

Energy accounting:

    generation + imports = demand + potential surplus + storage losses + end storage - start storage

Annual generation matching demand **does not** imply zero hourly grid imports, resilience or net-zero lifecycle emissions.

## Water: daily steady-state exercise

Reference: 8 ML/day gross end-use before conservation.

    G = 8 × (1 - conservation fraction)
    reclaimed = min(G × greywater fraction × recovery fraction, plant capacity, G × eligible nonpotable fraction)
    freshwater withdrawal required = G - reclaimed
    hypothetical supply gap = max(freshwater withdrawal required - selected freshwater ceiling, 0)

No potable water quality, treatment compliance or lawful freshwater supply is guaranteed. The simple model omits hydrology, rainfall, seasonality, treatment pathogens, final effluent, leaks, ecology and downstream rights. A gap requires lawful supply, conservation or redesign.

## Export reproducibility

The app downloads a local JSON file with schema canopy.scenario.v1 and status SYNTHETIC_PLANNING_EXERCISE. It contains inputs, outputs, assumptions and monthly synthetic data. It does not collect personal data or sensor telemetry.

Source: src/scenario.js. Tests: tests/scenario.test.mjs.

## Required evidence gates

1. Site selection, land rights and ecology/hydrology/community baselines.
2. Hourly measured loads and weather, grid export rules, load tiers, power flows, utility constraints and outages.
3. Water rights, seasonal supply, reclaimed-water treatment quality, safe discharge and ecological minimum flows.
4. Independent engineering, ecological, financial, accessibility and community review.
5. Repeatable audit of data provenance and uncertainty. Humans retain authority over safety and ecology.

Lineage: CANOPY Unified Symbiotic City Masterplan V2, synthesizing original CANOPY with conceptual contributions from SuperPhiVessel, Grok/Aurelia, Kimi/Symbio, Claude/Aluvia and Gemini/Oikos-1. Ideas are not proof.
