'use client';

import type { StudioContributorDto } from '../lib/studio-api';
import { contributorDisplayName, contributorFallbackLabel, useStudioContributor } from '../lib/use-studio-contributor';

function formatContributedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

interface StudioContributorCellProps {
  contributor: StudioContributorDto | null;
  createdById?: string | null;
  submittedAt: string;
  getToken?: () => Promise<string | null>;
}

export function StudioContributorCell({
  contributor,
  createdById,
  getToken,
}: StudioContributorCellProps) {
  const { contributor: resolved, loading } = useStudioContributor(
    getToken,
    contributor,
    createdById,
  );

  if (loading) {
    return <span className="text-body-sm text-secondary">Loading contributor…</span>;
  }

  if (!resolved) {
    const fallback = contributorFallbackLabel(createdById);
    if (fallback) {
      return (
        <span className="text-body-sm text-on-surface-variant" title={createdById ?? undefined}>
          {fallback}
        </span>
      );
    }
    return <span className="text-body-sm text-secondary">Contributor not recorded</span>;
  }

  const label = contributorDisplayName(resolved);

  return (
    <span
      className="inline-block max-w-[180px] truncate text-body-sm text-on-surface-variant cursor-help"
      title={resolved.email}
    >
      {label}
    </span>
  );
}

export function StudioContributorSummary({
  contributor,
  createdById,
  submittedAt,
  getToken,
}: StudioContributorCellProps) {
  const { contributor: resolved, loading } = useStudioContributor(
    getToken,
    contributor,
    createdById,
  );

  if (loading) {
    return (
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <p className="font-label-caps text-secondary">Contributor</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">Loading contributor…</p>
      </section>
    );
  }

  if (!resolved) {
    const fallback = contributorFallbackLabel(createdById);
    return (
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <p className="font-label-caps text-secondary">Contributor</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          {fallback ?? 'Contributor not recorded'}
        </p>
        <p className="mt-1 text-[12px] text-secondary">
          Submitted: {formatContributedAt(submittedAt)}
        </p>
      </section>
    );
  }

  const label = contributorDisplayName(resolved);

  return (
    <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
      <p className="font-label-caps text-secondary">Contributor</p>
      <p className="mt-1 font-title-md text-on-surface cursor-help" title={resolved.email}>
        {label}
      </p>
      <p className="text-body-sm text-on-surface-variant">{resolved.email}</p>
      <p className="mt-2 text-[12px] text-secondary">
        Submitted: {formatContributedAt(submittedAt)}
      </p>
    </section>
  );
}
