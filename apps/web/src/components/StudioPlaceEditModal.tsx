'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import {
  ALL_PLACE_CATEGORIES,
  FRESHNESS_LEVELS,
  MaterialIcon,
  PLACE_CATEGORY_LABELS,
  PLACE_TAG_ICONS,
  PLACE_TAG_LABELS,
  PLACE_TAGS,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceCategory,
  type PlaceTagId,
} from '@freshy/ui';
import { defaultPlacePhotoLocalPath, defaultPlacePhotoR2Key } from '@freshy/config/place-photos';
import type { StudioPlaceDto } from '../lib/studio-api';
import { StudioContributorSummary } from './StudioContributorCell';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function isDefaultPhotoUrl(url: string | null | undefined, category: PlaceCategory): boolean {
  if (!url) return true;
  const localDefault = defaultPlacePhotoLocalPath(category);
  const r2Default = defaultPlacePhotoR2Key(category);
  return url.includes(localDefault) || url.includes(r2Default);
}

function initialCustomPhotoUrl(place: StudioPlaceDto): string {
  const category = place.category as PlaceCategory;
  if (isDefaultPhotoUrl(place.photoUrl, category)) return '';
  return place.photoUrl ?? '';
}

interface StudioPlaceEditModalProps {
  place: StudioPlaceDto;
  onCancel: () => void;
  onSave: (payload: {
    name: string;
    address: string | null;
    category: string;
    aggregatedFreshnessLevel: StudioPlaceDto['aggregatedFreshnessLevel'];
    status: 'DRAFT' | 'PUBLISHED';
    description: string | null;
    tags: string[];
    photoUrl: string | null | undefined;
    photoFile: File | null;
  }) => void | Promise<void>;
}

