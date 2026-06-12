import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface SuggestedVideosPageHeaderProps {
  onGenerate?: () => void
  isGenerating?: boolean
}

export function SuggestedVideosPageHeader({
  onGenerate,
  isGenerating = false,
}: SuggestedVideosPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Suggested Videos</h1>
        <p className="text-body-md text-on-surface-variant">
          Pick three active video lessons with thumbnails for the student dashboard
          carousel. Generating refreshes all slots and resets the students watched count.
        </p>
      </div>
      <Button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="shrink-0 gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
      >
        <MaterialIcon name="auto_awesome" size={18} />
        {isGenerating ? 'Generating...' : 'Generate Suggested Videos'}
      </Button>
    </div>
  )
}
