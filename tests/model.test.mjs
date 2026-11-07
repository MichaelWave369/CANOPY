import test from 'node:test';
import assert from 'node:assert/strict';
import { ACRONYM, ASSUMPTIONS, DISTRICTS, LAND_USE, SYSTEMS, PHASES, landUseTotal, energyBalanceGWh } from '../src/model.js';

test('canonical acronym and district inventory', () => {
  assert.equal(ACRONYM, 'Climate-Adaptive Network of Open Places for You');
  assert.equal(DISTRICTS.length, 6);
  assert.equal(new Set(DISTRICTS.map(d => d.id)).size, 6);
  assert.equal(new Set(DISTRICTS.map(d => d.name)).size, 6);
  for (const district of DISTRICTS) {
    assert.ok(district.x > 0 && district.x < 100);
    assert.ok(district.y > 0 && district.y < 100);
  }
});

test('reference land budget is coherent', () => {
  assert.equal(landUseTotal(), 100);
  assert.ok(Math.abs(LAND_USE.reduce((sum, l) => sum + l.area, 0) - ASSUMPTIONS.studyAreaKm2) < 1e-9);
});

test('energy scenario is an annual arithmetic illustration only', () => {
  assert.equal(energyBalanceGWh(), 0.5);
  assert.equal(ASSUMPTIONS.annualDemandGWh, 240);
  assert.equal(ASSUMPTIONS.criticalLoadMWh, 360);
});

test('five circulatory systems and four build phases', () => {
  assert.equal(SYSTEMS.length, 5);
  assert.equal(PHASES.length, 4);
  assert.equal(ASSUMPTIONS.dailyWaterML, 8);
  assert.match(ASSUMPTIONS.status, /NOT BUILT/);
});
