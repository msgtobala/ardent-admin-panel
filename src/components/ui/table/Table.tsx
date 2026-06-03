import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { TABLE_ROW_HEIGHT_CLASS } from '@/types/table'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div
      className={[
        'overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

interface TableScrollAreaProps {
  children: ReactNode
  isPageLoading?: boolean
  loadingOverlay?: ReactNode
}

export function TableScrollArea({
  children,
  isPageLoading = false,
  loadingOverlay,
}: TableScrollAreaProps) {
  return (
    <div className="relative overflow-hidden">
      {isPageLoading ? loadingOverlay : null}
      {children}
    </div>
  )
}

interface TableElementProps {
  children: ReactNode
  minWidth?: number
  columnWidths?: (string | undefined)[]
}

export function TableElement({
  children,
  minWidth,
  columnWidths,
}: TableElementProps) {
  return (
    <table
      className="w-full table-fixed border-collapse"
      style={minWidth ? { minWidth } : undefined}
    >
      {columnWidths ? (
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} className={width ? width : undefined} />
          ))}
        </colgroup>
      ) : null}
      {children}
    </table>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

interface TableHeaderRowProps {
  children: ReactNode
}

export function TableHeaderRow({ children }: TableHeaderRowProps) {
  return (
    <tr className="border-b border-border-subtle bg-surface-container-low">
      {children}
    </tr>
  )
}

interface TableHeadCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
  align?: 'left' | 'center'
}

export function TableHeadCell({
  children,
  align = 'left',
  className = '',
  ...props
}: TableHeadCellProps) {
  return (
    <th
      scope="col"
      className={[
        'px-gutter py-4 text-label-sm font-semibold text-text-black',
        align === 'center' ? 'text-center' : 'text-left',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </th>
  )
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
  isPageLoading?: boolean
}

export function TableBody({
  children,
  isPageLoading = false,
  className = '',
  ...props
}: TableBodyProps) {
  return (
    <tbody
      aria-busy={isPageLoading}
      className={[
        isPageLoading
          ? 'pointer-events-none opacity-50 transition-opacity duration-200'
          : 'transition-opacity duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </tbody>
  )
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
  isPlaceholder?: boolean
}

export function TableRow({
  children,
  isPlaceholder = false,
  className = '',
  ...props
}: TableRowProps) {
  return (
    <tr
      className={[
        TABLE_ROW_HEIGHT_CLASS,
        isPlaceholder
          ? 'border-b border-transparent'
          : 'border-b border-border-subtle last:border-b-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </tr>
  )
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export function TableCell({ children, className = '', ...props }: TableCellProps) {
  return (
    <td
      className={['px-gutter py-4 align-middle', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </td>
  )
}

interface TableFooterMessageProps {
  children: ReactNode
}

export function TableFooterMessage({ children }: TableFooterMessageProps) {
  return (
    <p
      className="border-t border-border-subtle px-gutter py-2 text-label-sm text-error-red"
      role="alert"
    >
      {children}
    </p>
  )
}
