import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY } from '@freshy/config/pilot-city';
import {
  categoryPlacesQuerySchema,
  listCategoryPlacesPage,
  explorePlaceStatuses,
  parseStoredTags,
  placesQuerySchema,
  serializePlaceForApi,
} from './places';

describe('placesQuerySchema', () => {
  it('defaults search radius to the pilot city config', () => {
    const parsed = placesQuerySchema.parse({ lat: 48.9, lng: 2.3 });
    assert.equal(parsed.radius, PILOT_CITY.defaultRadiusKm);
  });

  it('parses verifiedOnly from common query string values', () => {
    assert.equal(
      placesQuerySchema.parse({ lat: 48.9, lng: 2.3, verifiedOnly: 'true' }).verifiedOnly,
      true,
    );
    assert.equal(
      placesQuerySchema.parse({ lat: 48.9, lng: 2.3, verifiedOnly: 'false' }).verifiedOnly,
      false,
    );
    assert.equal(placesQuerySchema.parse({ lat: 48.9, lng: 2.3 }).verifiedOnly, false);
  });

  it('parses minFreshnessLevel from query strings', () => {
    assert.equal(
      placesQuerySchema.parse({ lat: 48.9, lng: 2.3, minFreshnessLevel: '2' }).minFreshnessLevel,
      2,
    );
  });
});

describe('categoryPlacesQuerySchema', () => {
  it('defaults category list pagination to five places per page', () => {
    const parsed = categoryPlacesQuerySchema.parse({
      lat: 48.9,
      lng: 2.3,
      category: 'MUSEUM',
    });
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 5);
    assert.equal(parsed.radius, PILOT_CITY.defaultRadiusKm);
  });
});

describe('explorePlaceStatuses', () => {
  it('returns every place unless verifiedOnly is enabled', () => {
    const base = placesQuerySchema.parse({ lat: 48.9, lng: 2.3 });
    assert.equal(explorePlaceStatuses(base), null);
    assert.deepEqual(explorePlaceStatuses({ ...base, verifiedOnly: true }), ['PUBLISHED']);
  });
});

describe('parseStoredTags', () => {
  it('parses JSON-encoded tag arrays from D1', () => {
    assert.deepEqual(parseStoredTags('["calm","wifi"]'), ['calm', 'wifi']);
  });

  it('returns an empty array for missing or invalid tags', () => {
    assert.deepEqual(parseStoredTags(null), []);
    assert.deepEqual(parseStoredTags('not-json'), []);
    assert.deepEqual(parseStoredTags('{"a":1}'), []);
  });

  it('passes through arrays unchanged', () => {
    assert.deepEqual(parseStoredTags(['calm']), ['calm']);
  });
});

describe('listCategoryPlacesPage', () => {
  it('returns every place in the category sorted by distance without a radius cap', async () => {
    const farMuseum = {
      id: 'museum-far',
      slug: 'far-museum',
      name: 'Far Museum',
      description: null,
      category: 'MUSEUM' as const,
      latitude: 49.5,
      longitude: 2.8,
      address: null,
      photoUrl: null,
      aggregatedFreshnessLevel: 'MODEST_AC' as const,
      status: 'PUBLISHED' as const,
      tags: '[]',
      createdById: null,
      isOpen: true,
      createdAt: '',
      updatedAt: '',
    };
    const nearMuseum = {
      ...farMuseum,
      id: 'museum-near',
      slug: 'near-museum',
      name: 'Near Museum',
      latitude: PILOT_CITY.latitude + 0.001,
      longitude: PILOT_CITY.longitude + 0.001,
    };

    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [nearMuseum, farMuseum],
          }),
        }),
      }),
    } as unknown as Parameters<typeof listCategoryPlacesPage>[0];

    const page = await listCategoryPlacesPage(db, {
      lat: PILOT_CITY.latitude,
      lng: PILOT_CITY.longitude,
      radius: PILOT_CITY.defaultRadiusKm,
      category: 'MUSEUM',
      page: 1,
      limit: 10,
    });

    assert.equal(page.total, 2);
    assert.equal(page.items.length, 2);
    assert.equal(page.items[0]?.slug, 'near-museum');
    assert.equal(page.items[1]?.slug, 'far-museum');
    assert.ok((page.items[1]?.distanceKm ?? 0) > PILOT_CITY.defaultRadiusKm);
    assert.equal(page.nearbyCount, 1);
  });
});

describe('serializePlaceForApi', () => {
  it('parses JSON-encoded tags and resolves photo URLs for API clients', () => {
    const serialized = serializePlaceForApi({
      id: 'p1',
      slug: 'cafe-test',
      name: 'Test Cafe',
      category: 'CAFE',
      photoUrl: null,
      tags: '["calm","free_wifi"]',
      createdById: 'user-hidden',
    } as Parameters<typeof serializePlaceForApi>[0]);

    assert.deepEqual(serialized.tags, ['calm', 'free_wifi']);
    assert.equal(typeof serialized.photoUrl, 'string');
    assert.ok(serialized.photoUrl.length > 0);
    assert.equal('createdById' in serialized, false);
  });
});
