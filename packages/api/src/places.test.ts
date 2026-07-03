import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_CITY } from '@freshy/config/pilot-city';
import {
  categoryPlacesQuerySchema,
  parseStoredTags,
  placesQuerySchema,
  publishedPlaceStatuses,
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

describe('publishedPlaceStatuses', () => {
  it('includes draft places unless verifiedOnly is enabled', () => {
    const base = placesQuerySchema.parse({ lat: 48.9, lng: 2.3 });
    assert.deepEqual(publishedPlaceStatuses(base), ['PUBLISHED', 'DRAFT']);
    assert.deepEqual(publishedPlaceStatuses({ ...base, verifiedOnly: true }), ['PUBLISHED']);
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
