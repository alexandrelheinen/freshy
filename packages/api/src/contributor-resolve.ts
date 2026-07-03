import type { User } from '@freshy/db';
import { findContributorBySecret } from './contributor';
import type { Db } from '@freshy/db';

export const UNKNOWN_SECRET_MESSAGE =
  'This secret is not recognized. Contact a team member to get one.';

export type ContributorResolveError = 'MISSING_SECRET' | 'UNKNOWN_SECRET';

export type ContributorResolveResult =
  | { ok: true; user: User }
  | { ok: false; code: ContributorResolveError; message: string };

export async function resolveContributorFromSecret(
  db: Db,
  secret: string | undefined,
): Promise<ContributorResolveResult> {
  if (!secret?.trim()) {
    return { ok: false, code: 'MISSING_SECRET', message: UNKNOWN_SECRET_MESSAGE };
  }

  const user = await findContributorBySecret(db, secret);
  if (!user) {
    return { ok: false, code: 'UNKNOWN_SECRET', message: UNKNOWN_SECRET_MESSAGE };
  }

  return { ok: true, user };
}

export function contributorErrorResponse(code: ContributorResolveError, message: string) {
  return { error: code, message };
}
