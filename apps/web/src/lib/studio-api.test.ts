import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStudioAdmin,
  mergeStudioPlaceContributor,
  mergeStudioPlaceContributors,
  normalizeStudioPlaceTags,
  type StudioContributorDto,
  type StudioPlaceDto,
} from './studio-api';

describe('studio-api', () => {
  it('detects studio admin metadata', () => {
    assert.equal(isStudioAdmin({ role: 'admin' }), true);
    assert.equal(isStudioAdmin({ role: 'user' }), false);
    assert.equal(isStudioAdmin({}), false);
    assert.equal(isStudioAdmin(null), false);
  });

  it('normalizes studio place tags from arrays or JSON strings', () => {
    assert.deepEqual(normalizeStudioPlaceTags(['calm', 'foodie']), ['calm', 'foodie']);
    assert.deepEqual(normalizeStudioPlaceTags('["calm","foodie"]'), ['calm', 'foodie']);
    assert.deepEqual(normalizeStudioPlaceTags('not-json'), []);
    assert.deepEqual(normalizeStudioPlaceTags(null), []);
  });

  it('merges contributor profiles from createdById when API omits contributor', () => {
    const contributorsById = new Map<string, StudioContributorDto>([
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

    const place = {
      id: 'place_1',
      slug: 'cool-cafe',
      name: 'Cool Cafe',
      description: null,
      category: 'CAFE',
      latitude: 48.9,
      longitude: 2.3,
      address: '1 Rue Test',
      photoUrl: null,
      aggregatedFreshnessLevel: 'MODEST_AC',
      tags: ['calm'],
      status: 'DRAFT',
      createdById: 'user_a',
      studioStatus: 'pending',
      duplicateOfId: null,
      contributor: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    } satisfies StudioPlaceDto;

    const merged = mergeStudioPlaceContributor(place, contributorsById);
    assert.equal(merged.contributor?.email, 'marie@example.com');
  });

  it('falls back to import provider labels when API omits contributor rows', () => {
    const merged = mergeStudioPlaceContributor(
      {
        id: 'place_import',
        slug: 'imported-place',
        name: 'Imported Place',
        description: null,
        category: 'LIBRARY',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        photoUrl: null,
        aggregatedFreshnessLevel: 'MODEST_AC',
        tags: [],
        status: 'DRAFT',
        createdById: 'osm',
        studioStatus: 'pending',
        duplicateOfId: null,
        contributor: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      new Map(),
    );
    assert.equal(merged.contributor?.displayName, 'OpenStreetMap Import');
  });

  it('keeps an existing contributor from the API response', () => {
    const contributorsById = new Map<string, StudioContributorDto>();
    const place = {
      id: 'place_1',
      slug: 'cool-cafe',
      name: 'Cool Cafe',
      description: null,
      category: 'CAFE',
      latitude: 48.9,
      longitude: 2.3,
      address: null,
      aggregatedFreshnessLevel: null,
      tags: [],
      status: 'DRAFT',
      createdById: 'user_a',
      studioStatus: 'pending',
      duplicateOfId: null,
      contributor: {
        id: 'user_a',
        email: 'marie@example.com',
        displayName: 'Marie',
        username: 'marie',
      },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    } satisfies StudioPlaceDto;

    const merged = mergeStudioPlaceContributor(place, contributorsById);
    assert.equal(merged.contributor?.email, 'marie@example.com');
  });

  it('merges contributors for signed-in and anonymous submissions alike', () => {
    const contributorsById = new Map<string, StudioContributorDto>([
      [
        'user_signed_in',
        {
          id: 'user_signed_in',
          email: 'signed-in@example.com',
          displayName: 'Signed In',
          username: 'signed_in',
        },
      ],
      [
        'user_anonymous',
        {
          id: 'user_anonymous',
          email: 'anonymous@example.com',
          displayName: 'Anonymous',
          username: 'anonymous',
        },
      ],
    ]);

    const places = [
      {
        id: 'place_1',
        slug: 'auth-place',
        name: 'Auth Place',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: null,
        tags: [],
        status: 'DRAFT',
        createdById: 'user_signed_in',
        studioStatus: 'pending',
        duplicateOfId: null,
        contributor: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'place_2',
        slug: 'anon-place',
        name: 'Anonymous Place',
        description: null,
        category: 'CAFE',
        latitude: 48.9,
        longitude: 2.3,
        address: null,
        aggregatedFreshnessLevel: null,
        tags: [],
        status: 'DRAFT',
        createdById: 'user_anonymous',
        studioStatus: 'pending',
        duplicateOfId: null,
        contributor: null,
        createdAt: '2025-01-02T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
    ] satisfies StudioPlaceDto[];

    const merged = mergeStudioPlaceContributors(places, contributorsById);
    assert.equal(merged[0]?.contributor?.email, 'signed-in@example.com');
    assert.equal(merged[1]?.contributor?.email, 'anonymous@example.com');
  });
});
