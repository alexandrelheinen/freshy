import { eq } from 'drizzle-orm';
import type { Db, User } from '@freshy/db';
import { users as usersTable } from '@freshy/db';

/** Resolve a contributor from an anonymous submission secret (Freshy User.id). */
export async function findContributorBySecret(db: Db, secret: string): Promise<User | null> {
  const trimmed = secret.trim();
  if (!trimmed) return null;
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, trimmed)).limit(1);
  return rows[0] ?? null;
}
