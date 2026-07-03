'use client';

import { useEffect, useState } from 'react';
import {
  fetchStudioUserById,
  syntheticStudioContributor,
  type StudioContributorDto,
} from './studio-api';

export function useStudioContributor(
  getToken: (() => Promise<string | null>) | undefined,
  contributor: StudioContributorDto | null,
  createdById: string | null | undefined,
): { contributor: StudioContributorDto | null; loading: boolean } {
  const [resolved, setResolved] = useState<StudioContributorDto | null>(contributor);
  const [loading, setLoading] = useState(Boolean(!contributor && createdById && getToken));

  useEffect(() => {
    if (contributor) {
      setResolved(contributor);
      setLoading(false);
      return;
    }

    const synthetic = syntheticStudioContributor(createdById);
    if (synthetic) {
      setResolved(synthetic);
      setLoading(false);
      return;
    }

    if (!createdById || !getToken) {
      setResolved(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchStudioUserById(getToken, createdById.trim())
      .then((profile) => {
        if (cancelled) return;
        setResolved(profile ?? syntheticStudioContributor(createdById));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setResolved(syntheticStudioContributor(createdById));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contributor, createdById, getToken]);

  return { contributor: resolved, loading };
}

export function contributorDisplayName(contributor: StudioContributorDto): string {
  return contributor.displayName.trim() || contributor.username || contributor.email;
}

export function contributorFallbackLabel(createdById: string | null | undefined): string | null {
  const trimmed = createdById?.trim();
  if (!trimmed) return null;
  const synthetic = syntheticStudioContributor(trimmed);
  if (synthetic) return contributorDisplayName(synthetic);
  if (trimmed.length <= 16) return trimmed;
  return `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
}
