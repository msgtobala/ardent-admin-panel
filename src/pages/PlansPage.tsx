import { useState } from 'react'
import { EditPlanModal } from '@/components/plans/EditPlanModal'
import { PlansPageHeader } from '@/components/plans/PlansPageHeader'
import { PlansTable } from '@/components/plans/PlansTable'
import { usePlans } from '@/hooks/usePlans'
import type { Plan } from '@/types/plan'

export default function PlansPage() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const {
    plans,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    actionError,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
    refreshPlans,
  } = usePlans()

  function handleEditPlan(plan: Plan) {
    setEditingPlan(plan)
  }

  function handleCloseModal() {
    setEditingPlan(null)
  }

  function handlePlanSaved() {
    refreshPlans()
  }

  return (
    <div className="flex flex-col gap-gutter">
      <PlansPageHeader />
      <PlansTable
        plans={plans}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        actionError={actionError}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onEdit={handleEditPlan}
        onToggleIsActive={handleToggleIsActive}
      />
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
