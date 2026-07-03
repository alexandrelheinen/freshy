'use client';

import { useId, useState } from 'react';
import { MaterialIcon } from '@freshy/ui';
import type { StudioContributorDto } from '../lib/studio-api';

function formatContributedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

interface StudioContributorCellProps {
  contributor: StudioContributorDto | null;
  submittedAt: string;
}

export function StudioContributorCell({ contributor, submittedAt }: StudioContributorCellProps) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);

  if (!contributor) {
    return <span className="text-body-sm text-secondary">Unknown</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex max-w-[180px] items-center gap-1 truncate text-left text-body-sm text-on-surface-variant hover:text-primary"
        aria-describedby={open ? popoverId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{contributor.email}</span>
        <MaterialIcon name="person" size={16} className="shrink-0 text-secondary" />
      </button>
      {open ? (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 text-left shadow-lg"
        >
          <p className="font-title-md text-on-surface">{contributor.displayName}</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">{contributor.email}</p>
          <p className="mt-2 text-[12px] text-secondary">
            Submitted: {formatContributedAt(submittedAt)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function StudioContributorSummary({ contributor, submittedAt }: StudioContributorCellProps) {
  if (!contributor) {
    return (
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <p className="font-label-caps text-secondary">Contributor</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">Contributor not recorded</p>
        <p className="mt-1 text-[12px] text-secondary">
          Submitted: {formatContributedAt(submittedAt)}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
      <p className="font-label-caps text-secondary">Contributor</p>
      <p className="mt-1 font-title-md text-on-surface">{contributor.displayName}</p>
      <p className="text-body-sm text-on-surface-variant">{contributor.email}</p>
      <p className="mt-2 text-[12px] text-secondary">
        Submitted: {formatContributedAt(submittedAt)}
      </p>
    </section>
  );
}
