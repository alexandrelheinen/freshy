import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anonymousCreatePlaceSchema } from './anonymous-contribution';

describe('anonymous-contribution', () => {
  it('requires secret on anonymous place payload', () => {
    const parsed = anonymousCreatePlaceSchema.safeParse({
      name: 'Cool Spot',
      category: 'CAFE',
      address: '1 Rue Martre, 92110 Clichy',
      latitude: 48.9,
      longitude: 2.3,
      aggregatedFreshnessLevel: 'MODEST_AC',
      tags: ['calm'],
    });
    assert.equal(parsed.success, false);
  });

  it('accepts anonymous place payload with secret', () => {
    const parsed = anonymousCreatePlaceSchema.safeParse({
      name: 'Cool Spot',
      category: 'CAFE',
      address: '1 Rue Martre, 92110 Clichy',
      latitude: 48.9,
      longitude: 2.3,
      aggregatedFreshnessLevel: 'MODEST_AC',
      tags: ['calm'],
      secret: 'user-uuid-123',
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.secret, 'user-uuid-123');
    }
  });
});
