import { notFound } from 'next/navigation';
import {
  AcStrengthBar,
  AC_STRENGTH_LABELS,
  GlassCard,
  PLACE_CATEGORY_LABELS,
} from '@freshy/ui';
import { AppBottomNav } from '../../../components/AppBottomNav';
import { PlaceActions } from '../../../components/PlaceActions';
import { acStrengthLevel, fetchPlace } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await fetchPlace(slug);
  if (!place) notFound();

  const categoryLabel =
    PLACE_CATEGORY_LABELS[place.category as keyof typeof PLACE_CATEGORY_LABELS] ?? place.category;

  return (
    <div className="min-h-screen pb-10" data-page="place-detail">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <h1 className="text-xl font-semibold text-primary">Place Details</h1>
      </header>

      <main className="pt-16">
        <section className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container">
          <div className="absolute bottom-6 left-margin-mobile">
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold uppercase">
              {place.isOpen !== false ? 'Open now' : 'Closed'}
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white drop-shadow">{place.name}</h2>
            <p className="text-sm text-white/80">{categoryLabel}</p>
          </div>
        </section>

        <section className="relative z-10 -mt-8 grid grid-cols-2 gap-4 px-margin-mobile">
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">Interior</span>
            <div className="text-4xl font-bold text-primary">
              {place.aggregatedTemperatureC != null
                ? `${Math.round(place.aggregatedTemperatureC)}`
                : '—'}
              <span className="text-lg">°C</span>
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">AC Strength</span>
            <div className="mt-2 w-full">
              <AcStrengthBar level={acStrengthLevel(place.aggregatedAcStrength)} />
            </div>
            <span className="mt-1 text-sm font-semibold text-primary">
              {place.aggregatedAcStrength
                ? AC_STRENGTH_LABELS[place.aggregatedAcStrength]
                : 'Unknown'}
            </span>
          </GlassCard>
        </section>

        <section className="mt-6 px-margin-mobile">
          {place.address && (
            <p className="mb-4 text-sm text-on-surface-variant">{place.address}</p>
          )}
          <p className="text-on-surface-variant">{place.description}</p>
          <PlaceActions
            name={place.name}
            latitude={place.latitude}
            longitude={place.longitude}
            slug={place.slug}
          />
        </section>

        <section className="mt-8 px-margin-mobile">
          <h3 className="mb-4 text-xl font-semibold">Climate Reviews</h3>
          {place.reviews.length === 0 ? (
            <GlassCard className="p-4 text-on-surface-variant">No reviews yet.</GlassCard>
          ) : (
            place.reviews.map((review) => (
              <GlassCard key={review.id} className="mb-3 p-4">
                <p className="italic text-on-surface-variant">
                  &quot;{review.comment ?? 'No comment.'}&quot;
                </p>
                <p className="mt-2 text-sm text-outline">— {review.user.displayName}</p>
              </GlassCard>
            ))
          )}
        </section>
      </main>

      <AppBottomNav active="explore" />
    </div>
  );
}
