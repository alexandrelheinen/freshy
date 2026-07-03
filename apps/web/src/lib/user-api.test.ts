import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anonymousPlaceErrorMessage, UNKNOWN_SECRET_MESSAGE } from './user-api';

describe('anonymousPlaceErrorMessage', () => {
  it('returns the API message for unknown secrets', () => {
    assert.equal(
      anonymousPlaceErrorMessage(400, {
        error: 'UNKNOWN_SECRET',
        message: UNKNOWN_SECRET_MESSAGE,
      }),
      UNKNOWN_SECRET_MESSAGE,
    );
  });

  it('returns the API message for missing secrets', () => {
    assert.equal(
      anonymousPlaceErrorMessage(400, {
        error: 'MISSING_SECRET',
        message: UNKNOWN_SECRET_MESSAGE,
      }),
      UNKNOWN_SECRET_MESSAGE,
    );
  });
});
