import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaceSchema } from './create-place';

describe('authenticated place submission', () => {
  it('ignores a secret field on createPlaceSchema payloads', () => {
    const parsed = createPlaceSchema.safeParse({
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
      assert.equal('secret' in parsed.data, false);
    }
  });

  it('accepts the same payload once secret is stripped for authed routes', () => {
    const body = {
      name: 'Cool Spot',
      category: 'CAFE',
      address: '1 Rue Martre, 92110 Clichy',
      latitude: 48.9,
      longitude: 2.3,
      aggregatedFreshnessLevel: 'MODEST_AC',
      tags: ['calm'],
      secret: 'user-uuid-123',
    };
    const { secret: _ignoredSecret, ...bodyWithoutSecret } = body;
    const parsed = createPlaceSchema.safeParse(bodyWithoutSecret);
    assert.equal(parsed.success, true);
  });
});
