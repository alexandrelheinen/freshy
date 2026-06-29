'use client';

import { directionsUrl } from '../lib/api';

export function PlaceActions({
  name,
  latitude,
  longitude,
  slug,
}: {
  name: string;
  latitude: number;
  longitude: number;
  slug: string;
}) {
  const url =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://freshy.app/places/${slug}`;

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <a
        href={directionsUrl(latitude, longitude, name)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-on-primary shadow-lg"
      >
        Get Directions
      </a>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant/30 bg-surface font-semibold text-primary"
      >
        Share Place
      </button>
    </div>
  );
}
