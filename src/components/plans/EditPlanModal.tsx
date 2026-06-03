import { useCallback, useEffect, useState } from 'react'
import { normalizePlanModules, PLAN_MODULE_OPTIONS } from '@/config/plan-modules'
import {
  PLAN_SECTIONS,
  normalizePlanType,
  type FirestorePlanType,
} from '@/config/plan-sections'
import {
  applyModuleTimingModeChange,
  applyPlanTypeChangeToFields,
  getPlanTypeFieldRules,
  inferModulePlanTimingMode,
  normalizePlanTypeFieldsForSave,
  validatePlanTypeFields,
  type ModulePlanTimingMode,
} from '@/lib/plan-type-fields'
import { toDateInputValue } from '@/lib/format-date'
import {
  createPlan,
  getNextDisplayOrder,
  updatePlan,
} from '@/lib/plans'
import type { Plan } from '@/types/plan'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { MultiSelectField } from '@/components/ui/MultiSelectField'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import {
  PlanDescriptionList,
  normalizePlanDescriptions,
} from './PlanDescriptionList'
import { ModulePlanTimingSection } from './ModulePlanTimingSection'

interface EditPlanModalProps {
  isOpen: boolean
  plan: Plan | null
  onClose: () => void
  onSaved: () => void
}

function getInitialFormState(plan: Plan | null) {
  const planType = (plan?.planType ?? 'DURATION_BASED') as FirestorePlanType
  const moduleTimingMode =
    planType === 'MODULE_BASED'
      ? inferModulePlanTimingMode(
          plan?.durationMonths ?? 0,
          plan?.validUntilDate ?? null,
        )
      : 'duration'

  const normalizedFields = normalizePlanTypeFieldsForSave(
    planType,
    plan?.durationMonths?.toString() ?? '',
    toDateInputValue(plan?.validUntilDate ?? null),
    moduleTimingMode,
  )

  return {
    planName: plan?.planName ?? '',
    planType,
    originalPrice: plan?.originalPrice?.toString() ?? '',
    sellingPrice: plan?.sellingPrice?.toString() ?? '',
    durationMonths:
      normalizedFields.durationMonths > 0
        ? normalizedFields.durationMonths.toString()
        : planType === 'DATE_BASED'
          ? '0'
          : '',
    planModules: normalizePlanModules(plan?.planModules ?? []),
    descriptions: plan?.description?.length ? [...plan.description] : [],
    badge: plan?.badge ?? '',
    validUntilDate: toDateInputValue(normalizedFields.validUntilDate),
    moduleTimingMode,
    isActive: plan?.isActive ?? true,
  }
}

