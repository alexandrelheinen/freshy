'use client';

import { useAuth, SignInButton } from '@clerk/clerk-react';
import Link from 'next/link';
import { ROUTES } from '@freshy/ui';
import { useCallback, useState } from 'react';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListClient } from './PlaceListClient';
import { fetchMySavedPlaces, unsavePlaceForUser } from '../lib/user-api';

export function SavedPlacesClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const loadSaved = useCallback(async () => {
    if (!isSignedIn) return [];
    return fetchMySavedPlaces(getToken);
    // reloadKey intentionally triggers a fresh fetch after unsave
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadKey forces refetch
  }, [isSignedIn, getToken, reloadKey]);

  const handleUnsave = useCallback(
    async (placeId: string) => {
      const ok = await unsavePlaceForUser(getToken, placeId);
      if (ok) setReloadKey((k) => k + 1);
    },
    [getToken],
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen pb-mobile-nav" data-page="saved">
        <AppMobileHeader title="Saved Places" backHref={ROUTES.explore} showBrand={false} />
        <p className="py-32 text-center text-on-surface-variant">Loading…</p>
        <AppBottomNav active="saved" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pb-mobile-nav" data-page="saved">
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
    <div data-page="saved">
      <PlaceListClient
        title="Saved Places"
        subtitle="Your personal oasis collection in the city."
        backHref={ROUTES.explore}
        loadPlaces={loadSaved}
        showBookmark
        onUnsave={handleUnsave}
        navActive="saved"
        searchPlaceholder="Search saved places…"
        emptyMessage="No saved places yet. Explore the map and save spots you love."
      />
    </div>
  );
}
