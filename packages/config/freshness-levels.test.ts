import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {
  FRESHNESS_LEVELS,
  FRESHNESS_LEVEL_LABELS,
  FRESHNESS_LEVEL_SHORT_LABELS,
  freshnessBarSegments,
  freshnessLevelScore,
  freshnessTone,
  type FreshnessLevelConfig,
  type FreshnessLevelId,
} from './freshness-levels';

function loadFreshnessLevelsFromYaml(): FreshnessLevelConfig {
  const configDir = dirname(fileURLToPath(import.meta.url));
  const yamlPath = join(configDir, 'freshness-levels.yaml');
  return parse(readFileSync(yamlPath, 'utf8')) as FreshnessLevelConfig;
}

describe('freshness-levels', () => {
  it('loads levels from freshness-levels.yaml', () => {
    const config = loadFreshnessLevelsFromYaml();
    assert.equal(config.levels.length, 5);
    assert.deepEqual(
      config.levels.map((level) => level.id),
      ['NONE', 'GOOD_VENTILATION', 'MODEST_AC', 'VERY_COLD_AC', 'NATURALLY_FRESH'],
    );
  });

  it('keeps runtime exports in sync with freshness-levels.yaml', () => {
    const config = loadFreshnessLevelsFromYaml();
    assert.deepEqual(FRESHNESS_LEVELS, config.levels);
  });

  it('maps bar segments and tones per level', () => {
    assert.equal(freshnessBarSegments('NONE'), 0);
    assert.equal(freshnessBarSegments('GOOD_VENTILATION'), 1);
    assert.equal(freshnessBarSegments('MODEST_AC'), 2);
    assert.equal(freshnessBarSegments('VERY_COLD_AC'), 3);
    assert.equal(freshnessBarSegments('NATURALLY_FRESH'), 3);
    assert.equal(freshnessTone('NATURALLY_FRESH'), 'green');
    assert.equal(freshnessLevelScore('VERY_COLD_AC'), 3);
    assert.equal(freshnessLevelScore(null), null);
    assert.equal(FRESHNESS_LEVEL_LABELS.NATURALLY_FRESH, 'Naturally Fresh');
  });

  it('exposes one user-facing label per freshness enum', () => {
    const expected: Record<FreshnessLevelId, string> = {
      NONE: 'No Cooling',
      GOOD_VENTILATION: 'Good Ventilation',
      MODEST_AC: 'Modest AC',
      VERY_COLD_AC: 'Very Cold AC',
      NATURALLY_FRESH: 'Naturally Fresh',
    };

    for (const level of FRESHNESS_LEVELS) {
      assert.equal(level.label, expected[level.id]);
      assert.equal(level.shortLabel, expected[level.id]);
      assert.equal(FRESHNESS_LEVEL_LABELS[level.id], expected[level.id]);
      assert.equal(FRESHNESS_LEVEL_SHORT_LABELS[level.id], expected[level.id]);
    }
  });
});
