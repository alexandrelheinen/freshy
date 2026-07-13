import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CORNER_STYLE, CORNER_STYLES, isCornerStyle } from './corner-style';

describe('@freshy/config corner-style', () => {
  it('exports a valid default corner style', () => {
    assert.ok(CORNER_STYLES.includes(CORNER_STYLE));
  });

  it('validates corner style values', () => {
    assert.equal(isCornerStyle('rounded'), true);
    assert.equal(isCornerStyle('sharp'), true);
    assert.equal(isCornerStyle('pill'), false);
    assert.equal(isCornerStyle(null), false);
  });
});
