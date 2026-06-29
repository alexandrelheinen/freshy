'use client';

import Link from 'next/link';
import { NAV_ITEMS } from '@freshy/ui';

export function AppBottomNav({
  active = 'explore',
}: {
  active?: 'explore' | 'saved' | 'cooling' | 'profile';
}) {
  return (
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant/20 bg-surface/90 px-4 pb-6 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-lg">
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide ${
              isActive ? 'bg-primary-container text-on-primary-container' : 'text-secondary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
