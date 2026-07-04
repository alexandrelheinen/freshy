import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNativeColorScheme } from './theme-bridge';

describe('mobile theme bridge', () => {
  it('maps React Native color scheme values to web bridge values', () => {
    assert.equal(resolveNativeColorScheme('dark'), 'dark');
    assert.equal(resolveNativeColorScheme('light'), 'light');
    assert.equal(resolveNativeColorScheme(null), 'light');
    assert.equal(resolveNativeColorScheme(undefined), 'light');
  });
});
