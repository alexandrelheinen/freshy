import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  contributorForCreatedById,
  contributorFromJoinedUser,
  joinedUserProfile,
  normalizeCreatedById,
  syntheticContributorForProviderId,
  type StudioContributor,
} from './studio-contributors';

describe('studio-contributors', () => {
  it('normalizes createdById whitespace', () => {
    assert.equal(normalizeCreatedById('  user_a  '), 'user_a');
    assert.equal(normalizeCreatedById(''), null);
    assert.equal(normalizeCreatedById(null), null);
  });

  it('returns synthetic profiles for import provider ids', () => {
    const osm = syntheticContributorForProviderId('osm');
    assert.equal(osm?.displayName, 'OpenStreetMap Import');
    assert.equal(syntheticContributorForProviderId('missing'), null);
  });

  it('resolves contributors from a prebuilt map using trimmed ids', () => {
    const map = new Map<string, StudioContributor>([
      [
        'cmqzvtuqr0000fe1yr9igjpxf',
        {
          id: 'cmqzvtuqr0000fe1yr9igjpxf',
          email: 'alex@example.com',
          displayName: 'Alexandre Loeblein Heinen',
          username: 'alex',
        },
      ],
    ]);

    assert.equal(
      contributorForCreatedById(' cmqzvtuqr0000fe1yr9igjpxf ', map)?.displayName,
      'Alexandre Loeblein Heinen',
    );
    assert.equal(contributorForCreatedById('osm', map)?.displayName, 'OpenStreetMap Import');
  });

  it('builds a profile from a joined user row with nullable columns', () => {
    assert.deepEqual(
      joinedUserProfile({
        userId: 'user_a',
        email: 'marie@example.com',
        displayName: 'Marie',
        username: 'marie',
      }),
      {
        id: 'user_a',
        email: 'marie@example.com',
        displayName: 'Marie',
        username: 'marie',
      },
    );
    assert.equal(
      joinedUserProfile({
        userId: 'user_a',
        email: null,
        displayName: 'Marie',
        username: 'marie',
      }),
      null,
    );
  });

  it('resolves contributors from a Place LEFT JOIN User row', () => {
    const fromUser = contributorFromJoinedUser('user_a', {
      id: 'user_a',
      email: 'marie@example.com',
      displayName: 'Marie',
      username: 'marie',
    });
    assert.equal(fromUser?.displayName, 'Marie');

    const fromImport = contributorFromJoinedUser('osm', null);
    assert.equal(fromImport?.displayName, 'OpenStreetMap Import');
  });
});
