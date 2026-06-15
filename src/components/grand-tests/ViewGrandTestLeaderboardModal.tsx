import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatDisplayDate } from '@/lib/format-display-date'
import { exportGrandTestLeaderboardExcel } from '@/lib/export-grand-test-leaderboard'
import {
  fetchGrandTestLeaderboard,
  formatDurationSeconds,
  sortGrandTestLeaderboardEntries,
} from '@/lib/grand-test-leaderboard'
import type { GrandTest, GrandTestLeaderboardEntry } from '@/types/grand-test'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import {
  Table,
  TableBody,
  TableCell,
  TableElement,
  TableEmptyRow,
  TableErrorState,
  TableHeadCell,
  TableHeader,
  TableHeaderRow,
  TablePagination,
  TablePlaceholderRows,
  TableRow,
  TableScrollArea,
} from '@/components/ui/table'

const LEADERBOARD_PAGE_SIZE = 10

const COLUMN_WIDTHS = [
  'w-[72px]',
  undefined,
  'w-[88px]',
  'w-[72px]',
  'w-[80px]',
  'w-[72px]',
  'w-[88px]',
  'w-[160px]',
]

interface ViewGrandTestLeaderboardModalProps {
  isOpen: boolean
  test: GrandTest | null
  onClose: () => void
}

function LeaderboardPublishedBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium',
        isPublished
          ? 'bg-success-bg text-success-green'
          : 'bg-surface-container text-on-surface-variant',
      ].join(' ')}
    >
      {isPublished ? 'Published' : 'Not published'}
    </span>
  )
}

