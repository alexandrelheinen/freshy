import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCreatePlaceFields } from './place-submission';

describe('place-submission', () => {
  it('parses multipart-style place fields', () => {
    const parsed = parseCreatePlaceFields({
      name: 'Le 34 Paris',
      category: 'BAR',
      address: '34 Rue Léon, 75018 Paris',
      aggregatedFreshnessLevel: 'VERY_COLD_AC',
      tags: '["calm"]',
      latitude: '48.8865',
      longitude: '2.3442',
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.latitude, 48.8865);
      assert.equal(parsed.data.tags[0], 'calm');
      assert.equal(parsed.data.status, 'DRAFT');
    }
  });
});
