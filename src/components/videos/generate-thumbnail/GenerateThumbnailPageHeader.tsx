import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface GenerateThumbnailPageHeaderProps {
  missingThumbnailCount: number
  hasSubjectSelected: boolean
  isGenerating: boolean
  disabled?: boolean
  onGenerateThumbnails?: () => void
}

export function GenerateThumbnailPageHeader({
  missingThumbnailCount,
  hasSubjectSelected,
  isGenerating,
  disabled = false,
  onGenerateThumbnails,
}: GenerateThumbnailPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Generate Thumbnails</h1>
        <p className="text-body-md text-on-surface-variant">
          Download thumbnails from linked Mux videos, store them in Firebase Storage,
          and save the public URL on each lesson.
        </p>
        {hasSubjectSelected && missingThumbnailCount > 0 ? (
          <p className="text-caption text-on-surface-variant">
            {missingThumbnailCount} lesson{missingThumbnailCount === 1 ? '' : 's'}{' '}
            with video but no thumbnail on this subject.
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={onGenerateThumbnails}
        disabled={disabled || isGenerating || !hasSubjectSelected}
        className="shrink-0 gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
        aria-label="Generate thumbnails for lessons missing a thumbnail"
      >
        <MaterialIcon name="add" size={18} />
        {isGenerating ? 'Generating...' : 'Generate Thumbnails'}
      </Button>
    </div>
  )
}
