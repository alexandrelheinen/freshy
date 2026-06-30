'use client';

import { useAuth, SignInButton } from '@clerk/clerk-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ALL_PLACE_CATEGORIES,
  PLACE_TAG_ICONS,
  PLACE_TAG_LABELS,
  PLACE_TAGS,
  FRESHNESS_LEVELS,
  FreshnessBar,
  MaterialIcon,
  PILOT_CITY,
  PLACE_CATEGORY_LABELS,
  ROUTES,
  type MaterialIconName,
  type PlaceCategory,
  type PlaceTagId,
  type FreshnessLevelId,
} from '@freshy/ui';
import { AppBottomNav, AppMobileHeader, AppTopNav } from './AppNav';
import { createUserPlace } from '../lib/user-api';

export function AddPlaceClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('CAFE');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [temperature, setTemperature] = useState(22);
  const [freshnessLevel, setFreshnessLevel] = useState<FreshnessLevelId>('MODEST_AC');
  const [tags, setTags] = useState<PlaceTagId[]>(['calm']);
  const [latitude, setLatitude] = useState<number>(PILOT_CITY.latitude);
  const [longitude, setLongitude] = useState<number>(PILOT_CITY.longitude);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: PlaceTagId) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(status: 'DRAFT' | 'PUBLISHED') {
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required.');
      return;
    }
    setSubmitting(true);
    const result = await createUserPlace(getToken, {
      name: name.trim(),
      category,
      address: address.trim(),
      description: description.trim() || undefined,
      latitude,
      longitude,
      aggregatedTemperatureC: temperature,
      aggregatedFreshnessLevel: freshnessLevel,
      tags,
      status,
    });
    setSubmitting(false);
    if (result) {
      router.push(status === 'PUBLISHED' ? ROUTES.place(result.slug) : ROUTES.profile);
      return;
    }
    setError('Could not save place. Check that you are signed in and the API is running.');
  }

  const selectedFreshness = FRESHNESS_LEVELS.find((level) => level.id === freshnessLevel)!;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-page="add-place">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen pb-32" data-page="add-place">
        <AppMobileHeader title="Add Place" backHref={ROUTES.profile} showBrand={false} />
        <main className="mx-auto mt-24 max-w-md px-margin-mobile text-center">
          <p className="text-on-surface-variant">Sign in to add a cooling spot.</p>
          <SignInButton mode="modal">
            <button type="button" className="mt-6 rounded-xl bg-primary px-8 py-3 text-on-primary">
              Sign in
            </button>
          </SignInButton>
        </main>
      </div>
    );
  }

  const formFields = (
    <>
      <section>
        <label className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-high transition-all active:scale-[0.98] hover:border-primary/40">
          <MaterialIcon name="add_a_photo" className="mb-2 text-4xl text-on-surface-variant" />
          <p className="font-body-sm font-semibold text-on-surface-variant">Add place photos</p>
          <p className="text-[10px] uppercase tracking-wider opacity-60">PNG, JPG up to 10MB</p>
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0"
            aria-label="Upload photo"
          />
        </label>
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
            >
              <MaterialIcon name="map" size={18} />
              MAP
            </button>
          </div>
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
          <div className="mb-2 flex items-center justify-between">
            <label className="font-label-caps text-on-surface-variant">Target temperature</label>
            <span className="font-headline-lg-mobile text-primary">{temperature}°C</span>
          </div>
          <input
            type="range"
            min={16}
            max={26}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-full bg-outline-variant"
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold text-outline">
            <span>16°C</span>
            <span>26°C</span>
          </div>
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
                  {option.shortLabel}
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
    <div className="min-h-screen pb-40 md:pb-8" data-page="add-place">
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
              onClick={() => void submit('PUBLISHED')}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 font-label-caps text-on-primary shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <MaterialIcon name="publish" size={20} />
              Create and Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">{formFields}</div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-24 rounded-3xl border border-primary-container/30 bg-primary-container/10 p-6">
              <h3 className="mb-4 font-title-md text-primary">Preview</h3>
              <p className="font-title-md text-on-surface">{name || 'Place name'}</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {PLACE_CATEGORY_LABELS[category]} · {temperature}°C · {selectedFreshness.label}
              </p>
              <p className="mt-4 text-body-sm text-on-surface-variant">
                {address || 'Address will appear here'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 z-50 w-full space-y-2 border-t border-outline-variant/20 bg-surface/90 px-margin-mobile pb-8 pt-4 backdrop-blur-lg md:hidden">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit('PUBLISHED')}
          className="h-14 w-full rounded-xl bg-primary font-headline-lg-mobile text-on-primary shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
        >
          Create and Publish
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit('DRAFT')}
          className="h-12 w-full rounded-xl bg-transparent font-title-md text-secondary hover:bg-secondary/5"
        >
          Save as Draft
        </button>
      </footer>

      <AppBottomNav active="profile" />
    </div>
  );
}
