import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';
import type { AppEnv, Env } from './env';

export interface AuthContext {
  clerkUserId: string;
  role?: string;
}

export function isAdminRole(role: unknown): boolean {
  return role === 'admin';
}

export function extractRoleFromClaims(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.role === 'string') {
    return payload.role;
  }
  const metadata = payload.metadata;
  if (metadata && typeof metadata === 'object' && 'role' in metadata) {
    const role = (metadata as { role?: unknown }).role;
    if (typeof role === 'string') return role;
  }
  const publicMetadata = payload.public_metadata;
  if (publicMetadata && typeof publicMetadata === 'object' && 'role' in publicMetadata) {
    const role = (publicMetadata as { role?: unknown }).role;
    if (typeof role === 'string') return role;
  }
  return undefined;
}

export function isClerkConfigured(env: Env): boolean {
  return Boolean(env.CLERK_SECRET_KEY);
}

function buildClerkClient(secretKey: string) {
  return createClerkClient({ secretKey });
}

async function resolveAdminRole(
  clerkUserId: string,
  tokenPayload: Record<string, unknown>,
  secretKey: string,
): Promise<string | undefined> {
  const fromToken = extractRoleFromClaims(tokenPayload);
  if (fromToken) return fromToken;

  const clerk = buildClerkClient(secretKey);
  const user = await clerk.users.getUser(clerkUserId);
  const role = user.publicMetadata?.role;
  return typeof role === 'string' ? role : undefined;
}

function authorizedParties(env: Env): string[] | undefined {
  const parties = env.CLERK_AUTHORIZED_PARTIES?.split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  return parties?.length ? parties : undefined;
}

/** Hono middleware: requires a valid Clerk Bearer token. Sets clerkUserId on context. */
export async function requireAuth(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const env = c.env;
  if (!isClerkConfigured(env)) {
    return c.json({ error: 'Auth not configured' }, 503);
  }

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
      ...(authorizedParties(env) ? { authorizedParties: authorizedParties(env) } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('clerkUserId', clerkUserId);
    c.set('clerkRole', extractRoleFromClaims(payload as Record<string, unknown>));
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}

/** Hono middleware: requires a valid Clerk Bearer token with admin role. */
export async function requireAdmin(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const env = c.env;
  if (!isClerkConfigured(env)) {
    return c.json({ error: 'Auth not configured' }, 503);
  }

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Not found' }, 404);
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
      ...(authorizedParties(env) ? { authorizedParties: authorizedParties(env) } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      return c.json({ error: 'Not found' }, 404);
    }

    const role = await resolveAdminRole(
      clerkUserId,
      payload as Record<string, unknown>,
      env.CLERK_SECRET_KEY!,
    );
    if (!isAdminRole(role)) {
      return c.json({ error: 'Not found' }, 404);
    }

    c.set('clerkUserId', clerkUserId);
    c.set('clerkRole', role);
    await next();
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
}

export { buildClerkClient };