function LeaderboardStudentCell({ entry }: { entry: GrandTestLeaderboardEntry }) {
  const displayName = entry.name.trim() || entry.userId

  return (
    <div className="flex min-w-0 items-center gap-2">
      {entry.profileImageUrl ? (
        <img
          src={entry.profileImageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full border border-border-subtle object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-semibold text-primary"
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate font-medium text-text-black">{displayName}</span>
    </div>
  )
}

function LeaderboardTableSkeletonRows() {
  return Array.from({ length: LEADERBOARD_PAGE_SIZE }).map((_, index) => (
    <TableRow key={`leaderboard-skeleton-${index}`} aria-hidden>
      {Array.from({ length: 8 }).map((__, cellIndex) => (
        <TableCell key={`leaderboard-skeleton-cell-${cellIndex}`}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-container" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

function LeaderboardEntryRow({ entry }: { entry: GrandTestLeaderboardEntry }) {
  return (
    <TableRow>
      <TableCell className="font-semibold text-text-black">{entry.rank}</TableCell>
      <TableCell>
        <LeaderboardStudentCell entry={entry} />
      </TableCell>
      <TableCell className="text-body-md text-text-black">{entry.score}</TableCell>
      <TableCell className="text-body-md text-text-black">{entry.correctCount}</TableCell>
      <TableCell className="text-body-md text-text-black">{entry.incorrectCount}</TableCell>
      <TableCell className="text-body-md text-text-black">{entry.skippedCount}</TableCell>
      <TableCell className="text-body-md text-text-black">
        {formatDurationSeconds(entry.timeTakenSecs)}
      </TableCell>
      <TableCell className="text-body-md text-text-black">
        {entry.submittedAt.getTime() > 0 ? formatDisplayDate(entry.submittedAt) : '—'}
      </TableCell>
    </TableRow>
  )
}

export function ViewGrandTestLeaderboardModal({
  isOpen,
  test,
  onClose,
}: ViewGrandTestLeaderboardModalProps) {
  const [entries, setEntries] = useState<GrandTestLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [pageIndex, setPageIndex] = useState(0)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const loadLeaderboard = useCallback(async (testId: string) => {
    setIsLoading(true)
    setError(undefined)

    try {
      const loadedEntries = await fetchGrandTestLeaderboard(testId)
      setEntries(loadedEntries)
    } catch {
      setError('Failed to load leaderboard. Please try again.')
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !test) return

    setPageIndex(0)
    void loadLeaderboard(test.id)
  }, [isOpen, test, loadLeaderboard])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  const sortedEntries = useMemo(() => {
    if (!test?.isLeaderboardPublished) return []
    return sortGrandTestLeaderboardEntries(entries)
  }, [entries, test?.isLeaderboardPublished])

  const totalPages = Math.max(
    1,
    Math.ceil(sortedEntries.length / LEADERBOARD_PAGE_SIZE),
  )
  const currentPage = pageIndex + 1
  const pageStart = pageIndex * LEADERBOARD_PAGE_SIZE
  const pageEntries = sortedEntries.slice(
    pageStart,
    pageStart + LEADERBOARD_PAGE_SIZE,
  )
  const hasPrevious = pageIndex > 0
  const hasNext = pageIndex < totalPages - 1
  const showingFrom = sortedEntries.length === 0 ? 0 : pageStart + 1
  const showingTo = pageStart + pageEntries.length
  const participantCountMismatch =
    test?.isLeaderboardPublished &&
    !isLoading &&
    sortedEntries.length !== test.totalParticipants

  useEffect(() => {
    setPageIndex(0)
  }, [test?.id, sortedEntries.length])

  if (!isOpen || !test) return null

  const testLabel = test.title.trim() || test.id
  const testId = test.id
  const showPendingMessage = !test.isLeaderboardPublished
  const showEmptyMessage = test.isLeaderboardPublished && sortedEntries.length === 0
  const showTable =
    test.isLeaderboardPublished && !error && !showEmptyMessage && !isLoading
  const showPagination = showTable || (test.isLeaderboardPublished && isLoading)
  const canExportExcel =
    test.isLeaderboardPublished && !isLoading && !error && sortedEntries.length > 0

  const placeholderRowCount =
    !isLoading && pageEntries.length > 0
      ? LEADERBOARD_PAGE_SIZE - pageEntries.length
      : 0

  function handlePrevious() {
    setPageIndex((previous) => Math.max(0, previous - 1))
  }

  function handleNext() {
    setPageIndex((previous) => Math.min(totalPages - 1, previous + 1))
  }

  function handleRetry() {
    void loadLeaderboard(testId)
  }

  function handleExportExcel() {
    if (!canExportExcel || !test) return
    exportGrandTestLeaderboardExcel(test, sortedEntries)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close leaderboard dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-grand-test-leaderboard-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex min-w-0 flex-col gap-2 pr-4">
            <h2
              id="view-grand-test-leaderboard-modal-title"
              className="text-h3 text-on-surface"
            >
              Leaderboard
            </h2>
            <p className="text-body-md text-on-surface-variant">{testLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <LeaderboardPublishedBadge isPublished={test.isLeaderboardPublished} />
              <span className="text-label-sm text-on-surface-variant">
                {sortedEntries.length}{' '}
                {sortedEntries.length === 1 ? 'participant' : 'participants'}
                {participantCountMismatch
                  ? ` (test document reports ${test.totalParticipants})`
                  : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-gutter py-gutter">
          {error ? (
            <TableErrorState message={error} onRetry={handleRetry} />
          ) : showPendingMessage ? (
            <div className="rounded-xl border border-border-subtle bg-surface-container-low px-gutter py-gutter">
              <p className="text-body-md text-on-surface-variant">
                Leaderboard not published yet.
                {test.totalParticipants > 0
                  ? ` ${test.totalParticipants} participant${test.totalParticipants === 1 ? '' : 's'} submitted so far.`
                  : ''}
              </p>
            </div>
          ) : showEmptyMessage ? (
            <div className="rounded-xl border border-border-subtle bg-surface-container-low px-gutter py-gutter">
              <p className="text-body-md text-on-surface-variant">No participants.</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <Table className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-auto">
                  <TableScrollArea>
                    <TableElement minWidth={960} columnWidths={COLUMN_WIDTHS}>
                      <TableHeader>
                        <TableHeaderRow>
                          <TableHeadCell>Rank</TableHeadCell>
                          <TableHeadCell>Student</TableHeadCell>
                          <TableHeadCell>Score</TableHeadCell>
                          <TableHeadCell>Correct</TableHeadCell>
                          <TableHeadCell>Incorrect</TableHeadCell>
                          <TableHeadCell>Skipped</TableHeadCell>
                          <TableHeadCell>Time</TableHeadCell>
                          <TableHeadCell>Submitted</TableHeadCell>
                        </TableHeaderRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <LeaderboardTableSkeletonRows />
                        ) : pageEntries.length === 0 ? (
                          <TableEmptyRow columnCount={8}>No participants.</TableEmptyRow>
                        ) : (
                          <>
                            {pageEntries.map((entry) => (
                              <LeaderboardEntryRow key={entry.userId} entry={entry} />
                            ))}
                            <TablePlaceholderRows
                              count={placeholderRowCount}
                              columnCount={8}
                            />
                          </>
                        )}
                      </TableBody>
                    </TableElement>
                  </TableScrollArea>
                </div>
              </Table>
            </div>
          )}
        </div>

        {showPagination ? (
          <div className="border-t border-border-subtle bg-surface-container-low">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-gutter py-2">
              <p className="text-label-sm text-on-surface-variant">
                {isLoading
                  ? 'Loading participants...'
                  : `Showing ${showingFrom}–${showingTo} of ${sortedEntries.length}`}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!canExportExcel}
                title={canExportExcel ? 'Export full leaderboard to Excel' : 'No data to export'}
                onClick={handleExportExcel}
                className="gap-2"
              >
                <MaterialIcon name="download" size={18} />
                Export Excel
              </Button>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoading}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>
        ) : null}

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
