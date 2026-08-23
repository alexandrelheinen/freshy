'use client';

import { useAuth, useClerk, SignInButton } from '@clerk/clerk-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FreshnessBar, GlassCard, MaterialIcon, ROUTES } from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { PlaceListCard } from './PlaceListCard';
import { PlaceListPaginationBar } from './PlaceListClient';
import { type PlaceDto } from '../lib/api';
import { PLACE_LIST_GRID_CLASS, paginatePlaceList } from '../lib/place-list-layout';
import { formatRelativeTime } from '../lib/api';
import {
  deleteMyAccount,
  fetchMyProfile,
  fetchMyReviews,
  fetchMySavedPlaces,
  type UserProfileDto,
  type UserReviewDto,
} from '../lib/user-api';
import {
  REVIEW_PAGE_SIZE,
  reviewCoolnessLabel,
  reviewCoolnessSegments,
  reviewPageCount,
} from '../lib/reviews';
import { ReviewPaginationBar } from './ReviewPaginationBar';

type ProfileTab = 'saved' | 'reviews';

function ReviewRow({ review }: { review: UserReviewDto }) {
  return (
    <Link href={ROUTES.place(review.place.slug)}>
      <GlassCard className="p-4 transition-transform hover:translate-x-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-title-md text-on-surface">{review.place.name}</p>
          <span className="shrink-0 font-body-sm text-outline">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <FreshnessBar segments={reviewCoolnessSegments(review.acStrength)} tone="blue" />
          <span className="font-label-caps text-secondary">
            {reviewCoolnessLabel(review.acStrength)}
          </span>
        </div>
        {review.comment ? (
          <p className="mt-1 truncate font-body-sm italic text-on-surface-variant">
            &quot;{review.comment}&quot;
          </p>
        ) : null}
      </GlassCard>
    </Link>
  );
}

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ProfileAccountActions() {
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = () => {
    void signOut({ redirectUrl: ROUTES.explore });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your Freshy account permanently? Your saved places and reviews will be removed. This cannot be undone.',
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    const result = await deleteMyAccount(() => getToken());
    if (!result.ok) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    await signOut({ redirectUrl: ROUTES.explore });
  };

  return (
    <section className="mt-12 border-t border-outline-variant pt-8">
      <h3 className="font-label-caps text-on-surface-variant">Account</h3>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-outline-variant px-6 py-3 font-label-caps text-on-surface transition-colors hover:bg-surface-container"
        >
          Log out
        </button>
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deleting}
          className="rounded-xl border border-error/30 px-6 py-3 font-label-caps text-error transition-colors hover:bg-error-container/20 disabled:opacity-60"
        >
          {deleting ? 'Deleting account…' : 'Delete account'}
        </button>
      </div>
      {deleteError ? <p className="mt-3 text-sm text-error">{deleteError}</p> : null}
    </section>
  );
}

const PLACE_SUBMITTED_KEY = 'freshy-place-submitted';

function PlaceSubmittedBanner() {
  return (
    <div className="mb-6 rounded-xl border border-primary-container bg-primary-container/20 px-4 py-3 text-body-sm text-on-surface">
      <p className="font-title-md text-primary">Place submitted for review</p>
      <p className="mt-1 text-on-surface-variant">
        Thank you for contributing. Your cooling spot is pending validation and will appear on the
        map after review in Studio.
      </p>
      <Link
        href={ROUTES.explore}
        className="mt-4 inline-flex rounded-xl bg-primary px-6 py-2.5 font-semibold text-on-primary shadow-lg"
      >
        Explore the map
      </Link>
    </div>
  );
}

function useSubmittedPlaceSlug(): string | null {
  const [submittedPlaceSlug, setSubmittedPlaceSlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = sessionStorage.getItem(PLACE_SUBMITTED_KEY);
    if (slug) {
      sessionStorage.removeItem(PLACE_SUBMITTED_KEY);
      setSubmittedPlaceSlug(slug);
    }
  }, []);

  return submittedPlaceSlug;
}

