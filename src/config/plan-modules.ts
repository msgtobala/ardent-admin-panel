import type { SelectOption } from '@/components/ui/SelectField'

export const PLAN_MODULE_QUESTION_BANK = 'QUESTION_BANK'
export const PLAN_MODULE_TEST_SERIES = 'TEST_SERIES'
export const PLAN_MODULE_VIDEOS = 'VIDEOS'

export const PLAN_MODULE_OPTIONS: SelectOption[] = [
  { value: PLAN_MODULE_QUESTION_BANK, label: 'Question bank' },
  { value: PLAN_MODULE_TEST_SERIES, label: 'Test series' },
  { value: PLAN_MODULE_VIDEOS, label: 'Videos' },
]

const LEGACY_MODULE_ALIASES: Record<string, string> = {
  qbanks: PLAN_MODULE_QUESTION_BANK,
  qbank: PLAN_MODULE_QUESTION_BANK,
  question_bank: PLAN_MODULE_QUESTION_BANK,
  'question bank': PLAN_MODULE_QUESTION_BANK,
  grand_tests: PLAN_MODULE_TEST_SERIES,
  test_series: PLAN_MODULE_TEST_SERIES,
  'test series': PLAN_MODULE_TEST_SERIES,
  videos: PLAN_MODULE_VIDEOS,
}

export function getPlanModuleLabel(value: string): string {
  const option = PLAN_MODULE_OPTIONS.find((item) => item.value === value)
  if (option) return option.label

  const normalized = normalizePlanModuleValue(value)
  if (normalized) {
    return PLAN_MODULE_OPTIONS.find((item) => item.value === normalized)?.label ?? normalized
  }

  return value
}

export function normalizePlanModuleValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const canonical = PLAN_MODULE_OPTIONS.find(
    (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
  )?.value
  if (canonical) return canonical

  const alias = LEGACY_MODULE_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias

  return null
}

export function normalizePlanModules(modules: string[]): string[] {
  const normalized = modules
    .map(normalizePlanModuleValue)
    .filter((module): module is string => module != null)

  return [...new Set(normalized)]
}
