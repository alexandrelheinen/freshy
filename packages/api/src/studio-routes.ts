import type { Express } from 'express';
import type { PrismaClient } from '@freshy/db';
import { requireAdmin } from './auth';
import {
  approveStudioPlace,
  deleteStudioPlace,
  getStudioPlace,
  getStudioStats,
  listStudioPlaces,
  mergePlacesSchema,
  mergeStudioPlaces,
  studioPlacesQuerySchema,
  updateStudioPlace,
  updateStudioPlaceSchema,
} from './studio-places';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

export function registerStudioRoutes(app: Express, prisma: PrismaClient): void {
  app.get('/studio/stats', requireAdmin, async (_req, res) => {
    try {
      const data = await getStudioStats(prisma);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/studio/places', requireAdmin, async (req, res) => {
    const parsed = studioPlacesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
      return;
    }
    try {
      const data = await listStudioPlaces(prisma, parsed.data);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/studio/places/:placeId', requireAdmin, async (req, res) => {
    try {
      const data = await getStudioPlace(prisma, paramId(req.params.placeId));
      if (!data) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.patch('/studio/places/:placeId', requireAdmin, async (req, res) => {
    const parsed = updateStudioPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    try {
      const existing = await prisma.place.findUnique({
        where: { id: paramId(req.params.placeId) },
      });
      if (!existing) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const data = await updateStudioPlace(prisma, existing.id, parsed.data);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.post('/studio/places/:placeId/approve', requireAdmin, async (req, res) => {
    try {
      const existing = await prisma.place.findUnique({
        where: { id: paramId(req.params.placeId) },
      });
      if (!existing) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const data = await approveStudioPlace(prisma, existing.id);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.delete('/studio/places/:placeId', requireAdmin, async (req, res) => {
    try {
      const existing = await prisma.place.findUnique({
        where: { id: paramId(req.params.placeId) },
      });
      if (!existing) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      await deleteStudioPlace(prisma, existing.id);
      res.json({ data: { deleted: true } });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.post('/studio/places/merge', requireAdmin, async (req, res) => {
    const parsed = mergePlacesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
      return;
    }
    try {
      const data = await mergeStudioPlaces(prisma, parsed.data);
      res.json({ data });
    } catch (error) {
      if (error instanceof Error && error.message === 'Place not found') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(503).json({ error: 'Database unavailable' });
    }
  });
}
