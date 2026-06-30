'use client';

import dynamic from 'next/dynamic';

const ProfileClient = dynamic(
  () => import('./ProfileClient').then((m) => ({ default: m.ProfileClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center pb-32" data-page="profile">
        <p className="text-on-surface-variant">Loading profile…</p>
      </div>
    ),
  },
);

export function ProfilePageClient() {
  return <ProfileClient />;
}
