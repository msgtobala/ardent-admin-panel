import { useState } from 'react'
import { ACTIVE_BANNER_DELETE_MESSAGE, BANNERS_PAGE_SIZE } from '@/lib/banners'
import { formatBannerDate } from '@/lib/format-date'
import type { Banner, BannerSortField, SortDirection } from '@/types/banner'
import {
  DataTable,
  SortableTableHeader,
  TableCell,
  TableErrorState,
  TableHeaderRow,
  TableHeadCell,
  TableRow,
} from '@/components/ui/table'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { CopyIdButton } from '@/components/ui/CopyIdButton'
import { ActiveToggle } from './ActiveToggle'
import { BannerImageModal } from './BannerImageModal'
import { BannerImagePreview } from './BannerImagePreview'
import { StatusBadge } from './StatusBadge'

interface BannersTableProps {
  banners: Banner[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  isInitialLoading: boolean
  isPageLoading: boolean
  error?: string
  hasNext: boolean
  hasPrevious: boolean
  sortField: BannerSortField
  sortDirection: SortDirection
  onSort: (field: BannerSortField) => void
  onNext: () => void
  onPrevious: () => void
  onRetry: () => void
  onToggleIsActive: (id: string, isActive: boolean) => void
  onEdit: (banner: Banner) => void
  onDelete: (banner: Banner) => void
}

const actionButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

const BANNER_COLUMN_WIDTHS = [
  'w-[140px]',
  undefined,
  'w-[120px]',
  'w-[160px]',
  'w-[220px]',
]

function BannersTableSkeletonRows() {
  return Array.from({ length: BANNERS_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} aria-hidden>
      <TableCell>
        <div className="h-14 w-24 animate-pulse rounded-input bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full max-w-[240px] animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
      </TableCell>
      <TableCell>
        <div className="mx-auto h-8 w-28 animate-pulse rounded-lg bg-surface-container" />
      </TableCell>
    </TableRow>
  ))
}

function BannerRow({
  banner,
  onView,
  onEdit,
  onDelete,
  onToggleIsActive,
}: {
  banner: Banner
  onView: (banner: Banner) => void
  onEdit: (banner: Banner) => void
  onDelete: (banner: Banner) => void
  onToggleIsActive: (id: string, isActive: boolean) => void
}) {
  return (
    <TableRow>
      <TableCell>
        <BannerImagePreview
          imageUrl={banner.imageUrl}
          altText={banner.link || 'Banner preview'}
          onClick={
            banner.imageUrl ? () => onView(banner) : undefined
          }
        />
      </TableCell>
      <TableCell>
        {banner.link ? (
          <a
            href={banner.link}
            target="_blank"
            rel="noopener noreferrer"
            title={banner.link}
            className="block truncate text-body-md text-primary transition hover:text-primary-action hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {banner.link}
          </a>
        ) : (
          <span className="text-body-md text-text-black">—</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge isActive={banner.isActive} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-body-md text-text-black">
        {formatBannerDate(banner.createdAt)}
      </TableCell>
      <TableCell className="px-3">
        <div className="flex items-center justify-center gap-1.5">
          <CopyIdButton
            value={banner.id}
            ariaLabel={`Copy banner id ${banner.id}`}
          />
          <button
            type="button"
            aria-label={`Edit banner ${banner.id}`}
            onClick={() => onEdit(banner)}
            className={actionButtonClassName}
          >
            <MaterialIcon
              name="edit"
              size={16}
              className="text-on-surface-variant"
            />
          </button>
          <button
            type="button"
            aria-label={
              banner.isActive
                ? `Cannot delete active banner ${banner.id}`
                : `Delete banner ${banner.id}`
            }
            title={banner.isActive ? ACTIVE_BANNER_DELETE_MESSAGE : undefined}
            onClick={() => onDelete(banner)}
            disabled={banner.isActive}
            className={`${actionButtonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <MaterialIcon
              name="delete"
              size={16}
              className={
                banner.isActive
                  ? 'text-on-surface-variant'
                  : 'text-primary-action'
              }
            />
          </button>
          <ActiveToggle
            isActive={banner.isActive}
            ariaLabel={`Toggle status for banner ${banner.id}`}
            onChange={(isActive) => onToggleIsActive(banner.id, isActive)}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

export function BannersTable({
  banners,
  currentPage,
  totalPages,
  isLoading,
  isInitialLoading,
  isPageLoading,
  error,
  hasNext,
  hasPrevious,
  sortField,
  sortDirection,
  onSort,
  onNext,
  onPrevious,
  onRetry,
  onToggleIsActive,
  onEdit,
  onDelete,
}: BannersTableProps) {
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null)

  function handleViewBanner(banner: Banner) {
    setPreviewBanner(banner)
  }

  function handleClosePreview() {
    setPreviewBanner(null)
  }

  if (error) {
    return <TableErrorState message={error} onRetry={onRetry} />
  }

  return (
    <>
      <DataTable
        columnCount={5}
        columnWidths={BANNER_COLUMN_WIDTHS}
        rowCount={banners.length}
        pageSize={BANNERS_PAGE_SIZE}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNext={onNext}
        onPrevious={onPrevious}
        emptyMessage="No banners yet. Create your first banner with the New Banner button."
        skeletonRows={<BannersTableSkeletonRows />}
        header={
          <TableHeaderRow>
            <TableHeadCell>Image Preview</TableHeadCell>
            <SortableTableHeader
              label="URL"
              field="link"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              label="Status"
              field="isActive"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableTableHeader
              label="Created Date"
              field="createdAt"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <TableHeadCell align="center" className="px-3">
              Actions
            </TableHeadCell>
          </TableHeaderRow>
        }
      >
        {banners.map((banner) => (
          <BannerRow
            key={banner.id}
            banner={banner}
            onView={handleViewBanner}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleIsActive={onToggleIsActive}
          />
        ))}
      </DataTable>

      <BannerImageModal
        isOpen={previewBanner !== null}
        imageUrl={previewBanner?.imageUrl ?? ''}
        title={previewBanner?.link || 'Banner preview'}
        onClose={handleClosePreview}
      />
    </>
  )
}
