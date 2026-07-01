'use client';

import { useAuth, SignInButton } from '@clerk/clerk-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  FRESHNESS_LEVEL_LABELS,
  FreshnessBar,
  GlassCard,
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  ROUTES,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { type PlaceDto } from '../lib/api';
import { formatRelativeTime } from '../lib/api';
import {
  fetchMyProfile,
  fetchMyReviews,
  fetchMySavedPlaces,
  type UserProfileDto,
  type UserReviewDto,
} from '../lib/user-api';

type ProfileTab = 'saved' | 'reviews';

function categoryIcon(category: string): MaterialIconName {
  const icon = PLACE_CATEGORY_ICONS[category as PlaceCategory];
  return (icon ?? 'place') as MaterialIconName;
}

function SavedPlaceCard({ place }: { place: PlaceDto }) {
  return (
    <Link href={ROUTES.place(place.slug)} className="shrink-0 active:scale-95">
      <GlassCard className="w-64 overflow-hidden transition-transform">
        <div className="relative h-32">
          <img
            src={getPlacePhotoUrl(place.photoUrl, place.category as PlaceCategory)}
            alt=""
            className="h-full w-full object-cover"
          />
          {place.aggregatedFreshnessLevel ? (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-surface/90 px-2 py-1 shadow-sm backdrop-blur-md">
              <MaterialIcon name="ac_unit" filled size={14} className="text-primary" />
              <span className="font-label-caps text-primary">
                {FRESHNESS_LEVEL_LABELS[place.aggregatedFreshnessLevel]}
              </span>
            </div>
          ) : null}
        </div>
        <div className="p-4">
          <p className="truncate font-title-md text-on-surface">{place.name}</p>
          {place.address ? (
            <p className="mt-1 flex items-center gap-1 font-body-sm text-on-surface-variant">
              <MaterialIcon name="location_on" size={16} />
              <span className="truncate">{place.address.split(',')[0]}</span>
            </p>
          ) : null}
        </div>
      </GlassCard>
    </Link>
  );
}

