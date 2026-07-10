import type { Filter, SortKey } from '../lib/types';

interface FiltersProps {
  filter: Filter;
  sort: SortKey;
  onFilterChange: (filter: Filter) => void;
  onSortChange: (sort: SortKey) => void;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Newest' },
  { value: 'priority', label: 'Priority' },
  { value: 'alpha', label: 'A → Z' },
];

export function Filters({ filter, sort, onFilterChange, onSortChange }: FiltersProps) {
  return (
    <div className="filters">
      <div className="filters__chips" role="tablist" aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            className={`chip${filter === f.value ? ' chip--active' : ''}`}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <label className="filters__sort">
        Sort:
        <select
          className="filters__sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
