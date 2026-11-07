export const ACRONYM = 'Climate-Adaptive Network of Open Places for You';

export const DISTRICTS = Object.freeze([
  { id: 'west', name: 'West Grove', role: 'Homes, schools and neighborhood food', feature: 'Mature canopy and low-rise edges', x: 17.5, y: 28, detail: 'Protects existing trees as housing, schools, gardens and food hubs form compact, shaded blocks.' },
  { id: 'ridge', name: 'Ridge Commons', role: 'Civic learning, libraries, labs and clinics', feature: 'Upland transit interchange', x: 41, y: 23, detail: 'Places public learning, health services and research near the connected transit backbone.' },
  { id: 'east', name: 'East Terrace', role: 'Mixed-use housing, employment and culture', feature: 'Shaded terraced blocks', x: 84, y: 28, detail: 'Steps mixed-use buildings into appropriate terrain while preserving cultural and regional connections.' },
  { id: 'meadow', name: 'Meadow Works', role: 'Circular manufacturing, repair and training', feature: 'Buffered service edge', x: 15.7, y: 76.5, detail: 'Shared repair shops, material recovery and low-impact maker spaces reduce waste and create local jobs.' },
  { id: 'garden', name: 'Garden Forum', role: 'Food production, markets and education', feature: 'Agroforestry and cultivation', x: 40.7, y: 68, detail: 'Food gardens, greenhouses, market halls and regional regenerative-food partnerships grow together.' },
  { id: 'river', name: 'Riverlight', role: 'Wetland stewardship, research and safe-elevation homes', feature: 'Habitat-sensitive public access', x: 85, y: 76, detail: 'Elevated civic edges overlook protected wetlands, with paths closed or rerouted when habitats need quiet.' }
]);

export const LAND_USE = Object.freeze([
  { name: 'Building footprints', percent: 15, area: 1.8, key: 'built' },
  { name: 'Habitat, water and restoration', percent: 48, area: 5.76, key: 'habitat' },
  { name: 'Food and communal landscapes', percent: 25, area: 3, key: 'landscape' },
  { name: 'Transit, civic and utilities', percent: 12, area: 1.44, key: 'mobility' }
]);

export const SYSTEMS = Object.freeze([
  { id: 'energy', order: '01', name: 'Energy + heat', tagline: 'Reduce demand. Diversify supply. Design for outages.', description: 'Passive building envelopes lead. Distributed solar, conditional wind, heat sharing, storage and grid connections are modeled independently, with critical-load resilience before whole-city autonomy.', evidence: 'Planning case: 240 GWh/year demand vs. 240.5 GWh/year example solar + wind generation before losses or hourly matching.' },
  { id: 'water', order: '02', name: 'Water + soil', tagline: 'Protect the watershed before closing loops.', description: 'Reduce demand, separate streams, treat and verify reclaimed water, restore floodplains, and design around legal supply and water quality. Wetlands are complementary treatment infrastructure.', evidence: 'Planning case: 8 ML/day gross demand; 2–3 ML/day conditional non-potable reclaimed water target.' },
  { id: 'food', order: '03', name: 'Food + land', tagline: 'Grow locally. Account for every import.', description: 'Gardens, agroforestry, greenhouses, food hubs and regenerative regional partnerships supply fresh produce without claiming that 12 km² can meet all calories.', evidence: 'No validated calorie or produce self-sufficiency percentage. Crop-specific yield studies required.' },
  { id: 'materials', order: '04', name: 'Materials + making', tagline: 'Buildings are reusable inventories.', description: 'Certified timber-hybrid structures and reversible assemblies support repair, repurposing and material passports. Novel bio-based panels stay in monitored pilot bays.', evidence: 'No carbon-negative claim without full lifecycle accounting and supplier evidence.' },
  { id: 'information', order: '05', name: 'Information + care', tagline: 'An auditable nervous system, not surveillance.', description: 'Local-first sensing of infrastructure and ecology supports an open watershed twin. Physical interlocks and public governance override optimization models.', evidence: 'No automated land-taking, policing or denial of essential services. Privacy and appeal by design.' }
]);

export const PHASES = Object.freeze([
  { id: '00', title: 'Survey first', period: '0–24 months', description: 'Choose or reject sites based on water rights, hydrology, habitats, climate, residents and lifecycle costs.' },
  { id: '01', title: 'Pilot quarter', period: 'Years 2–6', description: 'Build and audit a small 1,500–3,000-person reference quarter, not an entire city all at once.' },
  { id: '02', title: 'Connect three', period: 'Years 6–14', description: 'Connect utilities and transit, then verify social and ecological thresholds.' },
  { id: '03', title: 'Six districts', period: 'Years 14–25+', description: 'Scale only when conservation, affordability, access and safety remain demonstrably sound.' }
]);

export const ASSUMPTIONS = Object.freeze({
  studyAreaKm2: 12,
  population: 60000,
  annualDemandGWh: 240,
  solarGWh: 174.8,
  windGWh: 65.7,
  dailyWaterML: 8,
  criticalLoadMWh: 360,
  status: 'CONCEPT / NOT BUILT'
});

export function landUseTotal() {
  return LAND_USE.reduce((sum, item) => sum + item.percent, 0);
}

export function energyBalanceGWh() {
  return Number((ASSUMPTIONS.solarGWh + ASSUMPTIONS.windGWh - ASSUMPTIONS.annualDemandGWh).toFixed(1));
}
