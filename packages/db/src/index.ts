import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export * from './schema';
export {
  PILOT_CITY,
  haversineDistanceKm,
  filterPlacesByRadius,
  type PlaceWithDistance,
} from './geo';

/**
 * Create a Drizzle database instance bound to a Cloudflare D1 database.
 *
 * Usage in a Cloudflare Worker:
 *   const db = createDb(env.FRESHY_DB);
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;
