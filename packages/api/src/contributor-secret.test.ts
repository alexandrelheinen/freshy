import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contributorSecretForUser } from './users';

describe('contributor secret', () => {
  it('uses the Freshy user id as the anonymous submission secret', () => {
    assert.equal(contributorSecretForUser({ id: 'usr_clerk_synced_01' }), 'usr_clerk_synced_01');
  });
});
