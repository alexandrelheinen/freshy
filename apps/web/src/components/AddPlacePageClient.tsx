'use client';

import dynamic from 'next/dynamic';

const AddPlaceClient = dynamic(
  () => import('./AddPlaceClient').then((m) => ({ default: m.AddPlaceClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pb-8">
        <p className="text-on-surface-variant">Loading form…</p>
      </div>
    ),
  },
);

export function AddPlacePageClient() {
  return <AddPlaceClient />;
}
