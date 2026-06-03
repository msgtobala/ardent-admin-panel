interface TablePaginationProps {
  currentPage: number
  totalPages: number
  isLoading: boolean
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onPrevious: () => void
}

const paginationButtonClassName =
  'cursor-pointer rounded-lg border border-border-subtle px-[17px] py-[9px] text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50'

export function TablePagination({
  currentPage,
  totalPages,
  isLoading,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border-subtle bg-surface-container-low px-gutter py-4">
      <p className="min-w-[120px] text-body-md text-on-surface-variant">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          className={paginationButtonClassName}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          className={paginationButtonClassName}
        >
          Next
        </button>
      </div>
    </div>
  )
}
