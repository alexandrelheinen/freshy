'use client';

import { useSyncExternalStore } from 'react';
import { PlaceDetailClient } from './PlaceDetailClient';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function readSlugFromPath(): string {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const placesIndex = parts.indexOf('places');
  const segment = placesIndex >= 0 ? parts[placesIndex + 1] : undefined;
  if (!segment || segment === 'detail') return '';
  return segment;
}

/** Resolves slug from the browser URL (used with Cloudflare `/places/*` → `_` rewrite). */
export function PlaceDetailFromPathClient() {
  const slug = useSyncExternalStore(subscribe, readSlugFromPath, () => '');

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-10" data-page="place-detail">
        <p className="text-on-surface-variant">Place not found.</p>
      </div>
    );
  }

  return <PlaceDetailClient slug={slug} />;
}
