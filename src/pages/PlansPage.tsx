import { useState } from 'react'
import type { PlanSectionConfig } from '@/config/plan-sections'
import { EditPlanModal } from '@/components/plans/EditPlanModal'
import { PlansPageHeader } from '@/components/plans/PlansPageHeader'
import { PlansSections } from '@/components/plans/PlansSections'
import { ReorderPlansModal } from '@/components/plans/ReorderPlansModal'
import { isFreePlan } from '@/lib/plan-utils'
import type { Plan } from '@/types/plan'

type PlanModalState = { mode: 'add' } | { mode: 'edit'; plan: Plan } | null

export default function PlansPage() {
  const [modalState, setModalState] = useState<PlanModalState>(null)
  const [reorderingSection, setReorderingSection] = useState<PlanSectionConfig | null>(
    null,
  )
  const [refreshKey, setRefreshKey] = useState(0)

  function handleNewPlan() {
    setModalState({ mode: 'add' })
  }

  function handleEditPlan(plan: Plan) {
    if (isFreePlan(plan)) return
    setModalState({ mode: 'edit', plan })
  }

  function handleEditSortOrder(section: PlanSectionConfig) {
    setReorderingSection(section)
  }

  function handleClosePlanModal() {
    setModalState(null)
  }

  function handleCloseReorderModal() {
    setReorderingSection(null)
  }

  function handlePlansUpdated() {
    setRefreshKey((prev) => prev + 1)
  }

  const isPlanModalOpen = modalState !== null
  const editingPlan = modalState?.mode === 'edit' ? modalState.plan : null

  return (
    <div className="flex flex-col gap-gutter">
      <PlansPageHeader onNewPlan={handleNewPlan} />
      <PlansSections
        refreshKey={refreshKey}
        onEdit={handleEditPlan}
        onEditSortOrder={handleEditSortOrder}
      />
      <EditPlanModal
        key={
          modalState === null
            ? 'edit-plan-closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.plan.id}`
              : 'add'
        }
        isOpen={isPlanModalOpen}
        plan={editingPlan}
        onClose={handleClosePlanModal}
        onSaved={handlePlansUpdated}
      />
      <ReorderPlansModal
        key={reorderingSection ? `reorder-${reorderingSection.key}` : 'reorder-plan-closed'}
        isOpen={reorderingSection !== null}
        section={reorderingSection}
        onClose={handleCloseReorderModal}
        onSaved={handlePlansUpdated}
      />
    </div>
  )
}
