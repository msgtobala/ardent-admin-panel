import type { InputHTMLAttributes } from 'react'

type TextFieldProps = {
  label: string
  id: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

const inputClasses =
  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

export function TextField({
  label,
  id,
  error,
  className = '',
  required,
  ...inputProps
}: TextFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-label-sm text-on-surface">
        {label}
        {required ? (
          <span className="text-error-red" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[inputClasses, error ? 'border-error-red' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="text-label-sm text-error-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
