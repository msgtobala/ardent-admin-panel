import type { ModulePlanTimingMode } from '@/lib/plan-type-fields'
import { TextField } from '@/components/ui/TextField'

interface ModulePlanTimingSectionProps {
  timingMode: ModulePlanTimingMode
  durationMonths: string
  validUntilDate: string
  disabled?: boolean
  durationMonthsError?: string
  validUntilDateError?: string
  timingModeError?: string
  durationHelperText?: string
  validUntilHelperText?: string
  onTimingModeChange: (mode: ModulePlanTimingMode) => void
  onDurationMonthsChange: (value: string) => void
  onValidUntilDateChange: (value: string) => void
}

const modeButtonBaseClassName =
  'flex-1 cursor-pointer rounded-input border px-3 py-2 text-center text-body-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

function getModeButtonClassName(isSelected: boolean): string {
  return [
    modeButtonBaseClassName,
    isSelected
      ? 'border-primary-action bg-primary-action/10 font-medium text-on-surface'
      : 'border-border-subtle bg-surface-white text-on-surface-variant hover:bg-row-hover',
  ].join(' ')
}

export function ModulePlanTimingSection({
  timingMode,
  durationMonths,
  validUntilDate,
  disabled = false,
  durationMonthsError,
  validUntilDateError,
  timingModeError,
  durationHelperText,
  validUntilHelperText,
  onTimingModeChange,
  onDurationMonthsChange,
  onValidUntilDateChange,
}: ModulePlanTimingSectionProps) {
  function handleTimingModeChange(nextMode: ModulePlanTimingMode) {
    if (disabled || nextMode === timingMode) return
    onTimingModeChange(nextMode)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-label-sm text-on-surface">Validity type</legend>
      <div className="flex gap-2" role="radiogroup" aria-label="Module plan validity type">
        <button
          type="button"
          role="radio"
          aria-checked={timingMode === 'duration'}
          disabled={disabled}
          onClick={() => handleTimingModeChange('duration')}
          className={getModeButtonClassName(timingMode === 'duration')}
        >
          Duration in months
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={timingMode === 'valid_until'}
          disabled={disabled}
          onClick={() => handleTimingModeChange('valid_until')}
          className={getModeButtonClassName(timingMode === 'valid_until')}
        >
          Valid until date
        </button>
      </div>

      {timingMode === 'duration' ? (
        <div className="flex flex-col gap-1">
          <TextField
            id="plan-duration-months"
            label="Duration (months)"
            type="number"
            min={1}
            value={durationMonths}
            disabled={disabled}
            required
            error={durationMonthsError}
            onChange={(event) => onDurationMonthsChange(event.target.value)}
          />
          {durationHelperText ? (
            <p className="text-label-sm text-on-surface-variant">{durationHelperText}</p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <TextField
            id="plan-valid-until"
            label="Valid Until"
            type="date"
            value={validUntilDate}
            disabled={disabled}
            required
            error={validUntilDateError}
            onChange={(event) => onValidUntilDateChange(event.target.value)}
          />
          {validUntilHelperText ? (
            <p className="text-label-sm text-on-surface-variant">{validUntilHelperText}</p>
          ) : null}
        </div>
      )}

      {timingModeError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {timingModeError}
        </p>
      ) : null}
    </fieldset>
  )
}
