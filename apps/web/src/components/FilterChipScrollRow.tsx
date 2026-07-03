'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface FilterChipScrollRowProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/** Horizontally scrollable chip row: swipe on mobile, wheel and scrollbar on desktop. */
export function FilterChipScrollRow({
  children,
  className,
  'aria-label': ariaLabel,
}: FilterChipScrollRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (element.scrollWidth <= element.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      element.scrollLeft += event.deltaY;
      event.preventDefault();
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div
      ref={ref}
      aria-label={ariaLabel}
      className={`filter-chip-scroll flex gap-2 overflow-x-auto overscroll-x-contain pb-1 max-md:hide-scrollbar md:scroll-smooth ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
