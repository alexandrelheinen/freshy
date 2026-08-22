import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FRESHNESS_LEVEL_IDS, FRESHNESS_LEVEL_LABELS } from '@freshy/ui';
import { freshnessLabel } from './map-markers';

describe('freshnessLabel', () => {
  it('uses the catalog label for every freshness enum', () => {
    for (const id of FRESHNESS_LEVEL_IDS) {
      assert.equal(freshnessLabel(id), FRESHNESS_LEVEL_LABELS[id].toUpperCase());
    }
  });

  it('does not use a second name for modest AC or good ventilation', () => {
    assert.equal(freshnessLabel('MODEST_AC'), 'MODEST AC');
    assert.equal(freshnessLabel('GOOD_VENTILATION'), 'GOOD VENTILATION');
    assert.notEqual(freshnessLabel('MODEST_AC'), 'PLEASANT AC');
    assert.notEqual(freshnessLabel('GOOD_VENTILATION'), 'VENTILATED');
  });
});
