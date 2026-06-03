import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface PlansPageHeaderProps {
  onNewPlan?: () => void
}

export function PlansPageHeader({ onNewPlan }: PlansPageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-gutter">
      <div className="flex max-w-[672px] flex-col gap-2">
        <h1 className="text-section-title text-on-surface">Plans</h1>
        <p className="text-body-md text-on-surface-variant">
          Manage duration-based, focused, and module plans across the Ardent MDS Plus
          app
        </p>
      </div>
      <Button
        type="button"
        onClick={onNewPlan}
        className="shrink-0 gap-2 px-6 py-3 text-body-lg font-semibold shadow-[0_10px_15px_-3px_rgba(255,73,0,0.2),0_4px_6px_-4px_rgba(255,73,0,0.2)]"
      >
        <MaterialIcon name="add" size={18} />
        New Plan
      </Button>
    </div>
  )
}
