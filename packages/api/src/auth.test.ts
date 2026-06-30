import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractRoleFromClaims, isAdminRole } from './auth';

describe('auth roles', () => {
  it('detects admin role', () => {
    assert.equal(isAdminRole('admin'), true);
    assert.equal(isAdminRole('user'), false);
    assert.equal(isAdminRole(undefined), false);
    assert.equal(isAdminRole(null), false);
  });

  it('extracts role from JWT claims', () => {
    assert.equal(extractRoleFromClaims({ role: 'admin' }), 'admin');
    assert.equal(extractRoleFromClaims({ metadata: { role: 'admin' } }), 'admin');
    assert.equal(extractRoleFromClaims({ public_metadata: { role: 'admin' } }), 'admin');
    assert.equal(extractRoleFromClaims({}), undefined);
  });
});
