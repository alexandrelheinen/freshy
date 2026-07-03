'use client';

import Link from 'next/link';
import { MaterialIcon, ROUTES } from '@freshy/ui';

export function StudioNotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center"
      data-page="studio-not-found"
    >
      <MaterialIcon name="search_off" size={48} className="text-secondary" />
      <h1 className="mt-4 font-headline-lg text-headline-lg text-on-surface">Page not found</h1>
      <p className="mt-2 max-w-sm text-body-lg text-secondary">
        This page does not exist or you do not have access to it.
      </p>
      <Link
        href={ROUTES.explore}
        className="mt-8 rounded-full bg-primary px-6 py-3 font-title-md text-on-primary transition-transform hover:scale-105"
      >
        Back to Explore
      </Link>
    </div>
  );
}
