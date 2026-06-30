import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY } from '@freshy/ui';
import { zoomForRadiusKm } from './map-zoom';

describe('zoomForRadiusKm', () => {
  it('returns a neighborhood-scale zoom for the pilot city search radius', () => {
    const zoom = zoomForRadiusKm(PILOT_CITY.latitude, PILOT_CITY.defaultRadiusKm, 400);
    assert.ok(zoom >= 11 && zoom <= 14);
  });

  it('clamps to valid map zoom bounds', () => {
    assert.equal(zoomForRadiusKm(0, 0.01, 400), 18);
    assert.equal(zoomForRadiusKm(0, 10000, 400), 2);
  });

  it('zooms out for larger search radii', () => {
    const small = zoomForRadiusKm(48.9, 1, 400);
    const large = zoomForRadiusKm(48.9, 5, 400);
    assert.ok(large < small);
  });
});
