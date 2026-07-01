'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  VERIFIED_ONLY_CHANGE_EVENT,
  readVerifiedOnlyFilter,
  writeVerifiedOnlyFilter,
} from './verified-filter-storage';

export function useVerifiedOnlyFilter(): {
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
} {
  const [verifiedOnly, setVerifiedOnlyState] = useState(false);

  useEffect(() => {
    setVerifiedOnlyState(readVerifiedOnlyFilter());
    const handler = (event: Event) => {
      setVerifiedOnlyState(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener(VERIFIED_ONLY_CHANGE_EVENT, handler);
    return () => window.removeEventListener(VERIFIED_ONLY_CHANGE_EVENT, handler);
  }, []);

  const setVerifiedOnly = useCallback((value: boolean) => {
    writeVerifiedOnlyFilter(value);
    setVerifiedOnlyState(value);
  }, []);

  return { verifiedOnly, setVerifiedOnly };
}
