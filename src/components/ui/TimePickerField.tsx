import { SelectField } from '@/components/ui/SelectField'
import {
  formatTimeValue,
  getHourSelectOptions,
  getMinuteSelectOptions,
  getPeriodSelectOptions,
  parseTimeValue,
  type TimeParts,
} from '@/lib/format-time'

interface TimePickerFieldProps {
  id: string
  value: string
  disabled?: boolean
  defaultTime?: string
  onChange: (value: string) => void
}

const shellClasses =
  'flex h-[38px] w-full items-center overflow-hidden rounded-input border border-border-subtle bg-surface-white shadow-tier-1 focus-within:border-primary-action focus-within:ring-2 focus-within:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:opacity-70 disabled:shadow-none'

export function TimePickerField({
  id,
  value,
  disabled = false,
  defaultTime = '00:00',
  onChange,
}: TimePickerFieldProps) {
  const parts = parseTimeValue(value, defaultTime)

  function handlePartChange(next: Partial<TimeParts>) {
    onChange(formatTimeValue({ ...parts, ...next }))
  }

  return (
    <div
      role="group"
      aria-label="Time"
      className={[
        shellClasses,
        disabled ? 'cursor-not-allowed border-border-subtle bg-surface-container opacity-70 shadow-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-w-0 flex-1">
        <SelectField
          compact
          embedded
          id={`${id}-hour`}
          label="Hour"
          value={parts.hour}
          options={getHourSelectOptions()}
          disabled={disabled}
          className="flex-1"
          onChange={(hour) => handlePartChange({ hour })}
        />
      </div>

      <span aria-hidden className="shrink-0 text-body-md text-on-surface-variant">
        :
      </span>

      <div className="flex min-w-0 flex-1">
        <SelectField
          compact
          embedded
          id={`${id}-minute`}
          label="Minute"
          value={parts.minute}
          options={getMinuteSelectOptions()}
          disabled={disabled}
          className="flex-1"
          onChange={(minute) => handlePartChange({ minute })}
        />
      </div>

      <div className="flex min-w-[72px] shrink-0 border-l border-border-subtle">
        <SelectField
          compact
          embedded
          id={`${id}-period`}
          label="AM or PM"
          value={parts.period}
          options={getPeriodSelectOptions()}
          disabled={disabled}
          className="w-full"
          onChange={(period) => handlePartChange({ period: period as TimeParts['period'] })}
        />
      </div>
    </div>
  )
}
