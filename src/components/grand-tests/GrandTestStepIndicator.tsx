import { GRAND_TEST_FORM_STEPS, type GrandTestFormStep } from '@/types/grand-test'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface GrandTestStepIndicatorProps {
  currentStep: GrandTestFormStep
}

export function GrandTestStepIndicator({ currentStep }: GrandTestStepIndicatorProps) {
  return (
    <nav aria-label="Add grand test progress" className="border-b border-border-subtle px-gutter py-4">
      <ol className="flex items-center gap-2">
        {GRAND_TEST_FORM_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isLast = index === GRAND_TEST_FORM_STEPS.length - 1

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-label-sm font-semibold',
                    isCompleted
                      ? 'bg-success-bg text-success-green'
                      : isCurrent
                        ? 'bg-primary-action text-on-primary'
                        : 'bg-surface-container text-on-surface-variant',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <MaterialIcon name="check" size={16} aria-hidden />
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={[
                    'truncate text-label-sm font-medium',
                    isCurrent ? 'text-on-surface' : 'text-on-surface-variant',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {!isLast ? (
                <div
                  aria-hidden
                  className={[
                    'h-px flex-1',
                    isCompleted ? 'bg-success-green' : 'bg-border-subtle',
                  ].join(' ')}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
