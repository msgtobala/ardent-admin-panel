import { Timestamp } from 'firebase/firestore'
import type { Plan } from '@/types/plan'
import type { StudentPlansSnapshot } from '@/types/student'

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
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
  let planExpiryDate: Timestamp | null = null

  if (plan.validUntilDate) {
    planExpiryDate = Timestamp.fromDate(plan.validUntilDate)
  } else if (plan.durationMonths > 0) {
    planExpiryDate = Timestamp.fromDate(addMonths(new Date(), plan.durationMonths))
  }

  return {
    planId: plan.planId,
    planName: plan.planName,
    planModules: plan.planModules,
    planPurchaseDate: purchaseDate,
    planExpiryDate,
    purchaseId: null,
  }
}

export function formatPlanOptionLabel(plan: Plan): string {
  const priceLabel =
    plan.sellingPrice > 0 ? `₹${plan.sellingPrice.toLocaleString('en-IN')}` : 'Free'
  return `${plan.planName} · ${priceLabel}`
}
