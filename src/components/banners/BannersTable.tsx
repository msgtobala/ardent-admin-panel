import { useState } from 'react'
import { formatBannerDate } from '../../lib/format-date'
import type { Banner, BannerSortField, SortDirection } from '../../types/banner'
import { MaterialIcon } from '../ui/MaterialIcon'
import { ActiveToggle } from './ActiveToggle'
import { BannerImageModal } from './BannerImageModal'
import { BannerImagePreview } from './BannerImagePreview'
import { SortableTableHeader } from './SortableTableHeader'
import { StatusBadge } from './StatusBadge'

interface BannersTableProps {
  banners: Banner[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  error?: string
  toggleError?: string
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
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center border-b border-border-subtle px-gutter py-4"
        >
          <div className="h-14 w-24 rounded-input bg-surface-container" />
          <div className="ml-gutter h-4 flex-1 max-w-[200px] rounded bg-surface-container" />
        </div>
      ))}
    </div>
  )
}

export function BannersTable({
  banners,
  currentPage,
  totalPages,
  isLoading,
  error,
  toggleError,
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
}: BannersTableProps) {
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null)

  function handleViewBanner(banner: Banner) {
    setPreviewBanner(banner)
  }

  function handleClosePreview() {
    setPreviewBanner(null)
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-white p-gutter shadow-tier-1">
        <p className="mb-4 text-body-md text-error-red" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-input border border-border-subtle px-[17px] py-[9px] text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low">
                <th
                  scope="col"
                  className="px-gutter py-4 text-left text-label-sm font-semibold text-text-black"
                >
                  Image Preview
                </th>
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
                <th
                  scope="col"
                  className="px-gutter py-4 text-center text-label-sm font-semibold text-text-black"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton />
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-gutter py-12 text-center text-body-md text-on-surface-variant"
                  >
                    No banners yet. Create your first banner with the New Banner
                    button.
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr
                    key={banner.id}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className="px-gutter py-4">
                      <BannerImagePreview
                        imageUrl={banner.imageUrl}
                        altText={banner.link || 'Banner preview'}
                      />
                    </td>
                    <td className="max-w-[280px] px-gutter py-4">
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
                        <span className="text-body-md text-text-black">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-gutter py-4">
                      <StatusBadge isActive={banner.isActive} />
                    </td>
                    <td className="px-gutter py-4 text-body-md text-text-black">
                      {formatBannerDate(banner.createdAt)}
                    </td>
                    <td className="px-gutter py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          aria-label={`View banner image for ${banner.id}`}
                          onClick={() => handleViewBanner(banner)}
                          className="cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <MaterialIcon
                            name="visibility"
                            size={16}
                            className="text-on-surface-variant"
                          />
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit banner ${banner.id}`}
                          onClick={() => onEdit(banner)}
                          className="cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          <MaterialIcon
                            name="edit"
                            size={16}
                            className="text-on-surface-variant"
                          />
                        </button>
                        <ActiveToggle
                          isActive={banner.isActive}
                          ariaLabel={`Toggle status for banner ${banner.id}`}
                          onChange={(isActive) =>
                            onToggleIsActive(banner.id, isActive)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {toggleError ? (
          <p
            className="border-t border-border-subtle px-gutter py-2 text-label-sm text-error-red"
            role="alert"
          >
            {toggleError}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <p className="text-body-md text-on-surface-variant">
            {isLoading
              ? 'Loading banners...'
              : `Page ${currentPage} of ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious || isLoading}
              className="cursor-pointer rounded-lg border border-border-subtle px-[17px] py-[9px] text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext || isLoading}
              className="cursor-pointer rounded-lg border border-border-subtle px-[17px] py-[9px] text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <BannerImageModal
        isOpen={previewBanner !== null}
        imageUrl={previewBanner?.imageUrl ?? ''}
        title={previewBanner?.link || 'Banner preview'}
        onClose={handleClosePreview}
      />
    </>
  )
}
