import type { ReactNode } from 'react'
import { TABLE_ROW_HEIGHT_CLASS } from '@/types/table'

interface TablePlaceholderRowsProps {
  count: number
  columnCount: number
}

export function TablePlaceholderRows({
  count,
  columnCount,
}: TablePlaceholderRowsProps) {
  if (count <= 0) return null

  return Array.from({ length: count }).map((_, index) => (
    <tr
      key={`placeholder-${index}`}
      className={`${TABLE_ROW_HEIGHT_CLASS} border-b border-transparent`}
      aria-hidden
    >
      <td colSpan={columnCount} />
    </tr>
  ))
}

interface TableEmptyRowProps {
  columnCount: number
  children: ReactNode
}

export function TableEmptyRow({ columnCount, children }: TableEmptyRowProps) {
  return (
    <tr>
      <td
        colSpan={columnCount}
        className="px-gutter py-12 text-center text-body-md text-on-surface-variant"
      >
        {children}
      </td>
    </tr>
  )
}
