import { X } from 'lucide-react';

export function ClearSearchButton({ value, onClear, label = 'Clear search' }) {
  if (!String(value || '')) return null;

  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={label}
      className="absolute right-3 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-artisan-text-muted/55 transition hover:bg-artisan-primary-wash hover:text-artisan-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
    >
      <X size={15} aria-hidden="true" />
    </button>
  );
}
