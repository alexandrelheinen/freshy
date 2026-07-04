import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildNativeSafeAreaScript } from './safe-area-bridge';

describe('buildNativeSafeAreaScript', () => {
  it('injects rounded safe area inset CSS variables', () => {
    const script = buildNativeSafeAreaScript({ top: 47.6, right: 0, bottom: 34.2, left: 0 });

    assert.match(script, /--safe-area-inset-top','48px/);
    assert.match(script, /--safe-area-inset-bottom','34px/);
    assert.match(script, /document\.documentElement/);
  });

  it('injects zero top inset when the native shell owns the status bar offset', () => {
    const script = buildNativeSafeAreaScript({ top: 0, right: 0, bottom: 0, left: 0 });

    assert.match(script, /--safe-area-inset-top','0px/);
    assert.match(script, /--safe-area-inset-bottom','0px/);
  });
});
