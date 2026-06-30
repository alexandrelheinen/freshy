'use client';

import { useAuth } from '@clerk/clerk-react';
import Link from 'next/link';
import { SignInButton } from '@clerk/clerk-react';
import { ROUTES } from '@freshy/ui';
import { useCallback } from 'react';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListClient } from './PlaceListClient';
import { fetchMySavedPlaces } from '../lib/user-api';

export function SavedPlacesClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const loadSaved = useCallback(async () => {
    if (!isSignedIn) return [];
    return fetchMySavedPlaces(getToken);
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen pb-32">
        <AppMobileHeader title="Saved Places" backHref={ROUTES.explore} showBrand={false} />
        <p className="py-32 text-center text-on-surface-variant">Loading…</p>
        <AppBottomNav active="saved" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pb-32" data-page="saved">
        <AppMobileHeader title="Saved Places" backHref={ROUTES.explore} showBrand={false} />
        <AppTopNav active="saved" />
        <main className="mx-auto mt-20 max-w-md px-margin-mobile pt-8 text-center md:px-10">
          <h2 className="font-headline-lg-mobile text-primary">Saved Places</h2>
          <p className="mt-2 text-on-surface-variant">
            Sign in to see your favourite cooling spots.
          </p>
          <SignInButton mode="modal">
            <button
              type="button"
              className="mt-8 rounded-xl bg-primary px-8 py-3 font-semibold text-on-primary shadow-lg"
            >
              Sign in
            </button>
          </SignInButton>
          <p className="mt-6">
            <Link href={ROUTES.explore} className="text-primary underline">
              Back to explore
            </Link>
          </p>
        </main>
        <AppBottomNav active="saved" />
      </div>
    );
  }

  return (
    <PlaceListClient
      title="Saved Places"
      backHref={ROUTES.explore}
      loadPlaces={loadSaved}
      showBookmark
      navActive="saved"
      searchPlaceholder="Search saved places…"
      emptyMessage="No saved places yet. Explore the map and save spots you love."
    />
  );
}
