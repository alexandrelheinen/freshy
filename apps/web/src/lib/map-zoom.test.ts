import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY } from '@freshy/ui';
import { cappedSearchRadiusKm, radiusKmFromZoom, zoomForRadiusKm } from './map-zoom';

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

describe('radiusKmFromZoom', () => {
  it('round-trips with zoomForRadiusKm for the pilot radius', () => {
    const zoom = zoomForRadiusKm(PILOT_CITY.latitude, PILOT_CITY.defaultRadiusKm, 400);
    const radius = radiusKmFromZoom(PILOT_CITY.latitude, zoom, 400);
    assert.ok(Math.abs(radius - PILOT_CITY.defaultRadiusKm) < 0.5);
  });

  it('returns a larger radius at lower zoom levels', () => {
    const close = radiusKmFromZoom(48.9, 14, 400);
    const far = radiusKmFromZoom(48.9, 10, 400);
    assert.ok(far > close);
  });
});

describe('cappedSearchRadiusKm', () => {
  it('caps radius at the configured maximum', () => {
    assert.equal(cappedSearchRadiusKm(48.9, 2, 100), 100);
  });

  it('enforces a minimum radius', () => {
    assert.equal(cappedSearchRadiusKm(48.9, 18, 100), 0.1);
  });
});
