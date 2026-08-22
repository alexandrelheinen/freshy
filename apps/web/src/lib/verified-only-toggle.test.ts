import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifiedOnlyToggleCopy } from './verified-only-toggle';

describe('verifiedOnlyToggleCopy', () => {
  it('pairs the default (unpressed) control with current show-all state, not a show-all action', () => {
    const copy = verifiedOnlyToggleCopy(false);
    assert.equal(copy.pressed, false);
    assert.equal(copy.stateLabel, 'Off');
    assert.equal(copy.ariaLabel, 'Showing all places including unverified');
    assert.doesNotMatch(copy.ariaLabel, /^Show all places/);
  });

  it('pairs the pressed control with verified-only current state', () => {
    const copy = verifiedOnlyToggleCopy(true);
    assert.equal(copy.pressed, true);
    assert.equal(copy.stateLabel, 'On');
    assert.equal(copy.ariaLabel, 'Showing verified places only');
  });
});
