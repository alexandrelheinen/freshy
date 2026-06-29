import express, { type Express } from 'express';
import cors from 'cors';
import { PrismaClient } from '@freshy/db';
import { isR2Configured } from './storage/r2';

const app: Express = express();
const prisma = new PrismaClient();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'freshy-api',
    r2: isR2Configured() ? 'configured' : 'not-configured',
  });
});

app.get('/places', async (_req, res) => {
  try {
    const places = await prisma.place.findMany({
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.json({ data: places });
  } catch {
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.get('/places/:slug', async (req, res) => {
  try {
    const place = await prisma.place.findUnique({
      where: { slug: req.params.slug },
      include: { reviews: { take: 10, orderBy: { createdAt: 'desc' } } },
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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Freshy API listening on http://localhost:${port}`);
  });
}

export { app };