function ProfileSignedOutView({ showSignIn }: { showSignIn: boolean }) {
  const submittedPlaceSlug = useSubmittedPlaceSlug();

  return (
    <div className="min-h-screen pb-8" data-page="profile">
      <AppMobileHeader active="profile" />
      <AppTopNav active="profile" />
      <main className="mx-auto mt-20 max-w-4xl px-margin-mobile md:max-w-7xl md:px-10">
        <section className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          {submittedPlaceSlug ? (
            <div className="mb-8 w-full text-left">
              <PlaceSubmittedBanner />
            </div>
          ) : null}
          <h2 className="font-headline-lg-mobile text-on-surface">Welcome to Freshy</h2>
          <p className="mt-3 max-w-sm text-on-surface-variant">
            Find cooling spots near you, join the community, or contribute a new place to the map.
          </p>
          <div className="mt-10 flex w-full flex-col gap-4">
            {showSignIn ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="w-full rounded-xl bg-primary px-8 py-3.5 font-semibold text-on-primary shadow-lg"
                >
                  Connect or register
                </button>
              </SignInButton>
            ) : null}
            <Link
              href={`${ROUTES.addPlace}?anonymous=1`}
              className="w-full rounded-xl border border-primary bg-primary-container/30 px-8 py-3.5 font-semibold text-primary shadow-sm transition-colors hover:bg-primary-container/50"
            >
              Contribute
            </Link>
            <Link
              href={ROUTES.explore}
              className="w-full rounded-xl border border-outline-variant px-8 py-3.5 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Explore
            </Link>
          </div>
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
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [activeTab, setActiveTab] = useState<ProfileTab>('saved');
  const [savedPage, setSavedPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const submittedPlaceSlug = useSubmittedPlaceSlug();
  const savedPageView = paginatePlaceList(savedPlaces, savedPage);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfile(null);
      setSavedPlaces([]);
      setReviews([]);
      setReviewTotal(0);
      setReviewPage(1);
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
        fetchMyReviews(() => getTokenRef.current(), { page: 1, limit: REVIEW_PAGE_SIZE }),
      ]);
      if (cancelled) return;
      setProfile(profileResult.profile);
      setLoadError(profileResult.error);
      setSavedPlaces(saved);
      setSavedPage(1);
      setReviews(myReviews.items);
      setReviewTotal(myReviews.total);
      setReviewPage(myReviews.page);
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
            {submittedPlaceSlug ? <PlaceSubmittedBanner /> : null}
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
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
                  {profile.displayName}
                </h2>
                <p className="font-body-lg text-on-surface-variant">@{profile.username}</p>
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
                <div className="mb-4">
                  <h3 className="font-title-md text-on-surface">Saved Places</h3>
                </div>
                {savedPlaces.length === 0 ? (
                  <GlassCard className="p-4 text-on-surface-variant">
                    No saved places yet. Explore the map and tap Save on a place you like.
                  </GlassCard>
                ) : (
                  <>
                    <div className={PLACE_LIST_GRID_CLASS}>
                      {savedPageView.items.map((place) => (
                        <PlaceListCard key={place.id} place={place} />
                      ))}
                    </div>
                    <PlaceListPaginationBar {...savedPageView} onPageChange={setSavedPage} />
                  </>
                )}
              </section>
            ) : (
              <section className="space-y-4">
                {reviews.length === 0 ? (
                  <GlassCard className="p-4 text-on-surface-variant">
                    No reviews yet. Open a place and write a climate review.
                  </GlassCard>
                ) : (
                  reviews.map((review) => <ReviewRow key={review.id} review={review} />)
                )}
                <ReviewPaginationBar
                  page={reviewPage}
                  totalPages={reviewPageCount(reviewTotal, REVIEW_PAGE_SIZE)}
                  total={reviewTotal}
                  onPageChange={(nextPage) => {
                    setReviewPage(nextPage);
                    void (async () => {
                      const next = await fetchMyReviews(() => getTokenRef.current(), {
                        page: nextPage,
                        limit: REVIEW_PAGE_SIZE,
                      });
                      setReviews(next.items);
                      setReviewTotal(next.total);
                      setReviewPage(next.page);
                    })();
                  }}
                />
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

            <ProfileAccountActions />
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
