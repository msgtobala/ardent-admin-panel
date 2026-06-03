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
  disabled?: boolean
}

export function SortableTableHeader<TField extends string>({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  align = 'left',
  disabled = false,
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
        disabled={disabled}
        aria-disabled={disabled}
        title={disabled ? 'Clear search to change sort order' : undefined}
        className={[
          'inline-flex items-center gap-1 text-text-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80',
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
