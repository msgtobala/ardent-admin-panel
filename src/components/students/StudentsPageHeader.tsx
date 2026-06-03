import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface StudentsPageHeaderProps {
  searchInput: string
  appliedSearchQuery: string
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onSearchClear: () => void
  disabled?: boolean
  isSearching?: boolean
}

const searchInputClasses =
  'h-[38px] w-full rounded-input border border-border-subtle bg-surface-white py-[10px] pl-10 pr-[13px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

export function StudentsPageHeader({
  searchInput,
  appliedSearchQuery,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  disabled = false,
  isSearching = false,
}: StudentsPageHeaderProps) {
  const showClearButton =
    searchInput.trim().length > 0 || appliedSearchQuery.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchSubmit()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Students</h1>
        <p className="text-body-md text-on-surface-variant">
          View and manage student accounts, contact details, and active plans across
          the Ardent MDS Plus app
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-[640px] flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor="students-search" className="sr-only">
            Search students
          </label>
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            id="students-search"
            type="search"
            value={searchInput}
            disabled={disabled}
            placeholder="Search by name, UID, email, or phone"
            aria-label="Search students by name, UID, email, or phone"
            onChange={(event) => onSearchInputChange(event.target.value)}
            className={searchInputClasses}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="submit"
            disabled={disabled || isSearching}
            aria-label="Search students"
            className="min-w-[96px]"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>

          {showClearButton ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isSearching}
              onClick={onSearchClear}
              aria-label="Clear search"
              className="gap-1.5"
            >
              <MaterialIcon name="close" size={16} />
              Clear
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
