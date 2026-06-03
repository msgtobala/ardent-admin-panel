import type { KeyboardEvent } from 'react'

interface ActiveToggleProps {
  isActive: boolean
  onChange: (isActive: boolean) => void
  disabled?: boolean
  ariaLabel: string
}

export function ActiveToggle({
  isActive,
  onChange,
  disabled = false,
  ariaLabel,
}: ActiveToggleProps) {
  function handleClick() {
    if (disabled) return
    onChange(!isActive)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChange(!isActive)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
        isActive ? 'bg-primary-action' : 'bg-border-subtle',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'absolute top-0.5 size-4 rounded-full border border-white bg-white transition',
          isActive ? 'left-[18px]' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  )
}
