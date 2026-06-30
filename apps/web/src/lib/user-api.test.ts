import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPlaceErrorMessage } from './user-api';

describe('user-api create place errors', () => {
  it('maps auth failures to a sign-in message', () => {
    assert.match(createPlaceErrorMessage(401, {}), /session expired/i);
  });

  it('maps database unavailable to an actionable message', () => {
    assert.match(
      createPlaceErrorMessage(503, { error: 'Database unavailable' }),
      /database is unavailable/i,
    );
  });

  it('maps validation failures to form guidance', () => {
    assert.match(createPlaceErrorMessage(400, { error: 'Invalid body' }), /check the form/i);
  });

  it('maps network-style failures to a generic retry message', () => {
    assert.match(createPlaceErrorMessage(500, {}), /try again/i);
  });
});
