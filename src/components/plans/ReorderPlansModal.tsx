import { useCallback, useEffect, useState } from 'react'
import type { PlanSectionConfig } from '@/config/plan-sections'
import { buildDisplayOrderUpdates, movePlanInList } from '@/lib/plan-reorder'
import { fetchPlansByType, updatePlansDisplayOrder } from '@/lib/plans'
import { isFreePlan } from '@/lib/plan-utils'
import type { Plan } from '@/types/plan'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface ReorderPlansModalProps {
  isOpen: boolean
  section: PlanSectionConfig | null
  onClose: () => void
  onSaved: () => void
}

const reorderButtonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40'

export function ReorderPlansModal({
  isOpen,
  section,
  onClose,
  onSaved,
}: ReorderPlansModalProps) {
  const [orderedPlans, setOrderedPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [hasChanges, setHasChanges] = useState(false)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen || !section) return

    let isCancelled = false

    async function loadPlans() {
      if (!section) return

      setIsLoading(true)
      setLoadError(undefined)
      setFormError(undefined)
      setHasChanges(false)

      try {
        const plans = await fetchPlansByType(section.planType)
        if (!isCancelled) setOrderedPlans(plans)
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load plans for reordering. Please try again.')
          setOrderedPlans([])
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadPlans()

    return () => {
      isCancelled = true
    }
  }, [isOpen, section])

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

  function handleMovePlan(index: number, direction: 'up' | 'down') {
    setOrderedPlans((prev) => movePlanInList(prev, index, direction))
    setHasChanges(true)
    setFormError(undefined)
  }

  async function handleSave() {
    if (!section || !hasChanges) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      await updatePlansDisplayOrder(buildDisplayOrderUpdates(orderedPlans))
      onSaved()
      onClose()
    } catch {
      setFormError('Failed to save plan order. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !section) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close reorder plans dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-plans-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="reorder-plans-modal-title" className="text-h3 text-on-surface">
              Edit Sort Order
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Reorder {section.title.toLowerCase()} using the arrows. Changes apply to
              the app display order.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-gutter py-gutter">
          {isLoading ? (
            <p className="text-body-md text-on-surface-variant">Loading plans...</p>
          ) : loadError ? (
            <p className="text-body-md text-error-red" role="alert">
              {loadError}
            </p>
          ) : orderedPlans.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              No plans available to reorder in this section.
            </p>
          ) : (
            orderedPlans.map((plan, index) => {
              const isFree = isFreePlan(plan)
              const canMoveUp = !isFree && index > 0 && !isFreePlan(orderedPlans[index - 1])
              const canMoveDown =
                !isFree &&
                index < orderedPlans.length - 1 &&
                !isFreePlan(orderedPlans[index + 1])

              return (
                <div
                  key={plan.id}
                  className={[
                    'flex items-center gap-3 rounded-xl border border-border-subtle px-4 py-3',
                    isFree ? 'bg-surface-container-low opacity-60' : 'bg-surface-white',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${plan.planName} up`}
                      disabled={!canMoveUp || isSubmitting}
                      onClick={() => handleMovePlan(index, 'up')}
                      className={reorderButtonClassName}
                    >
                      <MaterialIcon
                        name="arrow_upward"
                        size={16}
                        className="text-on-surface-variant"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${plan.planName} down`}
                      disabled={!canMoveDown || isSubmitting}
                      onClick={() => handleMovePlan(index, 'down')}
                      className={reorderButtonClassName}
                    >
                      <MaterialIcon
                        name="arrow_downward"
                        size={16}
                        className="text-on-surface-variant"
                      />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        'truncate text-body-md font-medium',
                        isFree ? 'text-on-surface-variant' : 'text-text-black',
                      ].join(' ')}
                    >
                      {plan.planName || '—'}
                    </p>
                    {isFree ? (
                      <p className="text-label-sm text-on-surface-variant">
                        Free plan order is fixed
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-label-sm font-semibold text-on-surface-variant">
                    #{index + 1}
                  </span>
                </div>
              )
            })
          )}

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || isLoading || !hasChanges || !!loadError}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
