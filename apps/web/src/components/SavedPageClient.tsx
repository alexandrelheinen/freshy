'use client';

import dynamic from 'next/dynamic';

const SavedPlacesClient = dynamic(
  () => import('./SavedPlacesClient').then((m) => ({ default: m.SavedPlacesClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pb-32" data-page="saved">
        <p className="text-on-surface-variant">Loading saved places…</p>
      </div>
    ),
  },
);

export function SavedPageClient() {
  return <SavedPlacesClient />;
}
