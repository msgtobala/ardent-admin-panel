import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import type { SelectOption } from '@/components/ui/SelectField'

type MultiSelectFieldProps = {
  label: string
  id: string
  values: string[]
  options: SelectOption[]
  onChange: (values: string[]) => void
  error?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

const triggerClasses =
  'flex min-h-[38px] w-full items-center justify-between gap-2 rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-left text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

function getDisplayLabel(
  values: string[],
  options: SelectOption[],
  placeholder: string,
): string {
  if (values.length === 0) return placeholder

  const labels = values
    .map((value) => options.find((option) => option.value === value)?.label ?? value)
    .filter(Boolean)

  if (labels.length <= 2) return labels.join(', ')
  return `${labels.length} modules selected`
}

export function MultiSelectField({
  label,
  id,
  values,
  options,
  onChange,
  error,
  disabled = false,
  required,
  placeholder = 'Select modules',
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const listboxId = `${id}-listbox`

  const selectedSet = useMemo(() => new Set(values), [values])
  const displayLabel = getDisplayLabel(values, options, placeholder)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const handleOpen = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    setHighlightedIndex(0)
  }, [disabled])

  const handleToggleValue = useCallback(
    (optionValue: string) => {
      if (selectedSet.has(optionValue)) {
        onChange(values.filter((value) => value !== optionValue))
        return
      }

      onChange([...values, optionValue])
    },
    [onChange, selectedSet, values],
  )

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      handleClose()
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, isOpen])

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return

    const listbox = listboxRef.current
    if (!listbox) return

    const option = listbox.children[highlightedIndex] as HTMLElement | undefined
    if (!option) return

    const optionTop = option.offsetTop
    const optionBottom = optionTop + option.offsetHeight
    const visibleTop = listbox.scrollTop
    const visibleBottom = visibleTop + listbox.clientHeight

    if (optionTop < visibleTop) {
      listbox.scrollTop = optionTop
      return
    }

    if (optionBottom > visibleBottom) {
      listbox.scrollTop = optionBottom - listbox.clientHeight
    }
  }, [highlightedIndex, isOpen])

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        handleOpen()
        return
      }
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        handleOpen()
        return
      }
      setHighlightedIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) {
        handleOpen()
        return
      }
      const option = options[highlightedIndex]
      if (option) handleToggleValue(option.value)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      handleClose()
    }
  }

  return (
    <div ref={containerRef} className="relative flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-label-sm text-on-surface">
        {label}
        {required ? (
          <span className="text-error-red" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      <div className="relative w-full">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          onKeyDown={handleTriggerKeyDown}
          className={[
            triggerClasses,
            error ? 'border-error-red' : '',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span
            className={[
              'line-clamp-2 flex-1',
              values.length > 0 ? 'text-on-surface' : 'text-on-surface-variant',
            ].join(' ')}
          >
            {displayLabel}
          </span>
          <MaterialIcon
            name="expand_more"
            size={20}
            className={[
              'shrink-0 text-on-surface-variant transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        </button>

        {isOpen ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            aria-multiselectable="true"
            className="absolute top-[calc(100%+4px)] left-0 z-60 max-h-[240px] w-full overflow-y-auto rounded-input border border-border-subtle bg-surface-white py-1 shadow-tier-2"
          >
            {options.length === 0 ? (
              <li className="px-[13px] py-2 text-body-md text-on-surface-variant">
                No modules available
              </li>
            ) : (
              options.map((option, index) => {
                const isSelected = selectedSet.has(option.value)
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleToggleValue(option.value)}
                    className={[
                      'flex cursor-pointer items-center gap-2 px-[13px] py-2 text-body-md text-on-surface',
                      isHighlighted ? 'bg-row-hover' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={[
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        isSelected
                          ? 'border-primary-action bg-primary-action text-surface-white'
                          : 'border-border-subtle bg-surface-white',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {isSelected ? (
                        <MaterialIcon name="check" size={16} className="text-surface-white" />
                      ) : null}
                    </span>
                    <span className={isSelected ? 'font-medium' : ''}>{option.label}</span>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}
      </div>

      {values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => {
            const optionLabel =
              options.find((option) => option.value === value)?.label ?? value

            return (
              <span
                key={value}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface-container-low py-1.5 pl-3 pr-2 text-label-sm leading-none text-on-surface"
              >
                <span className="leading-none">{optionLabel}</span>
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove ${optionLabel}`}
                    onClick={() => handleToggleValue(value)}
                    className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    <MaterialIcon
                      name="close"
                      size={16}
                      className="text-on-surface-variant"
                    />
                  </button>
                ) : null}
              </span>
            )
          })}
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="text-label-sm text-error-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
