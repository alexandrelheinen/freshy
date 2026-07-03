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
import { StudioContributorSecretsPanel } from './StudioContributorSecretsPanel';
import { freshnessBarState } from '../lib/api';

type StudioView = 'all' | 'verified' | 'pending' | 'duplicate';

const VIEW_ITEMS: Array<{ id: StudioView; label: string; icon: MaterialIconName }> = [
  { id: 'all', label: 'Places', icon: 'domain' },
  { id: 'pending', label: 'Pending Validation', icon: 'pending_actions' },
  { id: 'duplicate', label: 'Conflicts (Merge)', icon: 'call_merge' },
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

export function StudioClient() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [view, setView] = useState<StudioView>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<StudioStatsDto | null>(null);
  const [placesPage, setPlacesPage] = useState<{
    items: StudioPlaceDto[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudioPlaceDto | null>(null);

  const displayName = useMemo(() => {
    if (!user) return 'Studio Admin';
    return (
      user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Studio Admin'
    );
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    const status = view === 'all' ? 'all' : view;
    const [nextStats, nextPlaces] = await Promise.all([
      fetchStudioStats(getToken),
      fetchStudioPlaces(getToken, { status, q: query || undefined, page, limit: 25 }),
    ]);
    setStats(nextStats);
    setPlacesPage(nextPlaces);
    setLoading(false);
  }, [getToken, page, query, view]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleApprove(placeId: string) {
    const ok = await approveStudioPlace(getToken, placeId);
    if (!ok) {
      setActionError('Could not validate place.');
      return;
    }
    setToast('Place validated and published.');
    await loadData();
  }

  async function handleDelete(placeId: string, placeName: string) {
    if (!window.confirm(`Delete "${placeName}"? This cannot be undone.`)) return;
    const ok = await deleteStudioPlace(getToken, placeId);
    if (!ok) {
      setActionError('Could not delete place.');
      return;
    }
    setToast('Place deleted.');
    await loadData();
  }

  async function handleMerge(targetPlaceId: string, sourcePlaceId: string) {
    const ok = await mergeStudioPlaces(getToken, targetPlaceId, sourcePlaceId);
    if (!ok) {
      setActionError('Could not merge places.');
      return;
    }
    setToast('Places merged successfully.');
    await loadData();
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
  }

  const items = placesPage?.items ?? [];
  const total = placesPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (placesPage?.limit ?? 25)));

  return (
    <div className="min-h-screen bg-surface-container-low/30 md:flex" data-page="studio">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-lowest md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-8 py-8">
          <Link href={ROUTES.explore} className="flex items-center gap-3">
            <MaterialIcon name={BRAND_ICON} filled size={32} className="text-primary" />
            <span className="font-display-lg text-headline-lg text-primary">{BRAND_NAME}</span>
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
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex flex-1 items-center gap-4">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Establishments</h2>
            <form
              className="flex flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-4 py-1.5 md:max-w-xs"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search.trim());
                setPage(1);
              }}
            >
              <MaterialIcon name="search" size={18} className="text-secondary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-48 border-none bg-transparent p-0 text-body-sm focus:ring-0"
                placeholder="Search by name or ID…"
              />
            </form>
          </div>
        </header>

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

        <div className="p-4 md:p-8">
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            <StatCard
              icon="warning"
              label="Active Conflicts"
              value={stats?.activeConflicts ?? 0}
              tone="tertiary"
            />
            <StatCard
              icon="ac_unit"
              label="Avg Freshness"
              value={
                stats?.averageFreshnessScore != null ? `${stats.averageFreshnessScore} / 4` : '—'
              }
              tone="primary"
            />
          </div>

          {actionError ? (
            <p className="mb-4 rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {actionError}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl shadow-primary/5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/10 px-4 py-4 md:px-8 md:py-6">
              <h4 className="font-title-md text-on-surface">Recent Establishments</h4>
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
                    <th className="px-4 py-4 font-label-caps uppercase text-secondary">Location</th>
                    <th className="px-4 py-4 text-center font-label-caps uppercase text-secondary">
                      Coolness
                    </th>
                    <th className="px-4 py-4 font-label-caps uppercase text-secondary">Status</th>
                    <th className="px-4 py-4 font-label-caps uppercase text-secondary">Added by</th>
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
                          {place.address?.split(',')[0] ?? 'No address'}
                        </p>
                        {place.duplicateOfId ? (
                          <p className="text-[12px] text-secondary">Duplicate detected via GPS</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-5">
                        <div className="mx-auto flex w-24 flex-col items-center gap-1">
                          <FreshnessBar
                            segments={freshnessBarForPlace(place.aggregatedFreshnessLevel).segments}
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
                          contributor={place.contributor}
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
                  {!loading && items.length === 0 ? (
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
              <span className="text-body-sm text-secondary">
                Page {page} of {totalPages}
              </span>
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
      </main>

      {editing ? (
        <StudioPlaceEditModal
          key={editing.id}
          place={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-4 rounded-xl border-l-4 border-primary bg-surface-container-highest px-6 py-4 shadow-2xl">
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
      <h3 className="font-display-lg text-headline-lg">{value}</h3>
    </div>
  );
}
