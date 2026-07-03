export interface R2S3Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

/** Read R2 S3-compatible credentials from process env (CI and local upload scripts). */
export function readR2S3Config(env: NodeJS.ProcessEnv = process.env): R2S3Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim() ?? '';
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() ?? '';
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() ?? '';
  const bucketName = env.R2_BUCKET_NAME?.trim() ?? '';
  const publicUrl = env.R2_PUBLIC_URL?.trim() ?? '';

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function r2S3Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function r2ObjectPublicUrl(publicUrl: string, objectKey: string): string {
  const base = publicUrl.replace(/\/$/, '');
  return base ? `${base}/${objectKey}` : objectKey;
}
