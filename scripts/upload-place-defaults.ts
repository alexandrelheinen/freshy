import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import {
  PLACE_PHOTO_CATEGORIES,
  defaultPlacePhotoFilename,
  defaultPlacePhotoR2Key,
} from '@freshy/config/place-photos';
import { readR2S3Config, r2ObjectPublicUrl, r2S3Endpoint } from '@freshy/config/r2-s3';

const SOURCE_DIR = path.join(process.cwd(), 'apps/web/public/place-defaults');

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function uploadObject(
  config: NonNullable<ReturnType<typeof readR2S3Config>>,
  localPath: string,
  objectKey: string,
): void {
  const result = spawnSync(
    'aws',
    [
      's3',
      'cp',
      localPath,
      `s3://${config.bucketName}/${objectKey}`,
      '--endpoint-url',
      r2S3Endpoint(config.accountId),
      '--content-type',
      'image/png',
      '--cache-control',
      'public, max-age=86400',
      '--quiet',
    ],
    {
      env: {
        ...process.env,
        AWS_ACCESS_KEY_ID: config.accessKeyId,
        AWS_SECRET_ACCESS_KEY: config.secretAccessKey,
        AWS_DEFAULT_REGION: 'auto',
      },
      stdio: 'pipe',
    },
  );

  if (result.status !== 0) {
    const detail = result.stderr?.toString().trim() || result.stdout?.toString().trim();
    throw new Error(detail || `aws s3 cp failed for ${objectKey}`);
  }
}

async function main(): Promise<void> {
  const config = readR2S3Config();
  if (!config) {
    console.error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.',
    );
    process.exit(1);
  }

  if (!config.publicUrl) {
    console.warn(
      'Warning: R2_PUBLIC_URL is not set. Objects will upload but public URLs may be incomplete.',
    );
  }

  console.log(`Uploading default place photos from ${SOURCE_DIR}`);

  for (const category of PLACE_PHOTO_CATEGORIES) {
    const filename = defaultPlacePhotoFilename(category);
    const filePath = path.join(SOURCE_DIR, filename);
    const objectKey = defaultPlacePhotoR2Key(category);

    if (!(await fileExists(filePath))) {
      throw new Error(`Missing default place photo asset: ${filePath}`);
    }

    uploadObject(config, filePath, objectKey);
    console.log(`Uploaded ${objectKey} -> ${r2ObjectPublicUrl(config.publicUrl, objectKey)}`);
  }

  console.log('Done.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
