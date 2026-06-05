import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface QbankChaptersPageHeaderProps {
  onAddChapter?: () => void
  onEditSortOrder?: () => void
}

export function QbankChaptersPageHeader({
  onAddChapter,
  onEditSortOrder,
}: QbankChaptersPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Qbank Chapters</h1>
        <p className="text-body-md text-on-surface-variant">
          Select a qbank subject to view all chapters inside that subject.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onEditSortOrder}
          className="gap-2"
        >
          <MaterialIcon name="swap_vert" size={16} />
          Edit sort order
        </Button>
        <Button
          type="button"
          onClick={onAddChapter}
          className="gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
        >
          <MaterialIcon name="add" size={18} />
          Add Chapter
        </Button>
      </div>
    </div>
  )
}
