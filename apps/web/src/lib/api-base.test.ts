import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_API_URL, PRODUCTION_API_URL } from '@freshy/config/public-api';

describe('getApiBase', () => {
  it('uses NEXT_PUBLIC_API_URL when it points at the Worker', async () => {
    const previous = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = `${PRODUCTION_API_URL}/`;
    const { getApiBase } = await import('./api-base');
    assert.equal(getApiBase(), PRODUCTION_API_URL);
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previous;
  });

  it('falls back to the production Worker on Pages hosts when env is localhost', async () => {
    const previous = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = LOCAL_API_URL;
    const { getApiBase } = await import('./api-base');
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { hostname: 'getfreshy.pages.dev' } },
    });

    assert.equal(getApiBase(), PRODUCTION_API_URL);

    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }

    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = previous;
  });
});
