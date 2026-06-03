import { Button } from '../ui/Button'
import { MaterialIcon } from '../ui/MaterialIcon'

interface BannersPageHeaderProps {
  onNewBanner?: () => void
}

export function BannersPageHeader({ onNewBanner }: BannersPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Banners</h1>
        <p className="text-body-md text-on-surface-variant">
          Control the promotional banners students see on their dashboard—highlight
          new courses, exam updates, offers, and important announcements
        </p>
      </div>
      <Button
        type="button"
        onClick={onNewBanner}
        className="shrink-0 gap-2 rounded-lg px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
      >
        <MaterialIcon name="add" size={18} />
        New Banner
      </Button>
    </div>
  )
}
