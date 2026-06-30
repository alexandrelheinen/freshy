'use client';

import { useAuth, SignInButton, UserButton } from '@clerk/clerk-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AC_STRENGTH_LABELS, GlassCard, MaterialIcon, PLACE_CATEGORY_LABELS, ROUTES } from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { type PlaceDto } from '../lib/api';
import { fetchMyProfile, fetchMySavedPlaces, type UserProfileDto } from '../lib/user-api';

export function ProfileClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<PlaceDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfile(null);
      setSavedPlaces([]);
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      const [me, saved] = await Promise.all([
        fetchMyProfile(getToken),
        fetchMySavedPlaces(getToken),
      ]);
      setProfile(me);
      setSavedPlaces(saved);
      setLoading(false);
    })();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="min-h-screen pb-32 md:pb-8" data-page="profile">
      <AppMobileHeader />
      <AppTopNav active="profile" />

      <main className="mx-auto mt-20 max-w-4xl px-margin-mobile md:px-10">
        {!isLoaded ? (
          <p className="py-16 text-center text-on-surface-variant">Loading…</p>
        ) : !isSignedIn ? (
          <section className="flex flex-col items-center py-16 text-center">
            <h2 className="text-2xl font-semibold">Sign in to Freshy</h2>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Save your favourite cooling spots and track your relief points.
            </p>
            <SignInButton mode="modal">
              <button
                type="button"
                className="mt-8 rounded-xl bg-primary px-8 py-3 font-semibold text-on-primary shadow-lg"
              >
                Sign in
              </button>
            </SignInButton>
          </section>
        ) : loading ? (
          <p className="py-16 text-center text-on-surface-variant">Loading profile…</p>
        ) : profile ? (
          <>
            <section className="mb-8 flex flex-col items-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="mb-4 h-24 w-24 rounded-full object-cover ring-4 ring-primary-container"
                />
              ) : (
                <div className="mb-4 h-24 w-24 rounded-full bg-primary-container ring-4 ring-primary-container" />
              )}
              <h2 className="text-2xl font-semibold">{profile.displayName}</h2>
              <p className="text-on-surface-variant">@{profile.username}</p>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/10 bg-primary-container/30 px-6 py-2">
                <span className="font-bold text-primary">{profile.reliefPoints}</span>
                <span className="text-sm font-bold uppercase">Relief Points</span>
              </div>
            </section>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <GlassCard className="flex flex-col items-center p-4">
                <span className="text-3xl font-bold text-primary">{profile.reviewCount}</span>
                <span className="text-xs font-bold uppercase text-secondary">Reviews</span>
              </GlassCard>
              <GlassCard className="flex flex-col items-center p-4">
                <span className="text-3xl font-bold text-primary">{profile.savedCount}</span>
                <span className="text-xs font-bold uppercase text-secondary">Saved</span>
              </GlassCard>
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Saved Places</h3>
                {savedPlaces.length > 0 ? (
                  <Link href={ROUTES.saved} className="text-sm font-semibold text-primary">
                    See all
                  </Link>
                ) : null}
              </div>
              {savedPlaces.length === 0 ? (
                <GlassCard className="p-4 text-on-surface-variant">
                  No saved places yet. Explore the map and tap Save on a place you like.
                </GlassCard>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {savedPlaces.map((place) => (
                    <Link key={place.id} href={`/places/${place.slug}`} className="shrink-0">
                      <GlassCard className="w-64 overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-primary-container to-secondary-container" />
                        <div className="p-4">
                          <p className="truncate font-semibold">{place.name}</p>
                          <p className="text-sm text-on-surface-variant">
                            {place.aggregatedAcStrength
                              ? AC_STRENGTH_LABELS[place.aggregatedAcStrength]
                              : 'Unknown'}
                          </p>
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <p className="py-16 text-center text-on-surface-variant">
            Could not load profile. Check that the API is running and Clerk is configured.
          </p>
        )}
      </main>

      <AppBottomNav active="profile" />
    </div>
  );
}
