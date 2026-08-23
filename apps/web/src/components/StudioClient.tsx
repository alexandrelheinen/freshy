'use client';

import { useAuth, useUser } from '@clerk/clerk-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FRESHNESS_LEVEL_LABELS,
  FreshnessBar,
  BRAND_ICON,
  BRAND_NAME,
  MaterialIcon,
  ROUTES,
  getPlacePhotoUrl,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import {
  approveStudioPlace,
  deleteStudioPlace,
  fetchStudioDuplicates,
  fetchStudioPlaces,
  fetchStudioStats,
  mergeStudioPlaces,
  updateStudioPlace,
  type StudioPlaceDto,
  type StudioPlaceStatus,
  type StudioStatsDto,
} from '../lib/studio-api';
import { StudioPlaceEditModal } from './StudioPlaceEditModal';
import { StudioContributorCell } from './StudioContributorCell';
import { StudioMyContributorSecretBar } from './StudioMyContributorSecretBar';
import { StudioPlaceFilters } from './StudioPlaceFilters';
import { StudioReviewsPanel } from './StudioReviewsPanel';
import { freshnessBarState } from '../lib/api';
import type { StudioPlaceStatusFilter } from '../lib/studio-api';
import type { FreshnessLevelId } from '@freshy/config/freshness-levels';

type StudioView = 'all' | 'verified' | 'pending' | 'duplicate' | 'reviews';

const VIEW_ITEMS: Array<{ id: StudioView; label: string; icon: MaterialIconName }> = [
  { id: 'all', label: 'Places', icon: 'domain' },
  { id: 'pending', label: 'Pending Validation', icon: 'pending_actions' },
  { id: 'duplicate', label: 'Conflicts (Merge)', icon: 'call_merge' },
  { id: 'reviews', label: 'Reviews', icon: 'reviews' },
];

function statusBadge(status: StudioPlaceStatus) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-[12px] font-bold text-on-primary-container">
        <MaterialIcon name="check_circle" filled size={14} />
        Verified
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-[12px] font-bold text-on-secondary-container">
        <MaterialIcon name="pending" size={14} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 text-[12px] font-bold text-on-error-container">
      <MaterialIcon name="layers" filled size={14} />
      Duplicate
    </span>
  );
}

function freshnessBarForPlace(strength: StudioPlaceDto['aggregatedFreshnessLevel']) {
  return freshnessBarState(strength);
}

const STUDIO_PAGE_SIZE_OPTIONS = [10, 50, 100] as const;
type StudioPageSize = (typeof STUDIO_PAGE_SIZE_OPTIONS)[number];