function ReviewRow({ review }: { review: UserReviewDto }) {
  const level = Math.min(
    3,
    Math.max(1, review.acStrength >= 4 ? 3 : review.acStrength >= 3 ? 2 : 1),
  );
  const label =
    review.acStrength >= 4 ? 'Frigid' : review.acStrength >= 3 ? 'Comfortable' : 'Cooled';

  return (
    <Link href={ROUTES.place(review.place.slug)}>
      <GlassCard className="flex items-center gap-4 p-4 transition-transform hover:translate-x-1">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
          <MaterialIcon
            name={categoryIcon(review.place.category)}
            className="text-on-secondary-container"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-title-md text-on-surface">{review.place.name}</p>
            <span className="shrink-0 font-body-sm text-outline">
              {formatRelativeTime(review.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <FreshnessBar segments={level} tone="blue" />
            <span className="font-label-caps text-secondary">{label}</span>
          </div>
          {review.comment ? (
            <p className="mt-1 truncate font-body-sm italic text-on-surface-variant">
              &quot;{review.comment}&quot;
            </p>
          ) : null}
        </div>
      </GlassCard>
    </Link>
  );
}

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ProfileSignedOutView({ showSignIn }: { showSignIn: boolean }) {
  return (
    <div className="min-h-screen pb-8" data-page="profile">
      <AppMobileHeader active="profile" />
      <AppTopNav active="profile" />
      <main className="mx-auto mt-20 max-w-4xl px-margin-mobile md:max-w-7xl md:px-10">
        <section className="flex flex-col items-center py-16 text-center">
          <h2 className="font-headline-lg-mobile text-on-surface">Sign in to Freshy</h2>
          <p className="mt-2 max-w-sm text-on-surface-variant">
            Save your favourite cooling spots and track your relief points.
          </p>
          {showSignIn ? (
            <SignInButton mode="modal">
              <button
                type="button"
                className="mt-8 rounded-xl bg-primary px-8 py-3 font-semibold text-on-primary shadow-lg"
              >
                Sign in
              </button>
            </SignInButton>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ProfileWithClerk() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<PlaceDto[]>([]);
  const [reviews, setReviews] = useState<UserReviewDto[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('saved');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submittedPlaceSlug, setSubmittedPlaceSlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = sessionStorage.getItem('freshy-place-submitted');
    if (slug) {
      sessionStorage.removeItem('freshy-place-submitted');
      setSubmittedPlaceSlug(slug);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfile(null);
      setSavedPlaces([]);
      setReviews([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);
      const [profileResult, saved, myReviews] = await Promise.all([
        fetchMyProfile(() => getTokenRef.current()),
        fetchMySavedPlaces(() => getTokenRef.current()),
        fetchMyReviews(() => getTokenRef.current()),
      ]);
      if (cancelled) return;
      setProfile(profileResult.profile);
      setLoadError(profileResult.error);
      setSavedPlaces(saved);
      setReviews(myReviews);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, reloadKey]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen pb-8" data-page="profile">
        <AppMobileHeader active="profile" />
        <AppTopNav active="profile" />
        <main className="mx-auto mt-20 max-w-4xl px-margin-mobile md:max-w-7xl md:px-10">
          <p className="py-16 text-center text-on-surface-variant">Loading…</p>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return <ProfileSignedOutView showSignIn />;
  }

  return (
    <div className="min-h-screen pb-8" data-page="profile">
      <AppMobileHeader active="profile" />
      <AppTopNav active="profile" />

      <main className="mx-auto mt-20 max-w-4xl px-margin-mobile md:max-w-7xl md:px-10">
        {loading ? (
          <p className="py-16 text-center text-on-surface-variant">Loading profile…</p>
        ) : profile ? (
          <>
            {submittedPlaceSlug ? (
              <div className="mb-6 rounded-xl border border-primary-container bg-primary-container/20 px-4 py-3 text-body-sm text-on-surface">
                <p className="font-title-md text-primary">Place submitted for review</p>
                <p className="mt-1 text-on-surface-variant">
                  Your cooling spot is pending validation. It will appear on the map after an admin
                  approves it in Studio.
                </p>
              </div>
            ) : null}
            <section className="mb-8 flex flex-col items-center md:mb-12 md:flex-row md:items-end md:gap-8">
              <div className="relative mb-4 md:mb-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-container shadow-lg md:h-32 md:w-32"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-primary-container ring-4 ring-primary-container md:h-32 md:w-32" />
                )}
                <div className="absolute bottom-0 right-0 rounded-full border-2 border-surface bg-primary p-1.5 shadow-md">
                  <MaterialIcon name="verified" filled size={16} className="text-on-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
                  {profile.displayName}
                </h2>
                <p className="font-body-lg text-on-surface-variant">@{profile.username}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary-container/30 px-6 py-2 shadow-sm">
                  <MaterialIcon name="star" filled className="text-primary" size={18} />
                  <span className="font-label-caps">
                    <span className="font-bold text-primary">{profile.reliefPoints}</span> Relief
                    Points
                  </span>
                </div>
              </div>
              <div className="mt-6 flex gap-3 md:mt-0">
                <Link
                  href={ROUTES.addPlace}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-label-caps text-on-primary shadow-md transition-opacity hover:opacity-90"
                >
                  <MaterialIcon name="add_location" size={18} />
                  Add Place
                </Link>
              </div>
            </section>

            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              <GlassCard className="flex flex-col items-center p-4 text-center md:p-6">
                <MaterialIcon name="reviews" className="mb-2 text-primary md:hidden" size={28} />
                <span className="font-headline-lg text-primary">{profile.reviewCount}</span>
                <span className="font-label-caps uppercase tracking-widest text-secondary">
                  Reviews
                </span>
              </GlassCard>
              <GlassCard className="flex flex-col items-center p-4 text-center md:p-6">
                <MaterialIcon
                  name="bookmark_heart"
                  className="mb-2 text-primary md:hidden"
                  size={28}
                />
                <span className="font-headline-lg text-primary">{profile.savedCount}</span>
                <span className="font-label-caps uppercase tracking-widest text-secondary">
                  Saved
                </span>
              </GlassCard>
              <GlassCard className="hidden flex-col items-center p-6 text-center md:flex">
                <MaterialIcon name="add_location" className="mb-2 text-primary" size={28} />
                <span className="text-3xl font-bold text-on-surface">+</span>
                <span className="font-label-caps text-on-surface-variant">Contribute</span>
              </GlassCard>
            </div>

            <div className="mb-6 flex gap-8 overflow-x-auto border-b border-outline-variant pb-px md:mb-8">
              {(
                [
                  { id: 'saved' as const, label: 'Saved Places' },
                  { id: 'reviews' as const, label: 'My Reviews' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-2 pb-4 font-label-caps transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'saved' ? (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-title-md text-on-surface">Saved Places</h3>
                  {savedPlaces.length > 0 ? (
                    <Link
                      href={ROUTES.saved}
                      className="font-label-caps text-primary hover:underline"
                    >
                      See all
                    </Link>
                  ) : null}
                </div>
                {savedPlaces.length === 0 ? (
                  <GlassCard className="p-4 text-on-surface-variant">
                    No saved places yet. Explore the map and tap Save on a place you like.
                  </GlassCard>
                ) : (
                  <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-3">
                    {savedPlaces.map((place) => (
                      <SavedPlaceCard key={place.id} place={place} />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section className="space-y-4">
                {reviews.length === 0 ? (
                  <GlassCard className="p-4 text-on-surface-variant">
                    No reviews yet. Visit a place and share how cool it feels inside.
                  </GlassCard>
                ) : (
                  reviews.map((review) => <ReviewRow key={review.id} review={review} />)
                )}
              </section>
            )}

            <section className="mt-8 md:hidden">
              <Link
                href={ROUTES.addPlace}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary-container/10 py-4 font-title-md text-primary"
              >
                <MaterialIcon name="add_a_photo" />
                Add a new cooling spot
              </Link>
            </section>
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-on-surface-variant">
              {loadError ??
                'Could not load profile. Check that the API is running and Clerk is configured.'}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-xl bg-primary px-6 py-3 font-label-caps text-on-primary"
            >
              Retry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export function ProfileClient() {
  if (!clerkEnabled) {
    return <ProfileSignedOutView showSignIn={false} />;
  }

  return <ProfileWithClerk />;
}
