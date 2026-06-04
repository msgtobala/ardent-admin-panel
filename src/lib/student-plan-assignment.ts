import { Timestamp } from 'firebase/firestore'
import type { Plan } from '@/types/plan'
import type { CreateStudentPlanInput, StudentPlansSnapshot } from '@/types/student'

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Resolves plan expiry from the plan document fields (same rules for all plan types):
 * - DATE_BASED / MODULE_BASED (valid-until): uses `validUntilDate`
 * - DURATION_BASED / MODULE_BASED (duration): today + `durationMonths`
 * - Free / no timing: null
 */
export function resolvePlanExpiryDate(plan: Plan, referenceDate: Date = new Date()): Date | null {
  if (plan.validUntilDate) {
    return plan.validUntilDate
  }

  if (plan.durationMonths > 0) {
    return addMonths(referenceDate, plan.durationMonths)
  }

  return null
}

export function buildStudentPlanSnapshot(
  plan: Plan,
  existingPlans?: StudentPlansSnapshot | null,
): StudentPlansSnapshot {
  if (existingPlans?.planId === plan.planId) {
    return {
      planId: plan.planId,
      planName: plan.planName,
      planModules: plan.planModules,
      planPurchaseDate: existingPlans.planPurchaseDate,
      planExpiryDate: existingPlans.planExpiryDate,
      purchaseId: existingPlans.purchaseId ?? null,
    }
  }

  const purchaseDate = Timestamp.now()
  const expiryDate = resolvePlanExpiryDate(plan)

  return {
    planId: plan.planId,
    planName: plan.planName,
    planModules: plan.planModules,
    planPurchaseDate: purchaseDate,
    planExpiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
    purchaseId: null,
  }
}

export function formatPlanOptionLabel(plan: Plan): string {
  const priceLabel =
    plan.sellingPrice > 0 ? `₹${plan.sellingPrice.toLocaleString('en-IN')}` : 'Free'
  return `${plan.planName} · ${priceLabel}`
}

export function buildCreateStudentPlanSnapshot(plan: Plan): CreateStudentPlanInput {
  const expiryDate = resolvePlanExpiryDate(plan)

  return {
    planId: plan.planId,
    planName: plan.planName,
    planModules: plan.planModules,
    planExpiryDate: expiryDate ? expiryDate.toISOString() : null,
    planPurchaseDate: null,
    purchaseId: null,
  }
}
