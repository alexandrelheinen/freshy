import type { NextFunction, Request, Response } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';

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

async function resolveAdminRole(
  clerkUserId: string,
  tokenPayload: Record<string, unknown>,
): Promise<string | undefined> {
  const fromToken = extractRoleFromClaims(tokenPayload);
  if (fromToken) return fromToken;

  const clerk = getClerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const role = user.publicMetadata?.role;
  return typeof role === 'string' ? role : undefined;
}

declare global {
  // Express Request augmentation uses the standard namespace pattern.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

export function isClerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

function getClerkClient() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }
  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }
  return clerkClient;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isClerkConfigured()) {
    res.status(503).json({ error: 'Auth not configured' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      ...(authorizedParties?.length ? { authorizedParties } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.auth = {
      clerkUserId,
      role: extractRoleFromClaims(payload as Record<string, unknown>),
    };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isClerkConfigured()) {
    res.status(503).json({ error: 'Auth not configured' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      ...(authorizedParties?.length ? { authorizedParties } : {}),
    });
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const role = await resolveAdminRole(clerkUserId, payload as Record<string, unknown>);
    if (!isAdminRole(role)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    req.auth = { clerkUserId, role };
    next();
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
}

export { getClerkClient };
