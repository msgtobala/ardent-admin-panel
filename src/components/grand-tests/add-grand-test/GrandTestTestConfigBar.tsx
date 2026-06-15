import { TextField } from '@/components/ui/TextField'

interface GrandTestTestConfigBarProps {
  duration: string
  questions: string
  selectedCount: number
  disabled?: boolean
  durationError?: string
  questionsError?: string
  onDurationChange: (value: string) => void
  onQuestionsChange: (value: string) => void
}

function resolveProgressState(selectedCount: number, targetCount: number) {
  if (targetCount <= 0) {
    return { percent: 0, status: 'neutral' as const, label: 'Set a target count' }
  }

  const percent = Math.min(100, Math.round((selectedCount / targetCount) * 100))

  if (selectedCount === targetCount) {
    return { percent: 100, status: 'complete' as const, label: 'Target reached' }
  }

  if (selectedCount > targetCount) {
    return {
      percent: 100,
      status: 'over' as const,
      label: `${selectedCount - targetCount} over target`,
    }
  }

  return {
    percent,
    status: 'under' as const,
    label: `${targetCount - selectedCount} remaining`,
  }
}

const statusChipClasses = {
  complete: 'bg-success-bg text-success-green',
  over: 'bg-warning-bg text-tertiary',
  under: 'bg-surface-container text-on-surface-variant',
  neutral: 'bg-surface-container text-on-surface-variant',
} as const

export function GrandTestTestConfigBar({
  duration,
  questions,
  selectedCount,
  disabled = false,
  durationError,
  questionsError,
  onDurationChange,
  onQuestionsChange,
}: GrandTestTestConfigBarProps) {
  const parsedTarget = Number(questions)
  const targetCount = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : 0
  const progress = resolveProgressState(selectedCount, targetCount)

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-container-low p-4">
      <div className="flex flex-col gap-4">
        <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(0,1.2fr)]">
          <TextField
            id="grand-test-duration"
            label="Duration (minutes)"
            type="number"
            min={1}
            required
            value={duration}
            disabled={disabled}
            error={durationError}
            placeholder="e.g. 120"
            onChange={(event) => onDurationChange(event.target.value)}
          />
          <TextField
            id="grand-test-questions"
            label="Number of Questions"
            type="number"
            min={1}
            required
            value={questions}
            disabled={disabled}
            error={questionsError}
            placeholder="e.g. 50"
            onChange={(event) => onQuestionsChange(event.target.value)}
          />
          <div className="flex flex-col justify-end gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-label-sm font-semibold text-on-surface">
                Selection progress
              </span>
              <span
                className={[
                  'inline-flex rounded-full px-2.5 py-0.5 text-caption font-medium',
                  statusChipClasses[progress.status],
                ].join(' ')}
              >
                {progress.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container"
                role="progressbar"
                aria-valuenow={selectedCount}
                aria-valuemin={0}
                aria-valuemax={targetCount > 0 ? targetCount : selectedCount || 1}
                aria-label="Question selection progress"
              >
                <div
                  className={[
                    'h-full rounded-full transition-all',
                    progress.status === 'complete'
                      ? 'bg-success-green'
                      : progress.status === 'over'
                        ? 'bg-tertiary'
                        : 'bg-primary-action',
                  ].join(' ')}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="shrink-0 text-label-sm font-semibold text-on-surface">
                {targetCount > 0 ? `${selectedCount} / ${targetCount}` : selectedCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
