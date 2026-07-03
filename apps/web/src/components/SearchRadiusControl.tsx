import { MaterialIcon } from '@freshy/ui';
import { formatSearchRadiusKm } from '../lib/map-zoom';

type SearchRadiusControlProps = {
  radiusKm: number;
  onDecrease: () => void;
  onIncrease: () => void;
  variant?: 'compact' | 'panel';
};

export function SearchRadiusControl({
  radiusKm,
  onDecrease,
  onIncrease,
  variant = 'compact',
}: SearchRadiusControlProps) {
  const radiusLabel = formatSearchRadiusKm(radiusKm);

  if (variant === 'panel') {
    return (
      <div className="flex items-center gap-3">
        <MaterialIcon name="near_me" className="text-on-surface-variant" size={20} />
        <button
          type="button"
          onClick={onDecrease}
          aria-label="Decrease search radius"
          className="text-on-surface-variant hover:text-primary"
        >
          <MaterialIcon name="remove" />
        </button>
        <span
          className="min-w-[56px] text-center text-sm font-bold text-on-surface"
          aria-label={`Search radius ${radiusLabel}`}
        >
          {radiusLabel}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          aria-label="Increase search radius"
          className="text-on-surface-variant hover:text-primary"
        >
          <MaterialIcon name="add" />
        </button>
      </div>
    );
  }

  return (
    <div className="glass flex items-center gap-2 rounded-full border border-glass-border px-4 py-2 shadow-lg">
      <MaterialIcon name="near_me" size={18} className="shrink-0 text-primary" />
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease search radius"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container active:text-primary"
      >
        <MaterialIcon name="remove" size={20} />
      </button>
      <span
        className="min-w-[52px] shrink-0 text-center text-sm font-bold tabular-nums text-on-surface"
        aria-label={`Search radius ${radiusLabel}`}
      >
        {radiusLabel}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase search radius"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container active:text-primary"
      >
        <MaterialIcon name="add" size={20} />
      </button>
    </div>
  );
}
