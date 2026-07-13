'use client';

import { SignInButton, useAuth } from '@clerk/clerk-react';
import { MaterialIcon } from '@freshy/ui';
import { useEffect, useState, type ReactNode } from 'react';
import { directionsUrl } from '../lib/api';
import { fetchIsPlaceSaved, savePlaceForUser, unsavePlaceForUser } from '../lib/user-api';

const ACTION_BUTTON_BASE =
  'flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl px-3 font-semibold text-body-sm transition-all active:scale-[0.98]';

export function PlaceDetailActions({
  placeId,
  latitude,
  longitude,
  address,
}: {
  placeId: string;
  latitude: number;
  longitude: number;
  address?: string | null;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapsHref = directionsUrl({ latitude, longitude, address });
  const stackActions = isLoaded && !isSignedIn;

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

  const directionsButton = (
    <a
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`${ACTION_BUTTON_BASE} bg-primary text-on-primary shadow-lg hover:bg-primary/90 ${
        stackActions ? 'w-full' : 'min-w-0 flex-1'
      }`}
    >
      <MaterialIcon name="directions" size={18} />
      Get Directions
    </a>
  );

  let saveButton: ReactNode = null;
  if (!isLoaded) {
    return null;
  }
  if (!isSignedIn) {
    saveButton = (
      <SignInButton mode="modal">
        <button
          type="button"
          className={`${ACTION_BUTTON_BASE} w-full border border-outline-variant/30 bg-surface text-primary`}
        >
          Sign in to save this place
        </button>
      </SignInButton>
    );
  } else {
    saveButton = (
      <button
        type="button"
        disabled={loading || busy}
        onClick={() => void toggleSave()}
        className={`${ACTION_BUTTON_BASE} min-w-0 flex-1 border border-outline-variant/30 bg-surface text-primary disabled:opacity-60`}
      >
        {loading ? 'Loading…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    );
  }

  return (
    <div>
      <div className={`flex gap-3 ${stackActions ? 'flex-col' : 'flex-row'}`}>
        {directionsButton}
        {saveButton}
      </div>
      {error ? <p className="mt-2 text-center font-body-sm text-error">{error}</p> : null}
    </div>
  );
}