export function StudioClient() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [view, setView] = useState<StudioView>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | null>(null);
  const [placeStatusFilter, setPlaceStatusFilter] = useState<StudioPlaceStatusFilter | null>(null);
  const [freshnessFilter, setFreshnessFilter] = useState<FreshnessLevelId | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StudioPageSize>(10);
  const [stats, setStats] = useState<StudioStatsDto | null>(null);
  const [placesPage, setPlacesPage] = useState<{
    items: StudioPlaceDto[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicatesScanned, setDuplicatesScanned] = useState(false);
  const [duplicateScanCount, setDuplicateScanCount] = useState<number | null>(null);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudioPlaceDto | null>(null);

  const displayName = useMemo(() => {
    if (!user) return 'Studio Admin';
    return (
      user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Studio Admin'
    );
  }, [user]);

  const hasActiveFilters =
    query.length > 0 ||
    categoryFilter != null ||
    placeStatusFilter != null ||
    freshnessFilter != null;

  const invalidateDuplicateScan = useCallback(() => {
    setDuplicatesScanned(false);
    setDuplicateScanCount(null);
  }, []);

  const applySearch = useCallback(() => {
    setQuery(search.trim());
    setPage(1);
    invalidateDuplicateScan();
  }, [search, invalidateDuplicateScan]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setQuery('');
    setPage(1);
    invalidateDuplicateScan();
  }, [invalidateDuplicateScan]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setQuery('');
    setCategoryFilter(null);
    setPlaceStatusFilter(null);
    setFreshnessFilter(null);
    setPage(1);
  }, []);

  const listFetchParams = useMemo(
    () => ({
      q: query || undefined,
      category: categoryFilter ?? undefined,
      placeStatus: placeStatusFilter ?? undefined,
      freshnessLevel: freshnessFilter ?? undefined,
      page,
      limit: pageSize,
    }),
    [categoryFilter, freshnessFilter, page, pageSize, placeStatusFilter, query],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      if (view === 'reviews') {
        const nextStats = await fetchStudioStats(getToken);
        if (nextStats === null) {
          setActionError('Could not load studio data. Try again in a moment.');
          setStats(null);
          setPlacesPage(null);
          return;
        }
        setStats(nextStats);
        setPlacesPage(null);
        return;
      }

      if (view === 'duplicate' && !duplicatesScanned) {
        const nextStats = await fetchStudioStats(getToken);
        if (nextStats === null) {
          setActionError('Could not load studio data. Try again in a moment.');
          setStats(null);
          setPlacesPage(null);
          return;
        }
        setStats(nextStats);
        setPlacesPage(null);
        return;
      }

      const listParams = listFetchParams;
      const [nextStats, nextPlaces] = await Promise.all([
        fetchStudioStats(getToken),
        view === 'duplicate'
          ? fetchStudioDuplicates(getToken, listParams)
          : fetchStudioPlaces(getToken, {
              status: view === 'all' ? 'all' : view,
              ...listParams,
            }),
      ]);
      if (nextStats === null || nextPlaces === null) {
        setActionError('Could not load studio data. Try again in a moment.');
        setStats(nextStats);
        setPlacesPage(nextPlaces);
        return;
      }
      setStats(nextStats);
      setPlacesPage(nextPlaces);
      if (view === 'duplicate') {
        setDuplicateScanCount(nextPlaces.total);
      }
    } catch {
      setActionError('Could not load studio data. Try signing in again.');
    } finally {
      setLoading(false);
    }
  }, [duplicatesScanned, getToken, listFetchParams, view]);

  const scanForDuplicates = useCallback(async () => {
    setScanningDuplicates(true);
    setActionError(null);
    try {
      const result = await fetchStudioDuplicates(getToken, {
        ...listFetchParams,
        page: 1,
      });
      if (result === null) {
        setActionError('Could not scan for duplicates. Try again in a moment.');
        return;
      }
      setDuplicatesScanned(true);
      setDuplicateScanCount(result.total);
      setPage(1);
      if (view === 'duplicate') {
        setPlacesPage(result);
      }
      setToast(
        result.total === 0
          ? 'No nearby duplicates found.'
          : `Found ${result.total} conflict${result.total === 1 ? '' : 's'}.`,
      );
    } catch {
      setActionError('Could not scan for duplicates. Try signing in again.');
    } finally {
      setScanningDuplicates(false);
    }
  }, [getToken, listFetchParams, view]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleApprove(placeId: string) {
    try {
      const ok = await approveStudioPlace(getToken, placeId);
      if (!ok) {
        setActionError('Could not validate place.');
        return;
      }
      setToast('Place validated and published.');
      await loadData();
    } catch {
      setActionError('Could not validate place. Try signing in again.');
    }
  }

  async function handleDelete(placeId: string, placeName: string) {
    if (!window.confirm(`Delete "${placeName}"? This cannot be undone.`)) return;
    try {
      const ok = await deleteStudioPlace(getToken, placeId);
      if (!ok) {
        setActionError('Could not delete place.');
        return;
      }
      setToast('Place deleted.');
      invalidateDuplicateScan();
      await loadData();
    } catch {
      setActionError('Could not delete place. Try signing in again.');
    }
  }

  async function handleMerge(targetPlaceId: string, sourcePlaceId: string) {
    try {
      const ok = await mergeStudioPlaces(getToken, targetPlaceId, sourcePlaceId);
      if (!ok) {
        setActionError('Could not merge places.');
        return;
      }
      setToast('Places merged successfully.');
      invalidateDuplicateScan();
      await loadData();
    } catch {
      setActionError('Could not merge places. Try signing in again.');
    }
  }

  async function handleSaveEdit(payload: {
    name: string;
    address: string | null;
    category: string;
    aggregatedFreshnessLevel: StudioPlaceDto['aggregatedFreshnessLevel'];
    status: 'DRAFT' | 'PUBLISHED';
    description: string | null;
    tags: string[];
    photoUrl: string | null | undefined;
    photoFile: File | null;
  }) {
    if (!editing) return;
    try {
      const ok = await updateStudioPlace(
        getToken,
        editing.id,
        {
          name: payload.name,
          address: payload.address,
          category: payload.category,
          aggregatedFreshnessLevel: payload.aggregatedFreshnessLevel,
          status: payload.status,
          description: payload.description,
          tags: payload.tags,
          ...(payload.photoUrl !== undefined ? { photoUrl: payload.photoUrl } : {}),
        },
        payload.photoFile ? { photo: payload.photoFile } : undefined,
      );
      if (!ok) {
        setActionError('Could not update place.');
        return;
      }
      setEditing(null);
      setToast('Place updated.');
      await loadData();
    } catch {
      setActionError('Could not update place. Try signing in again.');
    }
  }

  const items = placesPage?.items ?? [];
  const total = placesPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (placesPage?.limit ?? pageSize)));

  return (
    <div className="min-h-screen bg-surface-container-low/30 md:flex" data-page="studio">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-lowest md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-8 py-8">
          <Link href={ROUTES.explore} className="inline-flex shrink-0 items-center">
            <div className="inline-flex items-center gap-0.5">
              <MaterialIcon
                name={BRAND_ICON}
                className="shrink-0 leading-none text-primary"
                size={32}
              />
              <span className="m-0 shrink-0 p-0 font-logo tracking-logo leading-none text-primary wordmark-offset-y text-[2.25rem]">
                {BRAND_NAME}
              </span>
            </div>
          </Link>
          <p className="mt-2 font-label-caps text-secondary opacity-60">PLACE STUDIO</p>
        </div>

        <nav className="mt-4 flex-1 space-y-2 px-4">
          {VIEW_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setPage(1);
                  if (item.id !== 'duplicate') {
                    invalidateDuplicateScan();
                  }
                }}
                className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-secondary hover:bg-primary-container/20'
                }`}
              >
                <MaterialIcon name={item.icon} size={22} />
                <span className="font-title-md text-body-lg">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary-container/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-fixed">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <MaterialIcon name="digital_wellbeing" className="text-primary" />
              )}
            </div>
            <div>
              <p className="font-title-md text-body-sm text-on-surface">{displayName}</p>
              <p className="font-label-caps text-[10px] text-secondary">STUDIO ADMIN</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-page-sticky flex h-16 items-center border-b border-outline-variant/10 bg-surface/80 px-4 backdrop-blur-md md:px-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            {view === 'reviews' ? 'Reviews' : 'Establishments'}
          </h2>
        </header>

        {view !== 'reviews' ? (
          <StudioPlaceFilters
            values={{
              search,
              category: categoryFilter,
              placeStatus: placeStatusFilter,
              freshnessLevel: freshnessFilter,
            }}
            onSearchChange={setSearch}
            onApplySearch={applySearch}
            onClearSearch={clearSearch}
            onCategoryChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
              invalidateDuplicateScan();
            }}
            onPlaceStatusChange={(value) => {
              setPlaceStatusFilter(value);
              setPage(1);
              invalidateDuplicateScan();
            }}
            onFreshnessChange={(value) => {
              setFreshnessFilter(value);
              setPage(1);
              invalidateDuplicateScan();
            }}
            onClear={() => {
              clearFilters();
              invalidateDuplicateScan();
            }}
            hasActiveFilters={hasActiveFilters}
          />
        ) : null}

        <StudioMyContributorSecretBar getToken={getToken} onCopied={setToast} />

        <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-outline-variant/10 px-4 py-3 md:hidden">
          {VIEW_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setPage(1);
                  if (item.id !== 'duplicate') {
                    invalidateDuplicateScan();
                  }
                }}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-label-caps transition-colors ${
                  active
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <MaterialIcon name={item.icon} size={18} />
                {item.label}
              </button>
            );
          })}
        </div>

        {view === 'reviews' ? (
          <StudioReviewsPanel getToken={getToken} onToast={setToast} />
        ) : (
          <div className="p-4 md:p-8">
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard
                icon="verified"
                label="Total Verified"
                value={stats?.totalVerified ?? 0}
                tone="primary"
              />
              <StatCard
                icon="hourglass_empty"
                label="Pending Sync"
                value={stats?.pendingValidation ?? 0}
                tone="secondary"
              />
              <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-6">
                <div className="mb-4 inline-flex rounded-xl bg-tertiary-container/30 p-2 text-tertiary">
                  <MaterialIcon name="warning" />
                </div>
                <p className="mb-1 font-label-caps text-secondary">Active Conflicts</p>
                <h3 className="font-headline-lg text-headline-lg">{duplicateScanCount ?? '—'}</h3>
                <button
                  type="button"
                  onClick={() => void scanForDuplicates()}
                  disabled={scanningDuplicates}
                  className="mt-4 rounded-xl bg-tertiary px-4 py-2 font-label-caps text-[11px] text-on-tertiary transition-colors hover:bg-tertiary/90 disabled:opacity-60"
                >
                  {scanningDuplicates ? 'Checking…' : 'Check for duplicates'}
                </button>
              </div>
            </div>

            {actionError ? (
              <p className="mb-4 rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
                {actionError}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl shadow-primary/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 px-4 py-4 md:px-8 md:py-6">
                <h4 className="font-title-md text-on-surface">
                  {hasActiveFilters ? 'Filtered results' : 'Recent establishments'}
                </h4>
                <span className="text-body-sm text-secondary">
                  {loading ? 'Loading…' : `Showing ${items.length} of ${total}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-4 py-4 font-label-caps uppercase text-secondary md:px-8">
                        Place Name
                      </th>
                      <th className="px-4 py-4 font-label-caps uppercase text-secondary">
                        Location
                      </th>
                      <th className="px-4 py-4 text-center font-label-caps uppercase text-secondary">
                        Coolness
                      </th>
                      <th className="px-4 py-4 font-label-caps uppercase text-secondary">Status</th>
                      <th className="px-4 py-4 font-label-caps uppercase text-secondary">
                        Added by
                      </th>
                      <th className="px-4 py-4 text-right font-label-caps uppercase text-secondary md:px-8">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {items.map((place) => (
                      <tr
                        key={place.id}
                        className="group transition-colors hover:bg-primary-container/5"
                      >
                        <td className="px-4 py-5 md:px-8">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-xl bg-surface-container">
                              <img
                                src={getPlacePhotoUrl(
                                  place.photoUrl,
                                  place.category as PlaceCategory,
                                )}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-title-md text-on-surface">{place.name}</p>
                              <p className="text-body-sm text-secondary">
                                ID: {place.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-body-sm text-on-surface-variant">
                            {place.address ?? 'No address'}
                          </p>
                          {place.duplicateOfId ? (
                            <p className="text-[12px] text-secondary">Duplicate detected via GPS</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-5">
                          <div className="mx-auto flex w-24 flex-col items-center gap-1">
                            <FreshnessBar
                              segments={
                                freshnessBarForPlace(place.aggregatedFreshnessLevel).segments
                              }
                              tone={freshnessBarForPlace(place.aggregatedFreshnessLevel).tone}
                            />
                            <span className="text-[10px] font-bold text-primary">
                              {place.aggregatedFreshnessLevel
                                ? FRESHNESS_LEVEL_LABELS[place.aggregatedFreshnessLevel]
                                : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5">{statusBadge(place.studioStatus)}</td>
                        <td className="px-4 py-5">
                          <StudioContributorCell
                            getToken={getToken}
                            contributor={place.contributor}
                            createdById={place.createdById}
                            submittedAt={place.createdAt}
                          />
                        </td>
                        <td className="px-4 py-5 text-right md:px-8">
                          <div className="flex justify-end gap-2">
                            {place.studioStatus === 'pending' ? (
                              <button
                                type="button"
                                onClick={() => void handleApprove(place.id)}
                                className="rounded-lg bg-primary px-3 py-1.5 font-label-caps text-[11px] text-on-primary transition-colors hover:bg-primary/90"
                              >
                                Validate
                              </button>
                            ) : null}
                            {place.studioStatus === 'duplicate' && place.duplicateOfId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Merge "${place.name}" into the original place? The duplicate will be deleted.`,
                                    )
                                  ) {
                                    void handleMerge(place.duplicateOfId!, place.id);
                                  }
                                }}
                                className="rounded-lg bg-tertiary px-3 py-1.5 font-label-caps text-[11px] text-on-tertiary transition-colors hover:bg-tertiary/90"
                              >
                                Merge
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setEditing(place)}
                              className="rounded-lg p-2 text-secondary transition-all hover:bg-primary-container/20 hover:text-primary"
                              title="Edit"
                            >
                              <MaterialIcon name="edit" size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(place.id, place.name)}
                              className="rounded-lg p-2 text-secondary transition-all hover:bg-error-container/20 hover:text-error"
                              title="Delete"
                            >
                              <MaterialIcon name="delete" size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && view === 'duplicate' && !duplicatesScanned ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-secondary">
                          <p>Run a duplicate check to find nearby places within 50 meters.</p>
                          <button
                            type="button"
                            onClick={() => void scanForDuplicates()}
                            disabled={scanningDuplicates}
                            className="mt-4 rounded-xl bg-tertiary px-4 py-2 font-label-caps text-[11px] text-on-tertiary transition-colors hover:bg-tertiary/90 disabled:opacity-60"
                          >
                            {scanningDuplicates ? 'Checking…' : 'Check for duplicates'}
                          </button>
                        </td>
                      </tr>
                    ) : null}
                    {!loading &&
                    items.length === 0 &&
                    (view !== 'duplicate' || duplicatesScanned) ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-secondary">
                          No places match this view.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 md:px-8">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-body-sm text-secondary">
                    <span>Per page</span>
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        const next = Number(event.target.value) as StudioPageSize;
                        setPageSize(next);
                        setPage(1);
                      }}
                      className="rounded-lg border border-outline-variant/30 bg-surface px-2 py-1 text-on-surface"
                    >
                      {STUDIO_PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="text-body-sm text-secondary">
                    Page {page} of {totalPages} ({total} places)
                  </span>
                </div>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg px-3 py-1 text-body-sm text-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {editing ? (
        <StudioPlaceEditModal
          key={editing.id}
          place={editing}
          getToken={getToken}
          onCancel={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-8 right-8 z-toast flex items-center gap-4 rounded-xl border-l-4 border-primary bg-surface-container-highest px-6 py-4 shadow-2xl">
          <MaterialIcon name="check_circle" filled className="text-primary" />
          <div>
            <p className="font-title-md text-body-sm text-on-surface">Action successful</p>
            <p className="text-[12px] text-secondary">{toast}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: MaterialIconName;
  label: string;
  value: string | number;
  tone: 'primary' | 'secondary' | 'tertiary';
}) {
  const iconClass =
    tone === 'primary'
      ? 'bg-primary/10 text-primary'
      : tone === 'secondary'
        ? 'bg-secondary-container/30 text-secondary'
        : 'bg-tertiary-container/30 text-tertiary';

  return (
    <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-4 md:p-6">
      <div className={`mb-4 inline-flex rounded-xl p-2 ${iconClass}`}>
        <MaterialIcon name={icon} />
      </div>
      <p className="mb-1 font-label-caps text-secondary">{label}</p>
      <h3 className="font-headline-lg text-headline-lg">{value}</h3>
    </div>
  );
}
