import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readWebAppUrl } from './web-app-url';

describe('readWebAppUrl', () => {
  it('falls back to the production Pages URL when extra config is missing', () => {
    assert.equal(readWebAppUrl(), 'https://freshy-25e.pages.dev');
  });
});
