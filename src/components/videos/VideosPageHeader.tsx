import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideosPageHeaderProps {
  onAddLesson?: () => void
  onEditSortOrder?: () => void
}

export function VideosPageHeader({
  onAddLesson,
  onEditSortOrder,
}: VideosPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Videos</h1>
        <p className="text-body-md text-on-surface-variant">
          Select a video subject to browse lessons, preview Mux playback, and edit or
          delete lesson metadata.
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
          onClick={onAddLesson}
          className="gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
        >
          <MaterialIcon name="add" size={18} />
          Add Video
        </Button>
      </div>
    </div>
  )
}
