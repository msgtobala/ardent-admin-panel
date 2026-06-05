import { Link } from 'react-router-dom'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export function ActiveGrandTestsPageHeader() {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Active Tests</h1>
        <p className="text-body-md text-on-surface-variant">
          Browse upcoming and live grand tests by month — latest tests appear
          first within each month section
        </p>
      </div>
      <Link
        to="/grand-tests/new"
        className="inline-flex h-[34px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-button bg-primary-action px-6 py-3 text-body-lg font-semibold text-on-primary shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)] transition hover:bg-primary-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <MaterialIcon name="add" size={18} />
        Add New Test
      </Link>
    </div>
  )
}
