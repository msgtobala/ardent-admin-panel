import { useState, type InputHTMLAttributes } from 'react'
import { MaterialIcon } from './MaterialIcon'

type PasswordFieldProps = {
  label: string
  id: string
  error?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

const inputClasses =
  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white py-[10px] pl-[13px] pr-10 text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

export function PasswordField({
  label,
  id,
  error,
  className = '',
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-label-sm text-on-surface">
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[inputClasses, error ? 'border-error-red' : '', className]
            .filter(Boolean)
            .join(' ')}
          {...inputProps}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-on-surface-variant transition hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <MaterialIcon
            name={visible ? 'visibility_off' : 'visibility'}
            size={18}
          />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-label-sm text-error-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
