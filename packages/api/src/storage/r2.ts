import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucketName = process.env.R2_BUCKET_NAME ?? 'freshy-assets';
const accountId = process.env.R2_ACCOUNT_ID ?? '';
const publicBaseUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }
  return client;
}

export interface UploadResult {
  bucket: string;
  objectPath: string;
  publicUrl: string;
}

function buildPublicUrl(objectPath: string): string {
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${objectPath}`;
  }
  return `https://${bucketName}.r2.dev/${objectPath}`;
}

/** Upload a buffer to Cloudflare R2. */
export async function uploadAsset(
  objectPath: string,
  data: Buffer,
  contentType: string,
): Promise<UploadResult> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectPath,
      Body: data,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    }),
  );

  return { bucket: bucketName, objectPath, publicUrl: buildPublicUrl(objectPath) };
}

/** Generate a presigned URL for private objects (e.g. pending moderation). */
export async function getSignedUrl(objectPath: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: objectPath });
  return awsGetSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
  );
}
