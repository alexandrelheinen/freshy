'use client';

import { useCallback, useEffect, useState } from 'react';
import { MaterialIcon } from '@freshy/ui';
import { fetchStudioUsers, type StudioUserSecretDto } from '../lib/studio-api';

interface StudioContributorSecretsPanelProps {
  getToken: () => Promise<string | null>;
  onCopied?: (message: string) => void;
}

export function StudioContributorSecretsPanel({
  getToken,
  onCopied,
}: StudioContributorSecretsPanelProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<StudioUserSecretDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await fetchStudioUsers(getToken, { q: search || undefined, limit: 10 });
    setUsers(data);
    setLoading(false);
  }, [getToken, search]);

  useEffect(() => {
    if (!open) return;
    void loadUsers();
  }, [loadUsers, open]);

  async function copySecret(user: StudioUserSecretDto) {
    try {
      await navigator.clipboard.writeText(user.secret);
      onCopied?.(`Copied secret for ${user.email}`);
    } catch {
      onCopied?.('Could not copy to clipboard.');
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2 font-label-caps text-on-surface transition-colors hover:border-primary/40"
      >
        <MaterialIcon name="key" size={18} />
        Contributor secrets
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xl">
          <p className="font-title-md text-on-surface">Copy contributor secret</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            The secret is the user ID. Share it offline with contributors who submit without
            signing in.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query.trim());
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-body-sm"
              placeholder="Search email or name"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 font-label-caps text-on-primary"
            >
              Search
            </button>
          </form>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {loading ? (
              <li className="text-body-sm text-secondary">Loading users…</li>
            ) : users.length === 0 ? (
              <li className="text-body-sm text-secondary">No users found.</li>
            ) : (
              users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-title-md text-on-surface">{user.displayName}</p>
                    <p className="truncate text-body-sm text-secondary">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copySecret(user)}
                    className="shrink-0 rounded-lg bg-primary-container px-3 py-1.5 font-label-caps text-[11px] text-on-primary-container"
                  >
                    Copy secret
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
