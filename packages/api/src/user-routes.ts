import type { Express, Request, Response } from 'express';
import type { PrismaClient } from '@freshy/db';
import { requireAuth } from './auth';
import {
  getUserProfile,
  isPlaceSaved,
  listSavedPlaces,
  listUserReviews,
  savePlace,
  syncUserFromClerk,
  unsavePlace,
} from './users';
import { createPlaceSchema, createUserPlace } from './create-place';
import { withResolvedPlacePhoto } from './places';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

async function withDbUser(
  prisma: PrismaClient,
  req: Request,
  res: Response,
): Promise<{ id: string } | null> {
  if (!req.auth?.clerkUserId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  try {
    const user = await syncUserFromClerk(prisma, req.auth.clerkUserId);
    return user;
  } catch {
    res.status(503).json({ error: 'Could not sync user' });
    return null;
  }
}

export function registerUserRoutes(app: Express, prisma: PrismaClient): void {
  app.get('/users/me', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      const data = await getUserProfile(prisma, user.id);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/users/me/reviews', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      const data = await listUserReviews(prisma, user.id);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.post('/users/me/places', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    const parsed = createPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    try {
      const place = await createUserPlace(prisma, user.id, {
        ...parsed.data,
        status: 'DRAFT',
      });
      res.status(201).json({ data: withResolvedPlacePhoto(place) });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/users/me/saved', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      const data = await listSavedPlaces(prisma, user.id);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/users/me/saved/:placeId', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      const saved = await isPlaceSaved(prisma, user.id, paramId(req.params.placeId));
      res.json({ data: { saved } });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.post('/users/me/saved/:placeId', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      const placeId = paramId(req.params.placeId);
      const place = await prisma.place.findUnique({ where: { id: placeId } });
      if (!place) {
        res.status(404).json({ error: 'Place not found' });
        return;
      }
      await savePlace(prisma, user.id, place.id);
      res.status(201).json({ data: { saved: true } });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.delete('/users/me/saved/:placeId', requireAuth, async (req, res) => {
    const user = await withDbUser(prisma, req, res);
    if (!user) return;
    try {
      await unsavePlace(prisma, user.id, paramId(req.params.placeId));
      res.json({ data: { saved: false } });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });
}
