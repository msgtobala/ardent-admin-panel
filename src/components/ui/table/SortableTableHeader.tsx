import type { SortDirection } from '@/types/table'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TableHeadCell } from './Table'

interface SortableTableHeaderProps<TField extends string> {
  label: string
  field: TField
  sortField: TField
  sortDirection: SortDirection
  onSort: (field: TField) => void
  align?: 'left' | 'center'
}

export function SortableTableHeader<TField extends string>({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  align = 'left',
}: SortableTableHeaderProps<TField>) {
  const isActive = sortField === field
  const ariaSort = isActive
    ? sortDirection === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  return (
    <TableHeadCell align={align} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={[
          'inline-flex cursor-pointer items-center gap-1 text-text-black transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          align === 'center' ? 'mx-auto' : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
    </TableHeadCell>
  )
}
