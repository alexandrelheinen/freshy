import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ANDROID_STATUS_BAR_FALLBACK_PX,
  buildWebViewSafeAreaInsets,
  resolveTopInset,
} from './resolve-safe-area-insets';

describe('resolveTopInset', () => {
  it('returns rounded native inset when it is positive', () => {
    assert.equal(resolveTopInset(47.6, 'ios'), 48);
    assert.equal(resolveTopInset(24, 'android'), 24);
  });

  it('uses expo status bar height on Android when native inset is zero', () => {
    assert.equal(resolveTopInset(0, 'android', 32), 32);
  });

  it('falls back to a safe Android default when inset and status bar height are zero', () => {
    assert.equal(resolveTopInset(0, 'android', 0), ANDROID_STATUS_BAR_FALLBACK_PX);
    assert.equal(resolveTopInset(0, 'android'), ANDROID_STATUS_BAR_FALLBACK_PX);
  });

  it('does not apply Android fallback on iOS', () => {
    assert.equal(resolveTopInset(0, 'ios'), 0);
  });
});

describe('buildWebViewSafeAreaInsets', () => {
  it('zeros top and bottom because the native shell owns vertical safe areas', () => {
    assert.deepEqual(buildWebViewSafeAreaInsets({ top: 48, right: 4.2, bottom: 34, left: 0 }), {
      top: 0,
      right: 4,
      bottom: 0,
      left: 0,
    });
  });
});
