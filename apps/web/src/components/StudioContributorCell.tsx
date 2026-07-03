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

interface StudioContributorCellProps {
  contributor: StudioContributorDto | null;
  submittedAt: string;
}

export function StudioContributorCell({ contributor, submittedAt }: StudioContributorCellProps) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  if (!contributor) {
    return <span className="text-body-sm text-secondary">Unknown</span>;
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="inline-flex max-w-[180px] items-center gap-1 truncate text-left text-body-sm text-on-surface-variant hover:text-primary"
        aria-describedby={open ? popoverId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{contributor.email}</span>
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
        <p className="font-title-md text-on-surface">{contributor.displayName}</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">{contributor.email}</p>
        <p className="mt-2 text-[12px] text-secondary">
          Submitted: {formatContributedAt(submittedAt)}
        </p>
      </FloatingPopover>
    </>
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