export function EditPlanModal({
  isOpen,
  plan,
  onClose,
  onSaved,
}: EditPlanModalProps) {
  const { showSnackbar } = useSnackbar()
  const [planName, setPlanName] = useState('')
  const [planType, setPlanType] = useState<FirestorePlanType>('DURATION_BASED')
  const [originalPrice, setOriginalPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [durationMonths, setDurationMonths] = useState('')
  const [planModules, setPlanModules] = useState<string[]>([])
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [badge, setBadge] = useState('')
  const [validUntilDate, setValidUntilDate] = useState('')
  const [moduleTimingMode, setModuleTimingMode] = useState<ModulePlanTimingMode>('duration')
  const [isActive, setIsActive] = useState(true)
  const [planNameError, setPlanNameError] = useState<string | undefined>()
  const [planTypeError, setPlanTypeError] = useState<string | undefined>()
  const [sellingPriceError, setSellingPriceError] = useState<string | undefined>()
  const [durationMonthsError, setDurationMonthsError] = useState<string | undefined>()
  const [validUntilDateError, setValidUntilDateError] = useState<string | undefined>()
  const [timingModeError, setTimingModeError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = plan != null
  const normalizedPlanType = normalizePlanType(planType) as FirestorePlanType
  const fieldRules = getPlanTypeFieldRules(normalizedPlanType, moduleTimingMode)

  useEffect(() => {
    if (!isOpen) return

    const initial = getInitialFormState(plan)
    setPlanName(initial.planName)
    setPlanType(initial.planType)
    setOriginalPrice(initial.originalPrice)
    setSellingPrice(initial.sellingPrice)
    setDurationMonths(initial.durationMonths)
    setPlanModules(initial.planModules)
    setDescriptions(initial.descriptions)
    setBadge(initial.badge)
    setValidUntilDate(initial.validUntilDate)
    setModuleTimingMode(initial.moduleTimingMode)
    setIsActive(initial.isActive)
    setPlanNameError(undefined)
    setPlanTypeError(undefined)
    setSellingPriceError(undefined)
    setDurationMonthsError(undefined)
    setValidUntilDateError(undefined)
    setTimingModeError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, plan])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  function parseNumber(value: string, fallback = 0): number {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function validate(): boolean {
    let valid = true
    const trimmedPlanName = planName.trim()
    const trimmedSellingPrice = sellingPrice.trim()

    if (!trimmedPlanName) {
      setPlanNameError('Plan name is required')
      valid = false
    } else {
      setPlanNameError(undefined)
    }

    if (!planType) {
      setPlanTypeError('Plan type is required')
      valid = false
    } else {
      setPlanTypeError(undefined)
    }

    if (!trimmedSellingPrice) {
      setSellingPriceError('Selling price is required')
      valid = false
    } else if (parseNumber(trimmedSellingPrice) < 0) {
      setSellingPriceError('Enter a valid selling price')
      valid = false
    } else {
      setSellingPriceError(undefined)
    }

    const timingValidation = validatePlanTypeFields(
      normalizedPlanType,
      durationMonths,
      validUntilDate,
      moduleTimingMode,
    )

    if (timingValidation.durationMonthsError) {
      setDurationMonthsError(timingValidation.durationMonthsError)
      valid = false
    } else {
      setDurationMonthsError(undefined)
    }

    if (timingValidation.validUntilDateError) {
      setValidUntilDateError(timingValidation.validUntilDateError)
      valid = false
    } else {
      setValidUntilDateError(undefined)
    }

    if (timingValidation.timingModeError) {
      setTimingModeError(timingValidation.timingModeError)
      valid = false
    } else {
      setTimingModeError(undefined)
    }

    return valid
  }

  function handlePlanTypeChange(nextPlanType: string) {
    const normalizedNextPlanType = normalizePlanType(nextPlanType) as FirestorePlanType
    setPlanType(normalizedNextPlanType)
    if (planTypeError) setPlanTypeError(undefined)

    const defaults = applyPlanTypeChangeToFields(
      normalizedNextPlanType,
      durationMonths,
      validUntilDate,
    )
    setDurationMonths(defaults.durationMonths)
    setValidUntilDate(defaults.validUntilDate)
    setModuleTimingMode(defaults.moduleTimingMode)
    setDurationMonthsError(undefined)
    setValidUntilDateError(undefined)
    setTimingModeError(undefined)
  }

  function handleModuleTimingModeChange(nextMode: ModulePlanTimingMode) {
    setModuleTimingMode(nextMode)

    const nextFields = applyModuleTimingModeChange(
      nextMode,
      durationMonths,
      validUntilDate,
    )
    setDurationMonths(nextFields.durationMonths)
    setValidUntilDate(nextFields.validUntilDate)
    setDurationMonthsError(undefined)
    setValidUntilDateError(undefined)
    setTimingModeError(undefined)
  }

  async function handleSave() {
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    const normalizedPlanTypeForSave = normalizePlanType(planType) as FirestorePlanType
    const { durationMonths: savedDurationMonths, validUntilDate: savedValidUntilDate } =
      normalizePlanTypeFieldsForSave(
        normalizedPlanTypeForSave,
        durationMonths,
        validUntilDate,
        moduleTimingMode,
      )

    const payload = {
      planName: planName.trim(),
      planType: normalizedPlanTypeForSave,
      originalPrice: parseNumber(originalPrice),
      sellingPrice: parseNumber(sellingPrice),
      durationMonths: savedDurationMonths,
      description: normalizePlanDescriptions(descriptions),
      planModules,
      badge: badge.trim(),
      validUntilDate: savedValidUntilDate,
      isActive,
    }

    try {
      if (isEditMode && plan) {
        await updatePlan(plan.id, payload)
      } else {
        const displayOrder = await getNextDisplayOrder(normalizedPlanTypeForSave)
        await createPlan({
          ...payload,
          displayOrder,
        })
      }

      showSnackbar(
        isEditMode ? 'Plan updated successfully' : 'Plan created successfully',
      )
      onSaved()
      onClose()
    } catch {
      const errorMessage = isEditMode
        ? 'Failed to update plan. Please try again.'
        : 'Failed to create plan. Please try again.'
      showSnackbar(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={isEditMode ? 'Close edit plan dialog' : 'Close add plan dialog'}
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="plan-modal-title" className="text-h3 text-on-surface">
              {isEditMode ? 'Edit Plan' : 'Add New Plan'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isEditMode
                ? 'Update plan details for the Ardent MDS Plus app'
                : 'Create a new plan for the Ardent MDS Plus app'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <form
          className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <TextField
            id="plan-name"
            label="Plan Name"
            value={planName}
            disabled={isSubmitting}
            required
            error={planNameError}
            onChange={(event) => {
              setPlanName(event.target.value)
              if (planNameError) setPlanNameError(undefined)
            }}
          />

          <SelectField
            id="plan-type"
            label="Plan Type"
            value={planType}
            required
            disabled={isSubmitting}
            error={planTypeError}
            options={PLAN_SECTIONS.map((section) => ({
              value: section.planType,
              label: section.title,
            }))}
            onChange={handlePlanTypeChange}
          />

          {fieldRules.sectionHelperText ? (
            <p className="text-body-md text-on-surface-variant">{fieldRules.sectionHelperText}</p>
          ) : null}

          {fieldRules.showModuleTimingMode ? (
            <ModulePlanTimingSection
              timingMode={moduleTimingMode}
              durationMonths={durationMonths}
              validUntilDate={validUntilDate}
              disabled={isSubmitting}
              durationMonthsError={durationMonthsError}
              validUntilDateError={validUntilDateError}
              timingModeError={timingModeError}
              durationHelperText={fieldRules.durationHelperText}
              validUntilHelperText={fieldRules.validUntilHelperText}
              onTimingModeChange={handleModuleTimingModeChange}
              onDurationMonthsChange={(value) => {
                setDurationMonths(value)
                if (durationMonthsError) setDurationMonthsError(undefined)
                if (timingModeError) setTimingModeError(undefined)
              }}
              onValidUntilDateChange={(value) => {
                setValidUntilDate(value)
                if (validUntilDateError) setValidUntilDateError(undefined)
                if (timingModeError) setTimingModeError(undefined)
              }}
            />
          ) : null}

          {fieldRules.showDurationMonths && !fieldRules.showModuleTimingMode ? (
            <div className="flex flex-col gap-1">
              <TextField
                id="plan-duration-months"
                label="Duration (months)"
                type="number"
                min={1}
                value={durationMonths}
                disabled={isSubmitting}
                required
                error={durationMonthsError}
                onChange={(event) => {
                  setDurationMonths(event.target.value)
                  if (durationMonthsError) setDurationMonthsError(undefined)
                }}
              />
              {fieldRules.durationHelperText ? (
                <p className="text-label-sm text-on-surface-variant">
                  {fieldRules.durationHelperText}
                </p>
              ) : null}
            </div>
          ) : null}

          {fieldRules.showValidUntilDate && !fieldRules.showModuleTimingMode ? (
            <div className="flex flex-col gap-1">
              <TextField
                id="plan-valid-until"
                label="Valid Until"
                type="date"
                value={validUntilDate}
                disabled={isSubmitting}
                required
                error={validUntilDateError}
                onChange={(event) => {
                  setValidUntilDate(event.target.value)
                  if (validUntilDateError) setValidUntilDateError(undefined)
                }}
              />
              {fieldRules.validUntilHelperText ? (
                <p className="text-label-sm text-on-surface-variant">
                  {fieldRules.validUntilHelperText}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="plan-original-price"
              label="Original Price"
              type="number"
              min={0}
              value={originalPrice}
              disabled={isSubmitting}
              onChange={(event) => setOriginalPrice(event.target.value)}
            />
            <TextField
              id="plan-selling-price"
              label="Selling Price"
              type="number"
              min={0}
              value={sellingPrice}
              disabled={isSubmitting}
              required
              error={sellingPriceError}
              onChange={(event) => {
                setSellingPrice(event.target.value)
                if (sellingPriceError) setSellingPriceError(undefined)
              }}
            />
          </div>

          <TextField
            id="plan-badge"
            label="Badge"
            value={badge}
            disabled={isSubmitting}
            placeholder="Optional badge label"
            onChange={(event) => setBadge(event.target.value)}
          />

          <MultiSelectField
            id="plan-modules"
            label="Plan Modules"
            values={planModules}
            options={PLAN_MODULE_OPTIONS}
            disabled={isSubmitting}
            placeholder="Select modules"
            onChange={setPlanModules}
          />

          <PlanDescriptionList
            descriptions={descriptions}
            disabled={isSubmitting}
            onChange={setDescriptions}
          />

          <div className="flex items-center justify-between rounded-input border border-border-subtle bg-surface-container-low px-4 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold text-on-surface">
                Status
              </span>
              <span className="text-body-md text-on-surface-variant">
                {isActive ? 'Plan is active and visible' : 'Plan is inactive'}
              </span>
            </div>
            <ActiveToggle
              isActive={isActive}
              ariaLabel="Toggle plan active status"
              onChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
