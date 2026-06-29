import type { NextFunction, Request, Response } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';

export interface AuthContext {
  clerkUserId: string;
}

declare global {
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
    req.auth = { clerkUserId };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export { getClerkClient };
