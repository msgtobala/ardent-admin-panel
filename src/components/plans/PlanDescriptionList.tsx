import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface PlanDescriptionListProps {
  descriptions: string[]
  disabled?: boolean
  onChange: (descriptions: string[]) => void
}

const inputClasses =
  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

const removeButtonClassName =
  'mt-1 shrink-0 cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40'

export function PlanDescriptionList({
  descriptions,
  disabled = false,
  onChange,
}: PlanDescriptionListProps) {
  function handleAddDescription() {
    onChange([...descriptions, ''])
  }

  function handleRemoveDescription(index: number) {
    onChange(descriptions.filter((_, itemIndex) => itemIndex !== index))
  }

  function handleDescriptionChange(index: number, value: string) {
    const nextDescriptions = [...descriptions]
    nextDescriptions[index] = value
    onChange(nextDescriptions)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-label-sm text-on-surface">Description</span>
        <button
          type="button"
          onClick={handleAddDescription}
          disabled={disabled}
          className="cursor-pointer text-body-md text-primary transition hover:text-primary-action hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add description
        </button>
      </div>

      {descriptions.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">
          No description lines yet. Add one or more bullet points for this plan.
        </p>
      ) : (
        descriptions.map((description, index) => (
          <div key={`description-${index}`} className="flex items-start gap-2">
            <label className="sr-only" htmlFor={`plan-description-${index}`}>
              Description line {index + 1}
            </label>
            <input
              id={`plan-description-${index}`}
              type="text"
              value={description}
              disabled={disabled}
              placeholder={`Description line ${index + 1}`}
              onChange={(event) => handleDescriptionChange(index, event.target.value)}
              className={inputClasses}
            />
            <button
              type="button"
              aria-label={`Remove description line ${index + 1}`}
              disabled={disabled}
              onClick={() => handleRemoveDescription(index)}
              className={removeButtonClassName}
            >
              <MaterialIcon
                name="close"
                size={16}
                className="text-on-surface-variant"
              />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export function normalizePlanDescriptions(descriptions: string[]): string[] {
  return descriptions.map((item) => item.trim()).filter(Boolean)
}
