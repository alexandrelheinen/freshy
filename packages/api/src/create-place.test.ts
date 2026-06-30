import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaceSchema, slugifyPlaceName } from './create-place';

describe('create-place', () => {
  it('slugifies place names', () => {
    assert.equal(slugifyPlaceName('Ice Coffee Central'), 'ice-coffee-central');
    assert.equal(slugifyPlaceName('  Café Glacial!!! '), 'caf-glacial');
  });

  it('validates create place payload', () => {
    const parsed = createPlaceSchema.safeParse({
      name: 'Cool Spot',
      category: 'CAFE',
      address: '1 Rue Martre, 92110 Clichy',
      latitude: 48.9,
      longitude: 2.3,
      aggregatedFreshnessLevel: 'MODEST_AC',
      tags: ['calm'],
      status: 'PUBLISHED',
    });
    assert.equal(parsed.success, true);
  });

  it('rejects invalid freshness level', () => {
    const parsed = createPlaceSchema.safeParse({
      name: 'Cool Spot',
      category: 'CAFE',
      address: '1 Rue Martre',
      latitude: 48.9,
      longitude: 2.3,
      aggregatedFreshnessLevel: 'INVALID',
    });
    assert.equal(parsed.success, false);
  });
});
