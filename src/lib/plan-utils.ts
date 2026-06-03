import type { Plan } from '@/types/plan'

export function formatPlanModules(modules: string[]): string {
  if (!modules.length) return '—'
  return modules.join(', ')
}

export function isFreePlan(plan: Plan): boolean {
  const planName = plan.planName.trim().toLowerCase()
  return planName === 'free' || planName.includes('free plan') || planName.startsWith('free ')
}
