'use client';

import type { FreshnessLevelId } from '@freshy/config/freshness-levels';
import {
  EXPLORE_FILTER_CHIPS,
  EXPLORE_MIN_FRESHNESS_CHIPS,
  FreshnessBar,
  MaterialIcon,
  PLACE_CATEGORY_ICONS,
  type MaterialIconName,
  type PlaceCategory,
} from '@freshy/ui';
import { freshnessBarState } from '../lib/api';
import { FilterChipScrollRow } from './FilterChipScrollRow';
import type { StudioPlaceStatusFilter } from '../lib/studio-api';

const STUDIO_STATUS_FILTERS: Array<{
  value: StudioPlaceStatusFilter | null;
  label: string;
  icon: MaterialIconName;
}> = [
  { value: null, label: 'All statuses', icon: 'filter_list' },
  { value: 'PUBLISHED', label: 'Published', icon: 'verified' },
  { value: 'DRAFT', label: 'Draft', icon: 'pending' },
  { value: 'IMPORTED', label: 'Imported', icon: 'sync' },
];

function chipIcon(category: PlaceCategory): MaterialIconName {
  return PLACE_CATEGORY_ICONS[category] as MaterialIconName;
}

export interface StudioPlaceFilterValues {
  search: string;
  category: PlaceCategory | null;
  placeStatus: StudioPlaceStatusFilter | null;
  freshnessLevel: FreshnessLevelId | null;
}

export function StudioPlaceFilters({
  values,
  onSearchChange,
  onApplySearch,
  onClearSearch,
  onCategoryChange,
  onPlaceStatusChange,
  onFreshnessChange,
  onClear,
  hasActiveFilters,
}: {
  values: StudioPlaceFilterValues;
  onSearchChange: (value: string) => void;
  onApplySearch: () => void;
  onClearSearch: () => void;
  onCategoryChange: (value: PlaceCategory | null) => void;
  onPlaceStatusChange: (value: StudioPlaceStatusFilter | null) => void;
  onFreshnessChange: (value: FreshnessLevelId | null) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <section className="space-y-3 border-b border-outline-variant/10 bg-surface-container-low/40 px-4 py-4 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-4 py-2 md:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            onApplySearch();
          }}
        >
          <MaterialIcon name="search" size={18} className="shrink-0 text-secondary" />
          <input
            value={values.search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-body-sm text-on-surface focus:ring-0"
            placeholder="Search name, address, slug, or ID…"
            aria-label="Search places"
          />
          {values.search ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-full p-1 text-secondary hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Clear search"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          ) : null}
        </form>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-outline-variant/30 bg-surface px-4 py-2 font-label-caps text-[11px] text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <FilterChipScrollRow aria-label="Place category filters">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          aria-pressed={values.category == null}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm transition-colors ${
            values.category == null
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
          }`}
        >
          <MaterialIcon name="explore" size={18} />
          <span className="whitespace-nowrap text-sm font-medium">All categories</span>
        </button>
        {EXPLORE_FILTER_CHIPS.map((chip) => {
          const isActive = values.category === chip.category;
          return (
            <button
              key={chip.category}
              type="button"
              onClick={() => onCategoryChange(chip.category)}
              aria-pressed={isActive}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
              }`}
            >
              <MaterialIcon name={chipIcon(chip.category)} size={18} />
              <span className="whitespace-nowrap text-sm font-medium">{chip.label}</span>
            </button>
          );
        })}
      </FilterChipScrollRow>

      <FilterChipScrollRow aria-label="Database status filters">
        {STUDIO_STATUS_FILTERS.map((option) => {
          const isActive = values.placeStatus === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onPlaceStatusChange(option.value)}
              aria-pressed={isActive}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
              }`}
            >
              <MaterialIcon name={option.icon} size={18} filled={option.value === 'PUBLISHED'} />
              <span className="whitespace-nowrap text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </FilterChipScrollRow>

      <FilterChipScrollRow aria-label="Freshness level filters">
        <button
          type="button"
          onClick={() => onFreshnessChange(null)}
          aria-pressed={values.freshnessLevel == null}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm transition-colors ${
            values.freshnessLevel == null
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
          }`}
        >
          <MaterialIcon name="ac_unit" size={18} />
          <span className="whitespace-nowrap text-sm font-medium">Any freshness</span>
        </button>
        {EXPLORE_MIN_FRESHNESS_CHIPS.map((chip) => {
          const isActive = values.freshnessLevel === chip.level;
          const bar = freshnessBarState(chip.level);
          return (
            <button
              key={chip.level}
              type="button"
              onClick={() => onFreshnessChange(chip.level as FreshnessLevelId)}
              aria-pressed={isActive}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container'
              }`}
            >
              <span className="inline-flex w-10">
                <FreshnessBar segments={bar.segments} tone={bar.tone} />
              </span>
              <span className="whitespace-nowrap text-sm font-medium">{chip.label}</span>
            </button>
          );
        })}
      </FilterChipScrollRow>
    </section>
  );
}
