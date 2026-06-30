import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACE_TAGS,
  loadPlaceTagsFromYaml,
  PLACE_TAG_IDS,
  PLACE_TAG_LABELS,
} from './place-tags';

describe('place-tags', () => {
  it('loads tags from place-tags.yaml', () => {
    const config = loadPlaceTagsFromYaml();
    assert.equal(config.tags.length, 6);
    assert.deepEqual(
      config.tags.map((tag) => tag.id),
      ['calm', 'comfortable', 'pet_friendly', 'shaded', 'quiet', 'free_wifi'],
    );
  });

  it('keeps runtime exports in sync with place-tags.yaml', () => {
    const config = loadPlaceTagsFromYaml();
    assert.deepEqual(PLACE_TAGS, config.tags);
  });

  it('defines labels and ids for every tag', () => {
    for (const tag of PLACE_TAGS) {
      assert.equal(PLACE_TAG_LABELS[tag.id as keyof typeof PLACE_TAG_LABELS], tag.label);
      assert.ok(PLACE_TAG_IDS.includes(tag.id as (typeof PLACE_TAG_IDS)[number]));
    }
  });
});
