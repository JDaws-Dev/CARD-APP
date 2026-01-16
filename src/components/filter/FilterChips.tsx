'use client';

interface FilterChipsProps {
  selectedSetName: string | null;
  selectedType: string | null;
  nameFilter: string;
  onClearSet: () => void;
  onClearType: () => void;
  onClearName: () => void;
}

export function FilterChips({
  selectedSetName,
  selectedType,
  nameFilter,
  onClearSet,
  onClearType,
  onClearName,
}: FilterChipsProps) {
  const hasFilters = selectedSetName || selectedType || nameFilter;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nameFilter && (
        <span className="inline-flex items-center gap-1 rounded-full bg-kid-primary/10 px-3 py-1 text-sm font-medium text-kid-primary">
          Name: {nameFilter}
          <button
            onClick={onClearName}
            className="ml-1 rounded-full p-0.5 hover:bg-kid-primary/20"
            aria-label="Clear name filter"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      )}
      {selectedSetName && (
        <span className="inline-flex items-center gap-1 rounded-full bg-kid-secondary/10 px-3 py-1 text-sm font-medium text-kid-secondary">
          Set: {selectedSetName}
          <button
            onClick={onClearSet}
            className="ml-1 rounded-full p-0.5 hover:bg-kid-secondary/20"
            aria-label="Clear set filter"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      )}
      {selectedType && (
        <span className="bg-kid-accent/10 text-kid-accent inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium">
          Type: {selectedType}
          <button
            onClick={onClearType}
            className="hover:bg-kid-accent/20 ml-1 rounded-full p-0.5"
            aria-label="Clear type filter"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      )}
    </div>
  );
}
