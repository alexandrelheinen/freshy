import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDuplicatePlaceIds,
  mergePlacesSchema,
  parseUpdateStudioPlaceFields,
  studioPlacesQuerySchema,
  updateStudioPlaceSchema,
} from './studio-places';

describe('studio-places', () => {
  it('validates studio list query', () => {
    const parsed = studioPlacesQuerySchema.safeParse({ status: 'pending', q: 'cafe' });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.status, 'pending');
    }
  });

  it('validates studio update payload', () => {
    const parsed = updateStudioPlaceSchema.safeParse({
      name: 'Cool Library',
      status: 'PUBLISHED',
    });
    assert.equal(parsed.success, true);
  });

  it('validates studio update with photo URL and tags', () => {
    const parsed = updateStudioPlaceSchema.safeParse({
      photoUrl: 'https://cdn.example.com/photo.jpg',
      tags: ['calm', 'shaded'],
    });
    assert.equal(parsed.success, true);
  });

  it('allows clearing photo URL in studio update', () => {
    const parsed = updateStudioPlaceSchema.safeParse({ photoUrl: null });
    assert.equal(parsed.success, true);
  });

  it('parses multipart studio update fields', () => {
    const parsed = parseUpdateStudioPlaceFields({
      name: 'Updated Cafe',
      tags: '["calm","foodie"]',
      freshnessLevel: 'VERY_COLD_AC',
      status: 'PUBLISHED',
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, 'Updated Cafe');
      assert.deepEqual(parsed.data.tags, ['calm', 'foodie']);
      assert.equal(parsed.data.aggregatedFreshnessLevel, 'VERY_COLD_AC');
    }
  });

  it('validates merge payload', () => {
    const parsed = mergePlacesSchema.safeParse({
      targetPlaceId: 'place_a',
      sourcePlaceId: 'place_b',
    });
    assert.equal(parsed.success, true);
    assert.equal(parsed.success && parsed.data.targetPlaceId !== parsed.data.sourcePlaceId, true);
  });

  it('rejects merge when source and target are the same', () => {
    const parsed = mergePlacesSchema.safeParse({
      targetPlaceId: 'place_a',
      sourcePlaceId: 'place_a',
    });
    assert.equal(parsed.success, false);
  });

  it('flags nearby places as duplicates', () => {
    const places = [
      { id: 'a', latitude: 48.9, longitude: 2.3, createdAt: new Date('2025-01-01') },
      { id: 'b', latitude: 48.9001, longitude: 2.3001, createdAt: new Date('2025-02-01') },
      { id: 'c', latitude: 49.0, longitude: 2.5, createdAt: new Date('2025-01-15') },
    ];
    const duplicates = detectDuplicatePlaceIds(places);
    assert.deepEqual(duplicates.get('b'), 'a');
    assert.equal(duplicates.has('a'), false);
    assert.equal(duplicates.has('c'), false);
  });
});