export function StudioPlaceEditModal({ place, onCancel, onSave }: StudioPlaceEditModalProps) {
  const category = place.category as PlaceCategory;
  const [selectedTags, setSelectedTags] = useState<PlaceTagId[]>(
    (place.tags ?? []).filter((tag): tag is PlaceTagId =>
      PLACE_TAGS.some((item) => item.id === tag),
    ),
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    getPlacePhotoUrl(place.photoUrl, category),
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState(initialCustomPhotoUrl(place));
  const [photoPreviewIsObjectUrl, setPhotoPreviewIsObjectUrl] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
    setPhotoPreview(getPlacePhotoUrl(null, category));
    setPhotoFile(null);
    setPhotoUrl('');
    setPhotoPreviewIsObjectUrl(false);
    setPhotoRemoved(true);
    setPhotoError(null);
  }

  function setPreviewFromUrl(url: string) {
    if (photoPreview && photoPreviewIsObjectUrl) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(url || getPlacePhotoUrl(null, category));
    setPhotoPreviewIsObjectUrl(false);
    setPhotoRemoved(!url);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose a PNG or JPG image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Image must be 10MB or smaller.');
      return;
    }

    if (photoPreview && photoPreviewIsObjectUrl) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoUrl('');
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoPreviewIsObjectUrl(true);
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPhotoError(null);
  }

  function handlePhotoUrlChange(value: string) {
    setPhotoUrl(value);
    const trimmed = value.trim();
    if (!trimmed) {
      if (photoPreview && photoPreviewIsObjectUrl) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(getPlacePhotoUrl(null, category));
      setPhotoPreviewIsObjectUrl(false);
      setPhotoRemoved(initialCustomPhotoUrl(place) !== '');
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setPhotoError('Image URL must start with http:// or https://');
        return;
      }
      setPreviewFromUrl(trimmed);
      setPhotoError(null);
    } catch {
      setPhotoError('Enter a valid image URL.');
    }
  }

  function toggleTag(tag: PlaceTagId) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    let resolvedPhotoUrl: string | null | undefined;
    if (photoFile) {
      resolvedPhotoUrl = undefined;
    } else if (photoRemoved) {
      resolvedPhotoUrl = null;
    } else if (photoUrl.trim()) {
      resolvedPhotoUrl = photoUrl.trim();
    } else {
      resolvedPhotoUrl = undefined;
    }

    await onSave({
      name: String(form.get('name') ?? '').trim(),
      address: String(form.get('address') ?? '').trim() || null,
      category: String(form.get('category') ?? place.category),
      aggregatedFreshnessLevel: String(
        form.get('freshnessLevel'),
      ) as StudioPlaceDto['aggregatedFreshnessLevel'],
      status: String(form.get('status')) as 'DRAFT' | 'PUBLISHED',
      description: String(form.get('description') ?? '').trim() || null,
      tags: selectedTags,
      photoUrl: resolvedPhotoUrl,
      photoFile,
    });
  }

  const hasCustomPhoto =
    photoFile != null || photoUrl.trim() !== '' || initialCustomPhotoUrl(place) !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <h3 className="font-headline-lg text-headline-lg text-on-surface">Edit place</h3>

        <div className="mt-4">
          <StudioContributorSummary contributor={place.contributor} submittedAt={place.createdAt} />
        </div>

        <div className="mt-6 space-y-4">
          <section className="space-y-3">
            <span className="font-label-caps text-secondary">Photo</span>
            <label className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface transition-all hover:border-primary/40">
              <img
                src={photoPreview ?? undefined}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {!hasCustomPhoto && !photoFile ? (
                <div className="relative z-10 flex flex-col items-center bg-surface/80 px-4 py-6 text-center">
                  <MaterialIcon
                    name="add_a_photo"
                    className="mb-2 text-3xl text-on-surface-variant"
                  />
                  <p className="font-body-sm text-on-surface-variant">
                    Upload or paste a URL below
                  </p>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 opacity-0"
                aria-label="Upload photo"
                onChange={handlePhotoChange}
              />
            </label>
            <label className="block">
              <span className="font-label-caps text-secondary">Image URL</span>
              <input
                value={photoUrl}
                onChange={(event) => handlePhotoUrlChange(event.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
                placeholder="https://example.com/photo.jpg"
              />
            </label>
            {hasCustomPhoto || photoFile ? (
              <button
                type="button"
                onClick={clearPhotoSelection}
                className="font-label-caps text-secondary hover:text-primary"
              >
                Remove photo
              </button>
            ) : null}
            {photoError ? <p className="text-sm text-error">{photoError}</p> : null}
          </section>

          <label className="block">
            <span className="font-label-caps text-secondary">Name</span>
            <input
              name="name"
              defaultValue={place.name}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-label-caps text-secondary">Address</span>
            <input
              name="address"
              defaultValue={place.address ?? ''}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-label-caps text-secondary">Category</span>
            <select
              name="category"
              defaultValue={place.category}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
            >
              {ALL_PLACE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {PLACE_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-label-caps text-secondary">Freshness level</span>
            <select
              name="freshnessLevel"
              defaultValue={place.aggregatedFreshnessLevel ?? 'MODEST_AC'}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
            >
              {FRESHNESS_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-label-caps text-secondary">Publication status</span>
            <select
              name="status"
              defaultValue={place.status}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
            >
              <option value="DRAFT">Draft (pending)</option>
              <option value="PUBLISHED">Published (verified)</option>
            </select>
          </label>
          <label className="block">
            <span className="font-label-caps text-secondary">Description</span>
            <textarea
              name="description"
              defaultValue={place.description ?? ''}
              rows={3}
              className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="font-label-caps text-secondary">Tags</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PLACE_TAGS.map((tag) => {
                const tagId = tag.id as PlaceTagId;
                const checked = selectedTags.includes(tagId);
                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? 'border-primary bg-primary-container/20'
                        : 'border-outline-variant/30 bg-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTag(tagId)}
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <MaterialIcon name={PLACE_TAG_ICONS[tagId] as MaterialIconName} size={18} />
                    <span className="text-body-sm text-on-surface">{PLACE_TAG_LABELS[tagId]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2 text-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2 font-title-md text-on-primary"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
