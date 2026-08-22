'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { placeNotFoundCopy } from '../lib/place-not-found';

export function PlaceNotFound({ message, children }: { message?: string; children?: ReactNode }) {
  const copy = placeNotFoundCopy(message);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = copy.documentTitle;
    return () => {
      document.title = previousTitle;
    };
  }, [copy.documentTitle]);

  return (
    <div className="min-h-screen pb-10" data-page={copy.pageMarker}>
      <AppMobileHeader
        title={copy.heading}
        backHref={copy.backHref}
        showBrand={false}
        active="explore"
      />
      <AppTopNav active="explore" />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-margin-mobile pt-24 text-center md:max-w-4xl md:pt-32">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{copy.heading}</h1>
        <p className="mt-3 text-on-surface-variant">{copy.message}</p>
        {children}
        <Link
          href={copy.backHref}
          className="mt-8 rounded-full bg-primary px-6 py-3 font-title-md text-on-primary transition-transform hover:scale-105"
        >
          {copy.backLabel}
        </Link>
      </main>
    </div>
  );
}
