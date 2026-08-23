'use client';

import { SignInButton, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FreshnessBar, GlassCard, MaterialIcon } from '@freshy/ui';
import { fetchPlaceReviews, formatRelativeTime, type PlaceReviewDto } from '../lib/api';
import {
  REVIEW_PAGE_SIZE,
  reviewCoolnessLabel,
  reviewCoolnessSegments,
  reviewPageCount,
} from '../lib/reviews';
import { fetchMyReviews, upsertMyReview } from '../lib/user-api';
import { ReviewPaginationBar } from './ReviewPaginationBar';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ReviewAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
      {userInitials(name)}
    </div>
  );
}

function ReviewCard({ review }: { review: PlaceReviewDto }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
      <div className="mb-2 flex items-center gap-3">
        <ReviewAvatar name={review.user.displayName} avatarUrl={review.user.avatarUrl} />
        <div>
          <h4 className="font-title-md leading-none text-on-surface">{review.user.displayName}</h4>
          <span className="font-body-sm text-outline">{formatRelativeTime(review.createdAt)}</span>
        </div>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <FreshnessBar segments={reviewCoolnessSegments(review.acStrength)} tone="blue" />
        <span className="font-label-caps text-secondary">
          {reviewCoolnessLabel(review.acStrength)}
        </span>
      </div>
      <p className="font-body-lg italic text-on-surface-variant">
        &quot;{review.comment ?? 'No comment.'}&quot;
      </p>
    </div>
  );
}

function PlaceReviewForm({ placeId, onSaved }: { placeId: string; onSaved: () => void }) {
  const { getToken } = useAuth();
  const [acStrength, setAcStrength] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const page = await fetchMyReviews(() => getToken(), { placeId, limit: 1 });
      if (cancelled) return;
      const mine = page.items[0];
      if (mine) {
        setExisting(true);
        setAcStrength(mine.acStrength);
        setComment(mine.comment ?? '');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, placeId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await upsertMyReview(() => getToken(), {
      placeId,
      acStrength,
      comment,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setExisting(true);
    onSaved();
  }

  return (
    <GlassCard className="mb-6 p-4">
      <h4 className="font-title-md text-on-surface">
        {existing ? 'Update your review' : 'Write a review'}
      </h4>
      <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset>
          <legend className="mb-2 font-label-caps text-on-surface-variant">Coolness</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAcStrength(value)}
                className={`rounded-full px-3 py-1.5 font-label-caps transition-colors ${
                  acStrength === value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="mt-2 font-body-sm text-secondary">{reviewCoolnessLabel(acStrength)}</p>
        </fieldset>
        <label className="block">
          <span className="font-label-caps text-on-surface-variant">Comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="How cold was it? Any tips?"
            className="mt-2 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 font-body-sm text-on-surface"
          />
        </label>
        {error ? <p className="font-body-sm text-error">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary px-6 py-2.5 font-label-caps text-on-primary disabled:opacity-60"
        >
          {submitting ? 'Saving…' : existing ? 'Update review' : 'Publish review'}
        </button>
      </form>
    </GlassCard>
  );
}

export function PlaceReviewsSection({
  placeId,
  slug,
  initialReviews,
  initialTotal,
  reviewAverage,
}: {
  placeId: string;
  slug: string;
  initialReviews: PlaceReviewDto[];
  initialTotal: number;
  reviewAverage: number | null;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const skipInitialFetch = useRef(true);

  useEffect(() => {
    setReviews(initialReviews);
    setTotal(initialTotal);
    setPage(1);
    skipInitialFetch.current = true;
  }, [initialReviews, initialTotal, slug]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const next = await fetchPlaceReviews(slug, page);
      if (cancelled) return;
      if (next) {
        setReviews(next.items);
        setTotal(next.total);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, slug]);

  function handleSaved() {
    skipInitialFetch.current = true;
    setPage(1);
    void (async () => {
      const next = await fetchPlaceReviews(slug, 1);
      if (next) {
        setReviews(next.items);
        setTotal(next.total);
      }
    })();
  }

  const totalPages = reviewPageCount(total, REVIEW_PAGE_SIZE);
  const score = reviewAverage != null ? reviewAverage.toFixed(1) : null;

  return (
    <section className="mt-8 px-margin-mobile md:px-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
          Climate Reviews
        </h3>
        {score ? (
          <span className="flex items-center gap-1 font-title-md text-primary">
            <MaterialIcon name="star" filled size={20} />
            {score}
          </span>
        ) : null}
      </div>

      {!clerkEnabled ? null : !isLoaded ? (
        <p className="mb-4 font-body-sm text-on-surface-variant">Loading review form…</p>
      ) : isSignedIn ? (
        <PlaceReviewForm placeId={placeId} onSaved={handleSaved} />
      ) : (
        <GlassCard className="mb-6 p-4">
          <p className="font-body-sm text-on-surface-variant">Sign in to write a climate review.</p>
          <SignInButton mode="modal">
            <button
              type="button"
              className="mt-3 rounded-xl bg-primary px-6 py-2.5 font-label-caps text-on-primary"
            >
              Sign in to review
            </button>
          </SignInButton>
        </GlassCard>
      )}

      {loading ? (
        <p className="text-on-surface-variant">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <GlassCard className="p-4 text-on-surface-variant">No reviews yet.</GlassCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <ReviewPaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </section>
  );
}
