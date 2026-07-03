import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readR2S3Config, r2ObjectPublicUrl, r2S3Endpoint } from './r2-s3';

describe('@freshy/config r2-s3', () => {
  it('returns null when required R2 credentials are missing', () => {
    assert.equal(readR2S3Config({}), null);
    assert.equal(
      readR2S3Config({
        R2_ACCOUNT_ID: 'acct',
        R2_ACCESS_KEY_ID: 'key',
      }),
      null,
    );
  });

  it('reads a complete R2 S3 config from env', () => {
    assert.deepEqual(
      readR2S3Config({
        R2_ACCOUNT_ID: 'acct',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_BUCKET_NAME: 'freshy-assets',
        R2_PUBLIC_URL: 'https://assets.freshy.app/',
      }),
      {
        accountId: 'acct',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        bucketName: 'freshy-assets',
        publicUrl: 'https://assets.freshy.app/',
      },
    );
  });

  it('builds the R2 S3 endpoint and public object URL', () => {
    assert.equal(r2S3Endpoint('acct'), 'https://acct.r2.cloudflarestorage.com');
    assert.equal(
      r2ObjectPublicUrl('https://assets.freshy.app', 'places/defaults/default-cafe.png'),
      'https://assets.freshy.app/places/defaults/default-cafe.png',
    );
  });
});
