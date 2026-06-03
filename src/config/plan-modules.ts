import type { SelectOption } from '@/components/ui/SelectField'

export const PLAN_MODULE_OPTIONS: SelectOption[] = [
  { value: 'Question bank', label: 'Question bank' },
  { value: 'Test series', label: 'Test series' },
  { value: 'Videos', label: 'Videos' },
]

const LEGACY_MODULE_ALIASES: Record<string, string> = {
  qbanks: 'Question bank',
  qbank: 'Question bank',
  'question bank': 'Question bank',
  grand_tests: 'Test series',
  test_series: 'Test series',
  'test series': 'Test series',
  videos: 'Videos',
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
