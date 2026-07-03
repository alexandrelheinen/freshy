'use client';

import { useCallback, useEffect, useState } from 'react';
import { MaterialIcon } from '@freshy/ui';
import { fetchMyContributorSecret } from '../lib/user-api';

interface StudioMyContributorSecretBarProps {
  getToken: () => Promise<string | null>;
  onCopied?: (message: string) => void;
}

export function StudioMyContributorSecretBar({
  getToken,
  onCopied,
}: StudioMyContributorSecretBarProps) {
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    const value = await fetchMyContributorSecret(getToken);
    setSecret(value);
    if (!value) {
      setError('Could not load your contributor secret.');
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    void loadSecret();
  }, [loadSecret]);

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      onCopied?.('Contributor secret copied');
    } catch {
      onCopied?.('Could not copy to clipboard.');
    }
  }

  return (
    <section
      className="border-b border-outline-variant/10 bg-surface-container-low px-4 py-4 md:px-8"
      aria-label="My contributor secret"
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-label-caps text-on-surface">My secret</p>
          <p className="mt-1 max-w-3xl text-body-sm text-on-surface-variant">
            Share this only with people you trust. They can submit places in your name without
            signing in.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface px-3 py-2 font-mono text-body-sm text-on-surface shadow-sm">
            <MaterialIcon name="person" size={18} className="shrink-0 text-secondary" />
            <input
              readOnly
              value={loading ? 'Loading…' : (secret ?? '')}
              aria-label="Contributor secret"
              className="min-w-0 flex-1 border-none bg-transparent p-0 font-mono text-body-sm text-on-surface focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={() => void copySecret()}
            disabled={loading || !secret}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-caps text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MaterialIcon name="share" size={18} />
            Copy
          </button>
        </div>
        {error ? <p className="text-body-sm text-error">{error}</p> : null}
      </div>
    </section>
  );
}
