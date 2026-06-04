import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface VideoSubjectsPageHeaderProps {
  onEditSortOrder?: () => void
}

export function VideoSubjectsPageHeader({
  onEditSortOrder,
}: VideoSubjectsPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Video Subjects</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage video subjects shown in the app — update icons, names, descriptions,
          and display order
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onEditSortOrder}
        className="shrink-0 gap-2"
      >
        <MaterialIcon name="swap_vert" size={16} />
        Edit sort order
      </Button>
    </div>
  )
}
