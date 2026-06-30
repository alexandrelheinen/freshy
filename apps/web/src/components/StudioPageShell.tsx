'use client';

import dynamic from 'next/dynamic';

const StudioPageClient = dynamic(
  () => import('./StudioPageClient').then((m) => ({ default: m.StudioPageClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center" data-page="studio">
        <p className="text-on-surface-variant">Loading studio…</p>
      </div>
    ),
  },
);

export function StudioPageShell() {
  return <StudioPageClient />;
}
