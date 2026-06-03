import { useState } from 'react'
import { EditPlanModal } from '@/components/plans/EditPlanModal'
import { PlansPageHeader } from '@/components/plans/PlansPageHeader'
import { PlansSections } from '@/components/plans/PlansSections'
import { isFreePlan } from '@/lib/plan-utils'
import type { Plan } from '@/types/plan'

export default function PlansPage() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleEditPlan(plan: Plan) {
    if (isFreePlan(plan)) return
    setEditingPlan(plan)
  }

  function handleCloseModal() {
    setEditingPlan(null)
  }

  function handlePlanSaved() {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <PlansPageHeader />
      <PlansSections refreshKey={refreshKey} onEdit={handleEditPlan} />
      <EditPlanModal
        key={editingPlan ? `edit-${editingPlan.id}` : 'closed'}
        isOpen={editingPlan !== null}
        plan={editingPlan}
        onClose={handleCloseModal}
        onSaved={handlePlanSaved}
      />
    </div>
  )
}
