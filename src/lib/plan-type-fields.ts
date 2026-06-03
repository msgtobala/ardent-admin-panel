import type { FirestorePlanType } from '@/config/plan-sections'
import { fromDateInputValue } from '@/lib/format-date'

export type ModulePlanTimingMode = 'duration' | 'valid_until'

export interface PlanTypeFieldRules {
  showDurationMonths: boolean
  showValidUntilDate: boolean
  showModuleTimingMode: boolean
  requireDurationMonths: boolean
  requireValidUntilDate: boolean
  durationHelperText?: string
  validUntilHelperText?: string
  sectionHelperText?: string
}

function parseDurationMonths(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed))
}

export function inferModulePlanTimingMode(
  durationMonths: number,
  validUntilDate: Date | null,
): ModulePlanTimingMode {
  if (validUntilDate) return 'valid_until'
  if (durationMonths > 0) return 'duration'
  return 'duration'
}

export function getPlanTypeFieldRules(
  planType: FirestorePlanType,
  moduleTimingMode: ModulePlanTimingMode = 'duration',
): PlanTypeFieldRules {
  switch (planType) {
    case 'DURATION_BASED':
      return {
        showDurationMonths: true,
        showValidUntilDate: false,
        showModuleTimingMode: false,
        requireDurationMonths: true,
        requireValidUntilDate: false,
        durationHelperText: 'Access length in months. Valid until date is not used.',
        sectionHelperText: 'General plans use a fixed duration in months only.',
      }
    case 'DATE_BASED':
      return {
        showDurationMonths: false,
        showValidUntilDate: true,
        showModuleTimingMode: false,
        requireDurationMonths: false,
        requireValidUntilDate: true,
        validUntilHelperText: 'Fixed end date for plan access. Duration in months is not used.',
        sectionHelperText: 'Focused plans use a definite validity date only.',
      }
    case 'MODULE_BASED':
      return {
        showDurationMonths: moduleTimingMode === 'duration',
        showValidUntilDate: moduleTimingMode === 'valid_until',
        showModuleTimingMode: true,
        requireDurationMonths: moduleTimingMode === 'duration',
        requireValidUntilDate: moduleTimingMode === 'valid_until',
        durationHelperText: 'Access length in months.',
        validUntilHelperText: 'Fixed end date for plan access.',
        sectionHelperText:
          'Module plans use either duration in months or a valid until date, not both.',
      }
  }
}

export interface PlanTypeFieldValues {
  durationMonths: number
  validUntilDate: Date | null
}

export function normalizePlanTypeFieldsForSave(
  planType: FirestorePlanType,
  durationMonthsValue: string,
  validUntilDateValue: string,
  moduleTimingMode: ModulePlanTimingMode = 'duration',
): PlanTypeFieldValues {
  const durationMonths = parseDurationMonths(durationMonthsValue)
  const validUntilDate = fromDateInputValue(validUntilDateValue)

  switch (planType) {
    case 'DURATION_BASED':
      return { durationMonths, validUntilDate: null }
    case 'DATE_BASED':
      return { durationMonths: 0, validUntilDate }
    case 'MODULE_BASED':
      if (moduleTimingMode === 'duration') {
        return { durationMonths, validUntilDate: null }
      }
      return { durationMonths: 0, validUntilDate }
  }
}

export interface PlanTypeFieldValidation {
  durationMonthsError?: string
  validUntilDateError?: string
  timingModeError?: string
}

export function validatePlanTypeFields(
  planType: FirestorePlanType,
  durationMonthsValue: string,
  validUntilDateValue: string,
  moduleTimingMode: ModulePlanTimingMode = 'duration',
): PlanTypeFieldValidation {
  const rules = getPlanTypeFieldRules(planType, moduleTimingMode)
  const durationMonths = parseDurationMonths(durationMonthsValue)
  const validUntilDate = fromDateInputValue(validUntilDateValue)
  const errors: PlanTypeFieldValidation = {}

  if (rules.requireDurationMonths && durationMonths <= 0) {
    errors.durationMonthsError = 'Duration in months is required'
  }

  if (rules.requireValidUntilDate && !validUntilDate) {
    errors.validUntilDateError = 'Valid until date is required'
  }

  if (planType === 'MODULE_BASED') {
    const hasDuration = durationMonths > 0
    const hasValidUntil = validUntilDate != null

    if (moduleTimingMode === 'duration' && hasValidUntil) {
      errors.timingModeError = 'Clear the valid until date or switch to valid until date mode'
    }

    if (moduleTimingMode === 'valid_until' && hasDuration) {
      errors.timingModeError = 'Clear duration in months or switch to duration mode'
    }
  }

  return errors
}

export function applyPlanTypeChangeToFields(
  nextPlanType: FirestorePlanType,
  currentDurationMonths: string,
  currentValidUntilDate: string,
): {
  durationMonths: string
  validUntilDate: string
  moduleTimingMode: ModulePlanTimingMode
} {
  switch (nextPlanType) {
    case 'DURATION_BASED':
      return {
        durationMonths: currentDurationMonths,
        validUntilDate: '',
        moduleTimingMode: 'duration',
      }
    case 'DATE_BASED':
      return {
        durationMonths: '0',
        validUntilDate: currentValidUntilDate,
        moduleTimingMode: 'valid_until',
      }
    case 'MODULE_BASED': {
      const duration = parseDurationMonths(currentDurationMonths)
      const validUntil = fromDateInputValue(currentValidUntilDate)
      const moduleTimingMode = inferModulePlanTimingMode(duration, validUntil)

      if (moduleTimingMode === 'duration') {
        return {
          durationMonths: duration > 0 ? duration.toString() : currentDurationMonths,
          validUntilDate: '',
          moduleTimingMode,
        }
      }

      return {
        durationMonths: '',
        validUntilDate: currentValidUntilDate,
        moduleTimingMode,
      }
    }
  }
}

export function applyModuleTimingModeChange(
  nextMode: ModulePlanTimingMode,
  currentDurationMonths: string,
  currentValidUntilDate: string,
): { durationMonths: string; validUntilDate: string } {
  if (nextMode === 'duration') {
    return {
      durationMonths: currentDurationMonths,
      validUntilDate: '',
    }
  }

  return {
    durationMonths: '',
    validUntilDate: currentValidUntilDate,
  }
}
