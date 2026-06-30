import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isGeocodingConfigured } from './geocode';

describe('geocode', () => {
  it('reports whether a Mapbox token is configured', () => {
    const prevMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const prevPublic = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    delete process.env.MAPBOX_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    assert.equal(isGeocodingConfigured(), false);
    process.env.MAPBOX_ACCESS_TOKEN = 'pk.test';
    assert.equal(isGeocodingConfigured(), true);
    if (prevMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
    else process.env.MAPBOX_ACCESS_TOKEN = prevMapbox;
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    else process.env.NEXT_PUBLIC_MAPBOX_TOKEN = prevPublic;
  });
});
