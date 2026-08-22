'use client';

import { useAuth, SignInButton } from '@clerk/clerk-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ChangeEvent } from 'react';
import {
  ALL_PLACE_CATEGORIES,
  PLACE_TAG_ICONS,
  PLACE_TAG_LABELS,
  PLACE_TAGS,
  FRESHNESS_LEVELS,
  FreshnessBar,
  MaterialIcon,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type MaterialIconName,
  type PlaceCategory,
  type PlaceTagId,
  type FreshnessLevelId,
} from '@freshy/ui';
import { AppMobileHeader, AppTopNav } from './AppNav';
import { createAnonymousPlace, createUserPlace } from '../lib/user-api';
import { MOBILE_FORM_FOOTER_PADDING_CLASS } from '../lib/layout';
import { writeStoredMapCenter } from '../lib/location-storage';
import { stagePendingMapPlace } from '../lib/pending-map-place';
import { zoomForRadiusKm } from '../lib/map-zoom';
import { useUserLocation } from '../lib/use-user-location';
import { PILOT_CITY } from '@freshy/config/pilot-city';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PLACE_SUBMITTED_KEY = 'freshy-place-submitted';

function stageSubmittedPlaceOnMap(
  slug: string,
  payload: {
    name: string;
    category: PlaceCategory;
    address: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    aggregatedFreshnessLevel: FreshnessLevelId;
    tags: PlaceTagId[];
  },
  photoUrl?: string | null,
) {
  if (payload.latitude == null || payload.longitude == null) return;

  stagePendingMapPlace({
    slug,
    name: payload.name,
    category: payload.category,
    address: payload.address,
    description: payload.description ?? null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    aggregatedFreshnessLevel: payload.aggregatedFreshnessLevel,
    tags: payload.tags,
    photoUrl: photoUrl ?? null,
  });

  writeStoredMapCenter({
    lat: payload.latitude,
    lng: payload.longitude,
    zoom: zoomForRadiusKm(payload.latitude, PILOT_CITY.defaultRadiusKm),
  });
}

