import type { BannerSortField, SortDirection } from '../../types/banner'
import { MaterialIcon } from '../ui/MaterialIcon'

interface SortableTableHeaderProps {
  label: string
  field: BannerSortField
  sortField: BannerSortField
  sortDirection: SortDirection
  onSort: (field: BannerSortField) => void
  align?: 'left' | 'center'
}

export function SortableTableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  align = 'left',
}: SortableTableHeaderProps) {
  const isActive = sortField === field
  const ariaSort = isActive
    ? sortDirection === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={[
        'px-gutter py-4 text-label-sm font-semibold text-text-black',
        align === 'center' ? 'text-center' : 'text-left',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={[
          'inline-flex cursor-pointer items-center gap-1 text-text-black transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          align === 'center' ? 'mx-auto' : '',
        ].join(' ')}
      >
        {label}
        <MaterialIcon
          name={
            isActive
              ? sortDirection === 'asc'
                ? 'arrow_upward'
                : 'arrow_downward'
              : 'unfold_more'
          }
          size={16}
          className={isActive ? 'text-primary-action' : 'text-outline'}
        />
      </button>
    </th>
  )
}
