import type { ReactNode } from 'react'
import { TableLoadingOverlay } from './TableLoadingOverlay'
import { TableEmptyRow, TablePlaceholderRows } from './TablePlaceholderRows'
import { TablePagination } from './TablePagination'
import {
  Table,
  TableBody,
  TableElement,
  TableFooterMessage,
  TableHeader,
  TableScrollArea,
} from './Table'

interface DataTableProps {
  columnCount: number
  columnWidths?: (string | undefined)[]
  minWidth?: number
  header: ReactNode
  children: ReactNode
  skeletonRows: ReactNode
  emptyMessage: string
  rowCount: number
  pageSize: number
  isInitialLoading: boolean
  isPageLoading: boolean
  isLoading: boolean
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  footerError?: string
}

export function DataTable({
  columnCount,
  columnWidths,
  minWidth,
  header,
  children,
  skeletonRows,
  emptyMessage,
  rowCount,
  pageSize,
  isInitialLoading,
  isPageLoading,
  isLoading,
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  footerError,
}: DataTableProps) {
  const placeholderRowCount =
    !isInitialLoading && !isPageLoading && rowCount > 0
      ? pageSize - rowCount
      : 0

  return (
    <Table>
      <TableScrollArea
        isPageLoading={isPageLoading}
        loadingOverlay={<TableLoadingOverlay />}
      >
        <TableElement minWidth={minWidth} columnWidths={columnWidths}>
          <TableHeader>{header}</TableHeader>
          <TableBody isPageLoading={isPageLoading}>
            {isInitialLoading ? (
              skeletonRows
            ) : rowCount === 0 ? (
              <TableEmptyRow columnCount={columnCount}>
                {emptyMessage}
              </TableEmptyRow>
            ) : (
              <>
                {children}
                <TablePlaceholderRows
                  count={placeholderRowCount}
                  columnCount={columnCount}
                />
              </>
            )}
          </TableBody>
        </TableElement>
      </TableScrollArea>

      {footerError ? <TableFooterMessage>{footerError}</TableFooterMessage> : null}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    </Table>
  )
}
