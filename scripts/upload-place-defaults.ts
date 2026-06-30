import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PLACE_PHOTO_CATEGORIES,
  defaultPlacePhotoFilename,
  defaultPlacePhotoR2Key,
} from '@freshy/config/place-photos';
import { isR2Configured, uploadAsset } from '../packages/api/src/storage/r2';

const SOURCE_DIR = path.join(process.cwd(), 'apps/web/public/place-defaults');

async function main(): Promise<void> {
  if (!isR2Configured()) {
    console.error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.',
    );
    process.exit(1);
  }

  if (!process.env.R2_PUBLIC_URL) {
    console.warn(
      'Warning: R2_PUBLIC_URL is not set. Objects will upload but public URLs may be incomplete.',
    );
  }

  console.log(`Uploading default place photos from ${SOURCE_DIR}`);

  for (const category of PLACE_PHOTO_CATEGORIES) {
    const filename = defaultPlacePhotoFilename(category);
    const filePath = path.join(SOURCE_DIR, filename);
    const objectPath = defaultPlacePhotoR2Key(category);
    const data = await readFile(filePath);
    const result = await uploadAsset(objectPath, data, 'image/png');
    console.log(`Uploaded ${objectPath} -> ${result.publicUrl}`);
  }

  console.log('Done.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
