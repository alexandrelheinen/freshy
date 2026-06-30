import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY } from '@freshy/config/pilot-city';
import { placesQuerySchema } from './places';

describe('placesQuerySchema', () => {
  it('defaults search radius to the pilot city config', () => {
    const parsed = placesQuerySchema.parse({ lat: 48.9, lng: 2.3 });
    assert.equal(parsed.radius, PILOT_CITY.defaultRadiusKm);
  });
});
