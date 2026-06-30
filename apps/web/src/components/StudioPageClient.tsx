'use client';

import { useAuth, useUser } from '@clerk/clerk-react';
import { StudioClient } from './StudioClient';
import { StudioNotFound } from './StudioNotFound';
import { isStudioAdmin } from '../lib/studio-api';

export function StudioPageClient() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-page="studio">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <StudioNotFound />;
  }

  if (!isStudioAdmin(user?.publicMetadata)) {
    return <StudioNotFound />;
  }

  return <StudioClient />;
}
