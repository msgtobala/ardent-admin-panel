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
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-2"
    >
      <SelectField
        compact
        id={`${id}-hour`}
        label="Hour"
        value={parts.hour}
        options={getHourSelectOptions()}
        disabled={disabled}
        onChange={(hour) => handlePartChange({ hour })}
      />
      <SelectField
        compact
        id={`${id}-minute`}
        label="Minute"
        value={parts.minute}
        options={getMinuteSelectOptions()}
        disabled={disabled}
        onChange={(minute) => handlePartChange({ minute })}
      />
      <SelectField
        compact
        id={`${id}-period`}
        label="AM or PM"
        value={parts.period}
        options={getPeriodSelectOptions()}
        disabled={disabled}
        onChange={(period) => handlePartChange({ period: period as TimeParts['period'] })}
      />
    </div>
  )
}
