import express, { type Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@freshy/db';
import { isR2Configured } from './storage/r2';
import {
  categoryCounts,
  featuredPlace,
  listPlaces,
  placesQuerySchema,
} from './places';

const prisma = new PrismaClient();

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'freshy-api',
      r2: isR2Configured() ? 'configured' : 'not-configured',
    });
  });

  app.get('/places', async (req, res) => {
    try {
      const parsed = placesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
        return;
      }
      const data = await listPlaces(prisma, parsed.data);
      res.json({ data });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/places/meta/categories', async (_req, res) => {
    try {
      const [categories, featured] = await Promise.all([
        categoryCounts(prisma),
        featuredPlace(prisma),
      ]);
      res.json({ data: { categories, featured } });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  app.get('/places/:slug', async (req, res) => {
    try {
      const place = await prisma.place.findUnique({
        where: { slug: req.params.slug },
        include: {
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { displayName: true, username: true } } },
          },
        },
      });
      if (!place) {
        res.status(404).json({ error: 'Place not found' });
        return;
      }
      res.json({ data: place });
    } catch {
      res.status(503).json({ error: 'Database unavailable' });
    }
  });

  return app;
}

export const app = createApp();
