import type { Db } from '@freshy/db';

/** Cloudflare Worker bindings and secrets for freshy-api. */
export interface Env {
  FRESHY_DB: D1Database;
  FRESHY_ASSETS: R2Bucket;
  R2_PUBLIC_URL: string;
  CLERK_SECRET_KEY?: string;
  CLERK_AUTHORIZED_PARTIES?: string;
  MAPBOX_ACCESS_TOKEN?: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: Db;
    clerkUserId?: string;
    clerkRole?: string;
  };
};
