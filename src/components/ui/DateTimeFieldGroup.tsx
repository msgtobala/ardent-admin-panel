import type { ChangeEvent } from 'react'
import { TimePickerField } from '@/components/ui/TimePickerField'
import {
  combineDateAndTimeValues,
  splitDatetimeLocalValue,
} from '@/lib/format-date'

interface DateTimeFieldGroupProps {
  label: string
  id: string
  value: string
  disabled?: boolean
  required?: boolean
  error?: string
  defaultTime?: string
  onChange: (value: string) => void
}

const inputClasses =
  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70 disabled:shadow-none'

export function DateTimeFieldGroup({
  label,
  id,
  value,
  disabled = false,
  required,
  error,
  defaultTime = '00:00',
  onChange,
}: DateTimeFieldGroupProps) {
  const { dateValue, timeValue } = splitDatetimeLocalValue(value)
  const dateInputId = `${id}-date`
  const timeInputId = `${id}-time`
  const errorId = `${id}-error`

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = combineDateAndTimeValues(
      event.target.value,
      timeValue,
      defaultTime,
    )
    onChange(nextValue)
    event.target.blur()
  }

  function handleTimeChange(nextTimeValue: string) {
    if (!dateValue) return

    onChange(combineDateAndTimeValues(dateValue, nextTimeValue, defaultTime))
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <span id={`${id}-label`} className="text-label-sm text-on-surface">
        {label}
        {required ? (
          <span className="text-error-red" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
      >
        <input
          id={dateInputId}
          type="date"
          required={required}
          value={dateValue}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[inputClasses, error ? 'border-error-red' : ''].filter(Boolean).join(' ')}
          onChange={handleDateChange}
        />
        <TimePickerField
          id={timeInputId}
          value={timeValue}
          defaultTime={defaultTime}
          disabled={disabled || !dateValue}
          onChange={handleTimeChange}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-label-sm text-error-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