export function AddPlaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const anonymousMode = searchParams.get('anonymous') === '1' && !isSignedIn;
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('CAFE');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [freshnessLevel, setFreshnessLevel] = useState<FreshnessLevelId>('MODEST_AC');
  const [tags, setTags] = useState<PlaceTagId[]>(['calm']);
  const { location: userLocation } = useUserLocation();
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreviewIsObjectUrl, setPhotoPreviewIsObjectUrl] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (userLocation) {
      setLatitude(userLocation.lat);
      setLongitude(userLocation.lng);
    }
  }, [userLocation]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreviewIsObjectUrl) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview, photoPreviewIsObjectUrl]);

  function clearPhotoSelection() {
    if (photoPreview && photoPreviewIsObjectUrl) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoUrl('');
    setPhotoPreviewIsObjectUrl(false);
  }

  function setPreviewFromUrl(url: string) {
    if (photoPreview && photoPreviewIsObjectUrl) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(url || null);
    setPhotoPreviewIsObjectUrl(false);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Choose a PNG or JPG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Image must be 10MB or smaller.');
      return;
    }

    if (photoPreview && photoPreviewIsObjectUrl) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoUrl('');
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoPreviewIsObjectUrl(true);
    setPhotoFile(file);
    setError(null);
  }

  function handlePhotoUrlChange(value: string) {
    setPhotoUrl(value);
    const trimmed = value.trim();
    if (!trimmed) {
      if (photoPreview && photoPreviewIsObjectUrl) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setPhotoPreviewIsObjectUrl(false);
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('Image URL must start with http:// or https://');
        return;
      }
      setPreviewFromUrl(trimmed);
      setError(null);
    } catch {
      setError('Enter a valid image URL.');
    }
  }

  function toggleTag(tag: PlaceTagId) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationHint('GPS is not available on this device.');
      return;
    }
    setLocationHint('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationHint(
          `Using GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        );
      },
      () => {
        setLocationHint('Could not get GPS. Check location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit() {
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required.');
      return;
    }
    if (anonymousMode && !secret.trim()) {
      setError('Enter the secret shared by your team.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        address: address.trim(),
        description: description.trim() || undefined,
        latitude,
        longitude,
        aggregatedFreshnessLevel: freshnessLevel,
        tags,
        status: 'DRAFT' as const,
      };
      const options = { photo: photoFile, photoUrl: photoUrl.trim() || undefined };

      const result = anonymousMode
        ? await createAnonymousPlace(secret, payload, options)
        : await createUserPlace(getToken, payload, options);

      if (result.ok) {
        stageSubmittedPlaceOnMap(
          result.slug,
          {
            name: payload.name,
            category: payload.category,
            address: payload.address,
            description: payload.description,
            latitude: payload.latitude ?? result.latitude,
            longitude: payload.longitude ?? result.longitude,
            aggregatedFreshnessLevel: payload.aggregatedFreshnessLevel,
            tags: payload.tags,
          },
          photoUrl.trim() || undefined,
        );

        if (anonymousMode) {
          sessionStorage.setItem(PLACE_SUBMITTED_KEY, result.slug);
          router.push(ROUTES.profile);
          return;
        }
        sessionStorage.setItem(PLACE_SUBMITTED_KEY, result.slug);
        router.push(ROUTES.explore);
        return;
      }
      setError(result.error);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedFreshness = FRESHNESS_LEVELS.find((level) => level.id === freshnessLevel)!;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-page="add-place">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn && !anonymousMode) {
    return (
      <div className="min-h-screen pb-8" data-page="add-place">
        <AppMobileHeader title="Add Place" backHref={ROUTES.profile} showBrand={false} />
        <AppTopNav active="profile" />
        <main className="mx-auto mt-24 max-w-md px-margin-mobile text-center md:mt-28">
          <p className="text-on-surface-variant">Sign in to add a cooling spot.</p>
          <SignInButton mode="modal">
            <button type="button" className="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary">
              Sign in
            </button>
          </SignInButton>
          <Link
            href={`${ROUTES.addPlace}?anonymous=1`}
            className="mt-4 inline-block font-label-caps text-primary hover:underline"
          >
            Contribute without signing in
          </Link>
        </main>
      </div>
    );
  }

  const formFields = (
    <>
      {anonymousMode ? (
        <section className="space-y-2">
          <label
            className="block font-label-caps text-on-surface-variant"
            htmlFor="contributor-secret"
          >
            Secret
          </label>
          <input
            id="contributor-secret"
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 font-body-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Paste the secret shared by your team"
            value={secret}
            onChange={(event) => {
              setSecret(event.target.value);
              if (error) setError(null);
            }}
            autoComplete="off"
          />
          <p className="text-body-sm text-on-surface-variant">
            Ask a team member for a contributor secret if you do not have one yet.
          </p>
        </section>
      ) : null}
      <section className="space-y-3">
        <label className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-high transition-all hover:border-primary/40 active:scale-[0.98]">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <MaterialIcon name="add_a_photo" className="mb-2 text-4xl text-on-surface-variant" />
              <p className="font-body-sm font-semibold text-on-surface-variant">Add place photo</p>
              <p className="text-[10px] uppercase tracking-wider opacity-60">
                Upload or paste a URL below
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="absolute inset-0 opacity-0"
            aria-label="Upload photo"
            onChange={handlePhotoChange}
          />
        </label>
        <div>
          <label className="mb-2 block font-label-caps text-on-surface-variant">Image URL</label>
          <input
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 font-body-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="https://example.com/photo.jpg"
            value={photoUrl}
            onChange={(e) => handlePhotoUrlChange(e.target.value)}
          />
        </div>
        {photoPreview ? (
          <button
            type="button"
            onClick={clearPhotoSelection}
            className="font-label-caps text-secondary hover:text-primary"
          >
            Remove photo
          </button>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <label className="mb-2 block font-label-caps text-on-surface-variant">Place name</label>
          <input
            className="h-12 w-full rounded-lg border border-outline-variant bg-surface px-4 font-body-lg outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="e.g. Glacier Coffee Central"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block font-label-caps text-on-surface-variant">Category</label>
          <div className="relative">
            <select
              className="h-12 w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 font-body-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={category}
              onChange={(e) => setCategory(e.target.value as PlaceCategory)}
            >
              {ALL_PLACE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {PLACE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <MaterialIcon
              name="expand_more"
              className="pointer-events-none absolute right-3 top-3 text-on-surface-variant"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block font-label-caps text-on-surface-variant">Location</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MaterialIcon
                name="location_on"
                className="absolute left-3 top-3 text-on-surface-variant"
              />
              <input
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="flex h-12 items-center gap-1 rounded-lg bg-secondary-container px-4 font-label-caps text-on-secondary-container transition-opacity hover:opacity-80 active:scale-95"
              aria-label="Use my GPS coordinates"
            >
              <MaterialIcon name="my_location" size={18} />
              GPS
            </button>
          </div>
          {locationHint ? (
            <p className="mt-2 font-body-sm text-on-surface-variant">{locationHint}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-2 block font-label-caps text-on-surface-variant">Description</label>
          <textarea
            className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="What makes this spot cool?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-6 rounded-xl border border-primary-container/30 bg-primary-container/10 p-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="ac_unit" className="text-primary" />
          <h3 className="font-title-md text-primary">Cooling status</h3>
        </div>
        <div>
          <label className="mb-3 block font-label-caps text-on-surface-variant">
            Freshness level
          </label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
            {FRESHNESS_LEVELS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFreshnessLevel(option.id as FreshnessLevelId)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all active:scale-95 ${
                  freshnessLevel === option.id
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-outline-variant/20 bg-surface/50 hover:border-primary/40'
                }`}
              >
                <FreshnessBar segments={option.barSegments} tone={option.tone} />
                <span
                  className={`text-center text-[10px] font-bold uppercase ${
                    freshnessLevel === option.id ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center font-body-sm text-on-primary-container opacity-80">
            {selectedFreshness.label}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <label className="block font-label-caps text-on-surface-variant">Tags</label>
        <div className="flex flex-wrap gap-2">
          {PLACE_TAGS.map((tag) => {
            const tagId = tag.id as PlaceTagId;
            const selected = tags.includes(tagId);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tagId)}
                className={`flex items-center gap-1 rounded-full border px-4 py-2 font-body-sm transition-all active:scale-95 ${
                  selected
                    ? 'border-primary bg-secondary-container text-on-secondary-container'
                    : 'border-outline-variant bg-surface text-on-surface-variant'
                }`}
              >
                <MaterialIcon name={PLACE_TAG_ICONS[tagId] as MaterialIconName} size={18} />
                {PLACE_TAG_LABELS[tagId]}
              </button>
            );
          })}
        </div>
      </section>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </>
  );

  return (
    <div
      className={`min-h-screen md:pb-8 ${MOBILE_FORM_FOOTER_PADDING_CLASS}`}
      data-page="add-place"
    >
      <AppMobileHeader title="Add Place" backHref={ROUTES.profile} showBrand={false} />
      <AppTopNav active="profile" />

      <main className="mx-auto max-w-3xl space-y-6 px-margin-mobile pb-8 pt-20 md:max-w-5xl md:px-10 md:pt-24">
        <div className="mb-2 hidden items-center justify-between md:flex">
          <div>
            <h2 className="font-headline-lg text-on-surface">Add New Place</h2>
            <p className="mt-1 text-on-surface-variant">
              Register a new cooling refuge for the Freshy network.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(ROUTES.profile)}
              className="rounded-xl border border-outline px-4 py-2 font-label-caps text-secondary hover:bg-surface-container"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 font-label-caps text-on-primary shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <MaterialIcon name="publish" size={20} />
              Submit for Review
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">{formFields}</div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-24 rounded-3xl border border-primary-container/30 bg-primary-container/10 p-6">
              <h3 className="mb-4 font-title-md text-primary">Preview</h3>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  className="mb-4 aspect-video w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="font-title-md text-on-surface">{name || 'Place name'}</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {PLACE_CATEGORY_LABELS[category]} · {selectedFreshness.label}
              </p>
              <p className="mt-4 text-body-sm text-on-surface-variant">
                {address || 'Address will appear here'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 z-page-sticky w-full border-t border-outline-variant/20 bg-surface/90 px-margin-mobile pb-4 pt-4 backdrop-blur-lg md:hidden">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="h-14 w-full rounded-xl bg-primary font-headline-lg-mobile text-on-primary shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
        >
          Submit for Review
        </button>
      </footer>
    </div>
  );
}
