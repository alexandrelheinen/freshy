import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';
import type { Env } from './worker';

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

/** Hono middleware: requires a valid Clerk Bearer token. Sets c.var.auth. */
export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<void> {
  const env = c.env;
  if (!isClerkConfigured(env)) {
    c.res = c.json({ error: 'Auth not configured' }, 503);
    return;
  }

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    c.res = c.json({ error: 'Unauthorized' }, 401);
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const authorizedParties = env.CLERK_AUTHORIZED_PARTIES?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
      ...(authorizedParties?.length ? { authorizedParties } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      c.res = c.json({ error: 'Unauthorized' }, 401);
      return;
    }
    c.set('clerkUserId', clerkUserId);
    c.set('clerkRole', extractRoleFromClaims(payload as Record<string, unknown>));
    await next();
  } catch {
    c.res = c.json({ error: 'Unauthorized' }, 401);
  }
}

/** Hono middleware: requires a valid Clerk Bearer token with admin role. */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next): Promise<void> {
  const env = c.env;
  if (!isClerkConfigured(env)) {
    c.res = c.json({ error: 'Auth not configured' }, 503);
    return;
  }

  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    c.res = c.json({ error: 'Not found' }, 404);
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const authorizedParties = env.CLERK_AUTHORIZED_PARTIES?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY!,
      ...(authorizedParties?.length ? { authorizedParties } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      c.res = c.json({ error: 'Not found' }, 404);
      return;
    }

    const role = await resolveAdminRole(
      clerkUserId,
      payload as Record<string, unknown>,
      env.CLERK_SECRET_KEY!,
    );
    if (!isAdminRole(role)) {
      c.res = c.json({ error: 'Not found' }, 404);
      return;
    }

    c.set('clerkUserId', clerkUserId);
    c.set('clerkRole', role);
    await next();
  } catch {
    c.res = c.json({ error: 'Not found' }, 404);
  }
}

export { buildClerkClient };
