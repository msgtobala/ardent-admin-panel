import type { Plan } from '@/types/plan'
import { isFreePlan } from './plan-utils'

export function movePlanInList(
  plans: Plan[],
  index: number,
  direction: 'up' | 'down',
): Plan[] {
  if (isFreePlan(plans[index])) return plans

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= plans.length) return plans
  if (isFreePlan(plans[targetIndex])) return plans

  const nextPlans = [...plans]
  const [movedPlan] = nextPlans.splice(index, 1)
  nextPlans.splice(targetIndex, 0, movedPlan)
  return nextPlans
}

export function buildDisplayOrderUpdates(
  plans: Plan[],
): { id: string; displayOrder: number }[] {
  return plans.map((plan, index) => ({
    id: plan.id,
    displayOrder: index,
  }))
}
