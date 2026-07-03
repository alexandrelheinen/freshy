import { z } from 'zod';
import { desc, eq, like, or } from 'drizzle-orm';
import type { Db } from '@freshy/db';
import { users as usersTable } from '@freshy/db';

export const studioUsersQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type StudioUsersQuery = z.infer<typeof studioUsersQuerySchema>;

export interface StudioUserSecret {
  id: string;
  email: string;
  displayName: string;
  username: string;
  secret: string;
}

export async function listStudioUsers(db: Db, query: StudioUsersQuery): Promise<StudioUserSecret[]> {
  const limit = query.limit ?? 25;

  if (query.q) {
    const pattern = `%${query.q}%`;
    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        displayName: usersTable.displayName,
        username: usersTable.username,
      })
      .from(usersTable)
      .where(
        or(
          like(usersTable.email, pattern),
          like(usersTable.displayName, pattern),
          like(usersTable.username, pattern),
          eq(usersTable.id, query.q),
        ),
      )
      .orderBy(desc(usersTable.createdAt))
      .limit(limit);

    return rows.map((row) => ({ ...row, secret: row.id }));
  }

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      username: usersTable.username,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit);

  return rows.map((row) => ({ ...row, secret: row.id }));
}

export async function getStudioUserSecret(
  db: Db,
  userId: string,
): Promise<StudioUserSecret | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) return null;
  return { ...user, secret: user.id };
}
