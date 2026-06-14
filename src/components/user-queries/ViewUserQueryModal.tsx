import { useCallback, useEffect } from 'react'
import {
  formatUserQueryContextSummary,
  formatUserQueryType,
  getUserQueryContextDetails,
  getUserQueryQuestionRefs,
  getUserQueryVideoRefs,
} from '@/lib/user-query-display'
import { formatBannerDate } from '@/lib/format-date'
import type { UserQueryStatusAction } from '@/hooks/useUserQueriesPage'
import type { UserQuery } from '@/types/user-query'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { UserQueryLinkedQuestionSection } from '@/components/user-queries/UserQueryLinkedQuestionSection'
import { UserQueryLinkedVideoSection } from '@/components/user-queries/UserQueryLinkedVideoSection'
import { UserQueryStatusBadge } from '@/components/user-queries/UserQueryStatusBadge'

interface ViewUserQueryModalProps {
  isOpen: boolean
  query: UserQuery | null
  isUpdatingStatus: boolean
  pendingStatusAction: UserQueryStatusAction | null
  onClose: () => void
  onResolve: (id: string) => Promise<void>
  onReject: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-on-surface-variant">
        {label}
      </span>
      <span className="whitespace-pre-wrap break-words text-body-md text-on-surface">
        {value}
      </span>
    </div>
  )
}

export function ViewUserQueryModal({
  isOpen,
  query,
  isUpdatingStatus,
  pendingStatusAction,
  onClose,
  onResolve,
  onReject,
  onReopen,
}: ViewUserQueryModalProps) {
  const handleClose = useCallback(() => {
    if (isUpdatingStatus) return
    onClose()
  }, [isUpdatingStatus, onClose])

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

  if (!isOpen || !query) return null

  const contextDetails = getUserQueryContextDetails(query)
  const questionRefs = getUserQueryQuestionRefs(query)
  const videoRefs = getUserQueryVideoRefs(query)
  const isOpened = query.status === 'opened'
  const isResolved = query.status === 'resolved'
  const queryId = query.id
  const isResolving = isUpdatingStatus && pendingStatusAction === 'resolve'
  const isRejecting = isUpdatingStatus && pendingStatusAction === 'reject'
  const isReopening = isUpdatingStatus && pendingStatusAction === 'reopen'

  async function handleResolve() {
    if (!isOpened || isUpdatingStatus) return
    await onResolve(queryId)
  }

  async function handleReject() {
    if (!isOpened || isUpdatingStatus) return
    await onReject(queryId)
  }

  async function handleReopen() {
    if (!isResolved || isUpdatingStatus) return
    await onReopen(queryId)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close ticket details"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-query-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex min-w-0 flex-col gap-2 pr-4">
            <h2 id="user-query-modal-title" className="text-h3 text-on-surface">
              Ticket details
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {formatUserQueryType(query.type)}
            </p>
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

        <div className="flex flex-col gap-5 overflow-y-auto px-gutter py-gutter">
          <div className="flex flex-wrap items-center gap-3">
            <UserQueryStatusBadge status={query.status} />
            <span className="text-body-sm text-on-surface-variant">
              Raised on {formatBannerDate(query.createdAt)}
            </span>
            {query.updatedAt ? (
              <span className="text-body-sm text-on-surface-variant">
                Updated on {formatBannerDate(query.updatedAt)}
              </span>
            ) : null}
          </div>

          <DetailField label="Ticket ID" value={query.id} />
          <DetailField label="User ID" value={query.userId} />
          <DetailField label="Type" value={formatUserQueryType(query.type)} />
          <DetailField
            label="Subject / context"
            value={formatUserQueryContextSummary(query)}
          />
          <DetailField label="Description" value={query.description || '—'} />

          {contextDetails.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface px-4 py-4">
              <h3 className="text-label-sm font-medium text-on-surface-variant">
                Context details
              </h3>
              {contextDetails.map((detail) => (
                <DetailField
                  key={detail.label}
                  label={detail.label}
                  value={detail.value}
                />
              ))}
            </div>
          ) : null}

          {questionRefs ? (
            <UserQueryLinkedQuestionSection refs={questionRefs} />
          ) : null}

          {videoRefs ? (
            <UserQueryLinkedVideoSection
              refs={videoRefs}
              fallbackLabel={query.context?.module?.name?.trim() || videoRefs.lessonRefId}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
          {isResolved ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleReopen}
              disabled={isUpdatingStatus}
              className="gap-2"
            >
              <MaterialIcon name="undo" size={16} />
              {isReopening ? 'Reopening…' : 'Reopen ticket'}
            </Button>
          ) : null}
          {isOpened ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={isUpdatingStatus}
                className="gap-2"
              >
                <MaterialIcon name="block" size={16} />
                {isRejecting ? 'Rejecting…' : 'Reject ticket'}
              </Button>
              <Button
                type="button"
                onClick={handleResolve}
                disabled={isUpdatingStatus}
                className="gap-2"
              >
                <MaterialIcon name="check_circle" size={16} />
                {isResolving ? 'Resolving…' : 'Mark as resolved'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
