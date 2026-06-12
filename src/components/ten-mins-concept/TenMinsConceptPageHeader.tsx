import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface TenMinsConceptPageHeaderProps {
  onSuggest?: () => void
  isSuggesting?: boolean
}

export function TenMinsConceptPageHeader({
  onSuggest,
  isSuggesting = false,
}: TenMinsConceptPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">10 Mins Concept</h1>
        <p className="text-body-md text-on-surface-variant">
          Pick one active video lesson for the student dashboard nugget. Suggesting
          creates a new concept and shows the latest active entry below.
        </p>
      </div>
      <Button
        type="button"
        onClick={onSuggest}
        disabled={isSuggesting}
        className="shrink-0 gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
      >
        <MaterialIcon name="auto_awesome" size={18} />
        {isSuggesting ? 'Suggesting...' : 'Suggest 10 Mins Concept'}
      </Button>
    </div>
  )
}
