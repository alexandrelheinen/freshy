'use client';

import { useEffect, useState } from 'react';
import { fetchStudioUserById, type StudioContributorDto } from './studio-api';

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
    if (!createdById || !getToken) {
      setResolved(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchStudioUserById(getToken, createdById).then((profile) => {
      if (cancelled) return;
      setResolved(profile);
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
