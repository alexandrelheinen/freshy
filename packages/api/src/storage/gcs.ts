import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCS_BUCKET_NAME ?? 'freshy-assets';

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return storage;
}

export interface UploadResult {
  bucket: string;
  objectPath: string;
  publicUrl: string;
}

/** Upload a buffer to Google Cloud Storage. */
export async function uploadAsset(
  objectPath: string,
  data: Buffer,
  contentType: string,
): Promise<UploadResult> {
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(objectPath);
  await file.save(data, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectPath}`;
  return { bucket: bucketName, objectPath, publicUrl };
}

/** Generate a signed URL for private objects (e.g. user uploads pending moderation). */
export async function getSignedUrl(objectPath: string, expiresInMinutes = 60): Promise<string> {
  const bucket = getStorage().bucket(bucketName);
  const [url] = await bucket.file(objectPath).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}

export function isGcsConfigured(): boolean {
  return Boolean(process.env.GCP_PROJECT_ID && process.env.GCS_BUCKET_NAME);
}
