'use client';

import { SignInButton, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { fetchIsPlaceSaved, savePlaceForUser, unsavePlaceForUser } from '../lib/user-api';

export function SavePlaceButton({ placeId }: { placeId: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setSaved(false);
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      const isSaved = await fetchIsPlaceSaved(getToken, placeId);
      setSaved(isSaved);
      setLoading(false);
    })();
  }, [isLoaded, isSignedIn, getToken, placeId]);

  async function toggleSave() {
    setBusy(true);
    setError(null);
    const ok = saved
      ? await unsavePlaceForUser(getToken, placeId)
      : await savePlaceForUser(getToken, placeId);
    if (ok) {
      setSaved(!saved);
    } else {
      setError('Could not update saved places. Try again.');
    }
    setBusy(false);
  }

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <div className="mt-0">
        <SignInButton mode="modal">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant/30 bg-surface font-semibold text-primary"
          >
            Sign in to save this place
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="mt-0">
      <button
        type="button"
        disabled={loading || busy}
        onClick={() => void toggleSave()}
        className="flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant/30 bg-surface font-semibold text-primary disabled:opacity-60"
      >
        {loading ? 'Loading…' : saved ? 'Saved ✓' : 'Save place'}
      </button>
      {error ? <p className="mt-2 text-center font-body-sm text-error">{error}</p> : null}
    </div>
  );
}
