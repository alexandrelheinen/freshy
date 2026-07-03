'use client';

import { useId, useRef, useState } from 'react';
import { MaterialIcon } from '@freshy/ui';
import type { StudioContributorDto } from '../lib/studio-api';
import { FloatingPopover } from './FloatingPopover';

function formatContributedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function contributorDisplayName(contributor: StudioContributorDto): string {
  return contributor.displayName.trim() || contributor.username || contributor.email;
}

interface StudioContributorCellProps {
  contributor: StudioContributorDto | null;
  createdById?: string | null;
  submittedAt: string;
}

export function StudioContributorCell({
  contributor,
  createdById,
  submittedAt,
}: StudioContributorCellProps) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!contributor) {
    if (createdById) {
      return (
        <span className="text-body-sm text-secondary" title={createdById}>
          User {createdById.slice(0, 8)}
        </span>
      );
    }
    return <span className="text-body-sm text-secondary">Unknown</span>;
  }

  const label = contributorDisplayName(contributor);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        title={contributor.email}
        className="inline-flex max-w-[180px] items-center gap-1 truncate text-left text-body-sm text-on-surface-variant hover:text-primary"
        aria-describedby={open ? popoverId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{label}</span>
        <MaterialIcon name="person" size={16} className="shrink-0 text-secondary" />
      </button>
      <FloatingPopover
        id={popoverId}
        role="tooltip"
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        className="p-3 text-left"
      >
        <p className="font-title-md text-on-surface">{label}</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">{contributor.email}</p>
        <p className="mt-2 text-[12px] text-secondary">
          Submitted: {formatContributedAt(submittedAt)}
        </p>
      </FloatingPopover>
    </>
  );
}

export function StudioContributorSummary({
  contributor,
  createdById,
  submittedAt,
}: StudioContributorCellProps) {
  if (!contributor) {
    return (
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
        <p className="font-label-caps text-secondary">Contributor</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          {createdById ? `User ${createdById.slice(0, 8)}` : 'Contributor not recorded'}
        </p>
        <p className="mt-1 text-[12px] text-secondary">
          Submitted: {formatContributedAt(submittedAt)}
        </p>
      </section>
    );
  }

  const label = contributorDisplayName(contributor);

  return (
    <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
      <p className="font-label-caps text-secondary">Contributor</p>
      <p className="mt-1 font-title-md text-on-surface" title={contributor.email}>
        {label}
      </p>
      <p className="text-body-sm text-on-surface-variant">{contributor.email}</p>
      <p className="mt-2 text-[12px] text-secondary">
        Submitted: {formatContributedAt(submittedAt)}
      </p>
    </section>
  );
}
