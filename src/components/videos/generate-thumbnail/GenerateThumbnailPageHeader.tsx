import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface GenerateThumbnailPageHeaderProps {
  missingThumbnailCount: number
  hasSubjectSelected: boolean
  isGenerating: boolean
  onGenerateAllMissing?: () => void
}

export function GenerateThumbnailPageHeader({
  missingThumbnailCount,
  hasSubjectSelected,
  isGenerating,
  onGenerateAllMissing,
}: GenerateThumbnailPageHeaderProps) {
  const canGenerateAll =
    hasSubjectSelected && missingThumbnailCount > 0 && !isGenerating

  return (
    <div className="flex flex-col gap-gutter sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Generate Thumbnail</h1>
        <p className="text-body-md text-on-surface-variant">
          Create lesson thumbnails from linked Mux videos and save the image URL to
          each lesson in Firestore.
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
        onClick={onGenerateAllMissing}
        disabled={!canGenerateAll}
        className="shrink-0 gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
        aria-label="Generate thumbnails for all lessons missing a thumbnail"
      >
        <MaterialIcon name="auto_awesome" size={18} />
        {isGenerating ? 'Generating...' : 'Generate All Missing'}
      </Button>
    </div>
  )
}
