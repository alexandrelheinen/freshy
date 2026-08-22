import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWebAppUrl } from './web-app-url';

describe('resolveWebAppUrl', () => {
  it('falls back to the production Pages URL when extra config is missing', () => {
    assert.equal(resolveWebAppUrl(undefined), 'https://getfreshy.pages.dev');
    assert.equal(resolveWebAppUrl(null), 'https://getfreshy.pages.dev');
    assert.equal(resolveWebAppUrl(''), 'https://getfreshy.pages.dev');
  });

  it('trims trailing slashes from configured URLs', () => {
    assert.equal(resolveWebAppUrl('https://example.test/freshy/'), 'https://example.test/freshy');
  });
});
