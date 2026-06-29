import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placesQuerySchema } from './places';

describe('@freshy/api places query', () => {
  it('parses geo query params with defaults', () => {
    const parsed = placesQuerySchema.parse({ lat: '-23.55', lng: '-46.63', radius: '2' });
    assert.equal(parsed.radius, 2);
    assert.ok(parsed.lat && parsed.lng);
  });

  it('rejects invalid latitude', () => {
    assert.throws(() => placesQuerySchema.parse({ lat: '999' }));
  });
});
