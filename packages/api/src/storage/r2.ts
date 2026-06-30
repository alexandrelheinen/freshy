/** R2 upload context from Cloudflare Worker bindings. */
export interface R2Context {
  bucket: R2Bucket;
  publicBaseUrl: string;
}

export interface UploadResult {
  bucket: string;
  objectPath: string;
  publicUrl: string;
}

function buildPublicUrl(publicBaseUrl: string, objectPath: string): string {
  return `${publicBaseUrl.replace(/\/$/, '')}/${objectPath}`;
}

export function isR2Configured(ctx: R2Context | null | undefined): boolean {
  return Boolean(ctx?.bucket && ctx.publicBaseUrl);
}

/** Upload bytes to R2 via the Worker binding. */
export async function uploadAsset(
  ctx: R2Context,
  objectPath: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<UploadResult> {
  await ctx.bucket.put(objectPath, data, {
    httpMetadata: { contentType },
    customMetadata: {},
  });

  return {
    bucket: 'freshy-assets',
    objectPath,
    publicUrl: buildPublicUrl(ctx.publicBaseUrl, objectPath),
  };
}

/** Build R2 context from Worker env bindings. */
export function r2ContextFromEnv(env: {
  FRESHY_ASSETS?: R2Bucket;
  R2_PUBLIC_URL?: string;
}): R2Context | null {
  const publicBaseUrl = env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? '';
  if (!env.FRESHY_ASSETS || !publicBaseUrl) {
    return null;
  }
  return { bucket: env.FRESHY_ASSETS, publicBaseUrl };
}
