import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDuplicatePlaceIds,
  formatStudioPlaceListItem,
  mergePlacesSchema,
  parseUpdateStudioPlaceFields,
  studioContributorForPlace,
  studioDuplicatesQuerySchema,
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

  it('validates studio duplicate scan query', () => {
    const parsed = studioDuplicatesQuerySchema.safeParse({ page: 2, limit: 50 });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.page, 2);
      assert.equal(parsed.data.limit, 50);
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

  it('resolves contributor for a place when createdById is known', () => {
    const contributors = new Map([
      [
        'user_a',
        {
          id: 'user_a',
          email: 'marie@example.com',
          displayName: 'Marie',
          username: 'marie',
        },
      ],
    ]);
    assert.deepEqual(studioContributorForPlace('user_a', contributors), contributors.get('user_a'));
    assert.equal(studioContributorForPlace(null, contributors), null);
    assert.equal(studioContributorForPlace('missing', contributors), null);
  });

  it('formats studio list items with parsed tags for API clients', () => {
    const item = formatStudioPlaceListItem(
      {
        id: 'p1',
        slug: 'test-cafe',
        name: 'Test Cafe',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: '1 Rue Test',
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: '["calm","foodie"]',
        isOpen: true,
        createdById: null,
        status: 'DRAFT',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      null,
      null,
    );
    assert.deepEqual(item.tags, ['calm', 'foodie']);
    assert.equal(item.studioStatus, 'pending');
    assert.equal(item.createdById, null);
  });

  it('includes createdById on studio list items for client-side contributor resolution', () => {
    const item = formatStudioPlaceListItem(
      {
        id: 'p1',
        slug: 'test-cafe',
        name: 'Test Cafe',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: '1 Rue Test',
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: '[]',
        isOpen: true,
        createdById: 'user_a',
        status: 'DRAFT',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      null,
      null,
    );
    assert.equal(item.createdById, 'user_a');
    assert.equal(item.contributor, null);
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

  it('keeps duplicate detection fast for large place sets', () => {
    const places = Array.from({ length: 2000 }, (_, index) => ({
      id: `place-${index}`,
      latitude: 48.9 + (index % 50) * 0.00001,
      longitude: 2.3 + Math.floor(index / 50) * 0.00001,
      createdAt: new Date(Date.UTC(2025, 0, 1, 0, 0, index)),
    }));

    const startedAt = Date.now();
    const duplicates = detectDuplicatePlaceIds(places);
    const elapsedMs = Date.now() - startedAt;

    assert.ok(duplicates.size > 0);
    assert.ok(elapsedMs < 2000, `duplicate scan took ${elapsedMs}ms`);
  });
});
