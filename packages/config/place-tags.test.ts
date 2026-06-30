import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { PLACE_TAGS, PLACE_TAG_IDS, PLACE_TAG_LABELS, type PlaceTagConfig } from './place-tags';

function loadPlaceTagsFromYaml(): PlaceTagConfig {
  const configDir = dirname(fileURLToPath(import.meta.url));
  const yamlPath = join(configDir, 'place-tags.yaml');
  return parse(readFileSync(yamlPath, 'utf8')) as PlaceTagConfig;
}

describe('place-tags', () => {
  it('loads tags from place-tags.yaml', () => {
    const config = loadPlaceTagsFromYaml();
    assert.equal(config.tags.length, 7);
    assert.deepEqual(
      config.tags.map((tag) => tag.id),
      ['calm', 'comfortable', 'pet_friendly', 'shaded', 'free_wifi', 'fun', 'foodie'],
    );
  });

  it('keeps runtime exports in sync with place-tags.yaml', () => {
    const config = loadPlaceTagsFromYaml();
    assert.deepEqual(PLACE_TAGS, config.tags);
  });

  it('defines labels and ids for every tag', () => {
    for (const tag of PLACE_TAGS) {
      assert.equal(PLACE_TAG_LABELS[tag.id], tag.label);
      assert.ok(PLACE_TAG_IDS.includes(tag.id));
    }
  });
});
