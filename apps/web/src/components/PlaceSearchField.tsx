'use client';

import { MaterialIcon } from '@freshy/ui';

export function PlaceSearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <form
      className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-4 py-2 md:max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <MaterialIcon name="search" size={18} className="shrink-0 text-secondary" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent p-0 text-body-sm text-on-surface focus:ring-0"
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1 text-secondary hover:bg-surface-container-high hover:text-on-surface"
          aria-label="Clear search"
        >
          <MaterialIcon name="close" size={16} />
        </button>
      ) : null}
    </form>
  );
}
