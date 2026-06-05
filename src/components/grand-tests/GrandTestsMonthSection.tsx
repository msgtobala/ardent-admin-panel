import { useEffect, useState } from 'react'
import { GRAND_TESTS_CARDS_PAGE_SIZE } from '@/lib/grand-tests'
import type { GrandTest, GrandTestMonthGroup } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TablePagination } from '@/components/ui/table/TablePagination'
import { GrandTestCard } from './GrandTestCard'

interface GrandTestsMonthSectionProps {
  group: GrandTestMonthGroup
  emptyMessage: string
  showEdit?: boolean
  onEdit?: (test: GrandTest) => void
}

function GrandTestCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-[220px] flex-col rounded-xl border border-border-subtle bg-surface-white"
    >
      <div className="border-b border-border-subtle px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-surface-container" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-container" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
      </div>
    </div>
  )
}

export function GrandTestsMonthSection({
  group,
  emptyMessage,
  showEdit = false,
  onEdit,
}: GrandTestsMonthSectionProps) {
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    setPageIndex(0)
  }, [group.monthKey])

  const totalPages = Math.max(
    1,
    Math.ceil(group.tests.length / GRAND_TESTS_CARDS_PAGE_SIZE),
  )
  const currentPage = pageIndex + 1
  const pageStart = pageIndex * GRAND_TESTS_CARDS_PAGE_SIZE
  const pageTests = group.tests.slice(
    pageStart,
    pageStart + GRAND_TESTS_CARDS_PAGE_SIZE,
  )
  const hasPrevious = pageIndex > 0
  const hasNext = pageIndex < totalPages - 1

  function handlePrevious() {
    setPageIndex((previous) => Math.max(0, previous - 1))
  }

  function handleNext() {
    setPageIndex((previous) => Math.min(totalPages - 1, previous + 1))
  }

  return (
    <section
      aria-labelledby={`grand-tests-month-${group.monthKey}`}
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
    >
      <div className="flex items-start gap-4 border-b border-border-subtle px-gutter py-5">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed"
        >
          <MaterialIcon name="calendar_month" size={20} className="text-primary" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id={`grand-tests-month-${group.monthKey}`}
            className="text-card-title text-on-surface"
          >
            {group.label}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {group.tests.length}{' '}
            {group.tests.length === 1 ? 'test' : 'tests'} — latest shown first
          </p>
        </div>
      </div>

      {group.tests.length === 0 ? (
        <p className="px-gutter py-gutter text-body-md text-on-surface-variant">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="grid gap-4 px-gutter py-gutter sm:grid-cols-2 xl:grid-cols-3">
            {pageTests.map((test) => (
              <GrandTestCard
                key={test.id}
                test={test}
                showEdit={showEdit}
                onEdit={onEdit}
              />
            ))}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={false}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </>
      )}
    </section>
  )
}

export function GrandTestsMonthSectionSkeleton() {
  return (
    <section
      aria-hidden
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1"
    >
      <div className="flex items-start gap-4 border-b border-border-subtle px-gutter py-5">
        <div className="size-11 animate-pulse rounded-full bg-surface-container" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
          <div className="h-4 w-56 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
      <div className="grid gap-4 px-gutter py-gutter sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: GRAND_TESTS_CARDS_PAGE_SIZE }).map((_, index) => (
          <GrandTestCardSkeleton key={`month-skeleton-${index}`} />
        ))}
      </div>
    </section>
  )
}
