import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export interface SelectOption {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  id: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

const triggerClasses =
  'flex h-[38px] w-full items-center justify-between gap-2 rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-left text-body-md text-on-surface shadow-tier-1 focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

export function SelectField({
  label,
  id,
  value,
  options,
  onChange,
  error,
  disabled = false,
  required,
  placeholder = 'Select an option',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const listboxId = `${id}-listbox`

  const selectedOption = options.find((option) => option.value === value)
  const displayLabel = selectedOption?.label ?? placeholder

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    setMenuStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const handleOpen = useCallback(() => {
    if (disabled) return
    updateMenuPosition()
    setIsOpen(true)
    const selectedIndex = options.findIndex((option) => option.value === value)
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [disabled, options, updateMenuPosition, value])

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue)
      handleClose()
      triggerRef.current?.focus()
    },
    [handleClose, onChange],
  )

  useEffect(() => {
    if (!isOpen) return

    updateMenuPosition()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (listboxRef.current?.contains(target)) return
      handleClose()
    }

    function handleScrollOrResize() {
      updateMenuPosition()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [handleClose, isOpen, updateMenuPosition])

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return
    const option = listboxRef.current?.children[highlightedIndex] as HTMLElement | undefined
    option?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, isOpen])

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
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
      if (option) handleSelect(option.value)
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
      <button
        ref={triggerRef}
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
        <span className={selectedOption ? 'text-on-surface' : 'text-on-surface-variant'}>
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
      {error ? (
        <p id={`${id}-error`} className="text-label-sm text-error-red" role="alert">
          {error}
        </p>
      ) : null}
      {isOpen && menuStyle
        ? createPortal(
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={id}
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
              }}
              className="fixed z-60 max-h-[240px] overflow-y-auto rounded-input border border-border-subtle bg-surface-white py-1 shadow-tier-2"
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(option.value)}
                    className={[
                      'cursor-pointer px-[13px] py-2 text-body-md text-on-surface',
                      isSelected ? 'bg-primary-action/10 font-medium' : '',
                      isHighlighted && !isSelected ? 'bg-row-hover' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {option.label}
                  </li>
                )
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
