export type PlanSectionKey = 'general' | 'focused' | 'module'

export type FirestorePlanType =
  | 'DURATION_BASED'
  | 'DATE_BASED'
  | 'MODULE_BASED'

export interface PlanSectionConfig {
  key: PlanSectionKey
  title: string
  description: string
  icon: string
  planType: FirestorePlanType
}

export const PLAN_SECTIONS: PlanSectionConfig[] = [
  {
    key: 'general',
    title: 'General Plans',
    description: 'Duration-based plans where access is provided for a specified period.',
    icon: 'payments',
    planType: 'DURATION_BASED',
  },
  {
    key: 'focused',
    title: 'Focused Plans',
    description: 'Date-based plans with a fixed start and end date.',
    icon: 'track_changes',
    planType: 'DATE_BASED',
  },
  {
    key: 'module',
    title: 'Module Plans',
    description:
      'Plans based on a combination of specific modules and a defined date range.',
    icon: 'grid_view',
    planType: 'MODULE_BASED',
  },
]

const PLAN_TYPE_TO_SECTION: Record<FirestorePlanType, PlanSectionKey> = {
  DURATION_BASED: 'general',
  DATE_BASED: 'focused',
  MODULE_BASED: 'module',
}

export function normalizePlanType(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

export function getPlanSectionKey(planType: string): PlanSectionKey | null {
  const normalized = normalizePlanType(planType)

  if (!normalized) return null

  if (normalized in PLAN_TYPE_TO_SECTION) {
    return PLAN_TYPE_TO_SECTION[normalized as FirestorePlanType]
  }

  return null
}
