# CANOPY Living Atlas | Evidence-first conceptual planning

**Status: fictional coordinate model.** No real site has been selected. This is not a geographic information system, surveyed habitat inventory, flood map, legal setback, accessible path design, or declaration that a site is buildable.

## Purpose

CANOPY combines six walkable neighborhoods with a central waterway and a proposed protected ecological network. The Living Atlas lets us explore how different **illustrative** river-edge buffers could affect district layout before actual ecological studies. The project must shrink, move, or be rejected rather than override the watershed.

## Coordinate system and basemap

- Invented rectangular reference canvas: **4 km wide × 3 km tall = 12 km²**.
- Coordinates: x=0..100 west to east, y=0..100 north to south; units are percent of schematic dimensions.
- All forest, wetland, farmland, waterway and district shapes are drawn for demonstration, not mapped observations.
- Six district centers are inherited from the canonical model reference plan; district rings represent stylized envelopes, not surveyed parcels.
- Synthetic river centerline with constant horizontal half-width of 2.4% of the reference canvas width.
- River setback can be varied **40 to 320 m** in 20 m increments, converted to schematic horizontal map width on the *assumed* 4 km wide canvas. This is **not** a true perpendicular buffer, geodesic distance, stream jurisdiction, or safe development rule.
- Optional amber river-edge **review belt** extends another 140 m beyond schematic setback. It is an attention marker only, NOT a flood elevation, exceedance probability, or official floodplain.
- Habitat and wetlands are drawn as ellipses. Farms are rectangles. Transit is a schematic network.

## Simulated overlap evaluation

A conceptual neighborhood footprint is sampled at its center plus three radial rings, 36 angles per ring (109 samples total). A sample in synthetic habitat, wetlands or riparian zone counts as a depicted potential overlap. A sample in the amber review belt counts toward proximity review.

District statuses:

- **Possible overlap:** at least one footprint sample touches a depicted exclusion.
- **Proximity review:** no sample in an exclusion, but at least one sample touches the unverified review belt.
- **No overlap depicted:** no sample touches these drawn zones.

**None of these statuses means approved, safe, viable, legally compliant, or ecologically harmless.** Even an unflagged neighborhood may be on unsuitable ground when actual terrain, species, geotechnics and hazards are measured.

The area summary evaluates 100 × 100 schematic cells. It reports the union of excluded cells and a separate river-edge review belt as shares of the **fictional canvas**. The canonical **48% habitat/water/restoration surface land-budget target** is a distinct policy hypothesis and does not equal the dynamically calculated exclusion area. No double counting is implied.

## Interactive layers

- protected upland habitat and wetland cells;
- schematic river setback;
- unverified river-edge review belt;
- illustrative agricultural landscapes;
- schematic transit connections.

Visibility affects drawing only. Hiding a protected layer does **not** remove its conflict checks or make the site more suitable. The setback slider changes both display and sample calculations.

A JSON export is labeled with schema canopy.atlas.v1 and status SCHEMATIC / NOT REAL GIS, includes normalized coordinates and the assumptions used. It is **not GeoJSON** because valid GeoJSON requires WGS84 coordinates and would falsely suggest a real location.

## Six mandatory readiness gates

1. Legal site access, tenure and property consent.
2. Habitat connectivity, biodiversity, soil and hydrology field surveys.
3. Flood, wildfire, geotechnical and seismic assessments.
4. Water rights, lawful supply, wastewater quality and discharge permits.
5. Community and Indigenous participation, affordability and social impacts.
6. Independent code, life safety, mobility, cost and lifecycle feasibility.

All currently show **NOT VERIFIED**. Toggling map graphics cannot change that status.

## Path to a real GIS planning module

**Future work, not delivered by this model:**

1. Select a legally accessible candidate site with consent.
2. Establish a projected coordinate reference system and surveyed datum.
3. Ingest authoritative hydrology, parcel, flood, slope, fire, native species and conservation datasets with provenance.
4. Buffer stream centerlines/banks using qualified GIS methods, local law, habitat needs and topology validation.
5. Record uncertainties, seasonality, dataset change history and legal review status.
6. Re-run actual parcel/building footprint analyses and require professional signoff before feasibility conclusions.

## Architectural lineage

Derived from CANOPY Unified Symbiotic City Masterplan V2 and the original reference plan, with ecological, architectural and methodological ideas from SuperPhiVessel, Grok/Aurelia, Kimi/Symbio, Claude/Aluvia and Gemini/Oikos-1. Analogies remain inspiration, not proof.
