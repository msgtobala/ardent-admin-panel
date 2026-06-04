import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACADEMIC_YEAR_OPTIONS } from '@/config/academic-years'
import { createStudent } from '@/lib/create-student'
import { fetchActivePlans } from '@/lib/plans'
import { isFreePlan } from '@/lib/plan-utils'
import {
  buildCreateStudentPlanSnapshot,
  formatPlanOptionLabel,
} from '@/lib/student-plan-assignment'
import { fetchStateOptions, stateOptionsToSelectOptions } from '@/lib/states'
import type { Plan } from '@/types/plan'
import { StudentCollegeNameSelect } from '@/components/students/StudentCollegeNameSelect'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveDefaultPlanId(plans: Plan[]): string {
  const freePlan = plans.find(isFreePlan)
  return freePlan?.planId ?? plans[0]?.planId ?? ''
}

export function AddStudentModal({ isOpen, onClose, onSaved }: AddStudentModalProps) {
  const { showSnackbar } = useSnackbar()
  const [plans, setPlans] = useState<Plan[]>([])
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  const [collegeState, setCollegeState] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [planError, setPlanError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [loadError, setLoadError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const planSelectOptions = useMemo(
    () =>
      plans.map((plan) => ({
        value: plan.planId,
        label: formatPlanOptionLabel(plan),
      })),
    [plans],
  )

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

  useEffect(() => {
    if (!isOpen) {
      setPlans([])
      setStateOptions([])
      setName('')
      setEmail('')
      setState('')
      setCollegeState('')
      setCollegeName('')
      setAcademicYear('')
      setSelectedPlanId('')
      setNameError(undefined)
      setEmailError(undefined)
      setPlanError(undefined)
      setFormError(undefined)
      setLoadError(undefined)
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    let isCancelled = false

    async function loadFormOptions() {
      setIsLoading(true)
      setLoadError(undefined)
      setFormError(undefined)
      setNameError(undefined)
      setEmailError(undefined)
      setPlanError(undefined)

      try {
        const [planResults, stateResults] = await Promise.all([
          fetchActivePlans(),
          fetchStateOptions(),
        ])

        if (isCancelled) return

        setPlans(planResults)
        setStateOptions(stateOptionsToSelectOptions(stateResults))
        setSelectedPlanId(resolveDefaultPlanId(planResults))
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load form options. Please try again.')
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadFormOptions()

    return () => {
      isCancelled = true
    }
  }, [isOpen])

  function validate(): boolean {
    let valid = true

    if (!name.trim()) {
      setNameError('Name is required')
      valid = false
    } else {
      setNameError(undefined)
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError('Email is required')
      valid = false
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError('Enter a valid email address')
      valid = false
    } else {
      setEmailError(undefined)
    }

    if (!selectedPlanId || !plans.some((plan) => plan.planId === selectedPlanId)) {
      setPlanError('Select a plan')
      valid = false
    } else {
      setPlanError(undefined)
    }

    return valid
  }

  async function handleCreate() {
    if (!validate()) return

    const selectedPlan = plans.find((plan) => plan.planId === selectedPlanId)
    if (!selectedPlan) {
      setPlanError('Select a plan')
      return
    }

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      const result = await createStudent({
        name,
        email,
        state,
        academicDetails: {
          collegeState,
          collegeName,
          academicYear,
        },
        plans: buildCreateStudentPlanSnapshot(selectedPlan),
      })

      if (result.passwordResetEmailSent) {
        showSnackbar(
          `Student created. Password setup email sent to ${email.trim().toLowerCase()}.`,
        )
      } else {
        showSnackbar(
          'Student created. Password email could not be sent — ask them to use Forgot password in the app.',
        )
      }

      onSaved()
      onClose()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create student. Please try again.'
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
        aria-label="Close add student dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="add-student-modal-title" className="text-h3 text-on-surface">
              Add Student
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Create an account with email sign-in. The student receives a password setup
              email and is assigned the selected plan.
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

        {isLoading ? (
          <div className="flex flex-col gap-4 px-gutter py-gutter" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`add-student-skeleton-${index}`}
                className="h-[38px] animate-pulse rounded-input bg-surface-container"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="px-gutter py-gutter">
            <p className="text-body-md text-error-red" role="alert">
              {loadError}
            </p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter"
            onSubmit={(event) => {
              event.preventDefault()
              handleCreate()
            }}
            noValidate
          >
            <TextField
              id="add-student-name"
              label="Name"
              value={name}
              disabled={isSubmitting}
              required
              error={nameError}
              onChange={(event) => {
                setName(event.target.value)
                if (nameError) setNameError(undefined)
              }}
            />

            <TextField
              id="add-student-email"
              label="Email"
              type="email"
              value={email}
              disabled={isSubmitting}
              required
              error={emailError}
              placeholder="Enter email address"
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) setEmailError(undefined)
              }}
            />

            {stateOptions.length > 0 ? (
              <SelectField
                id="add-student-state"
                label="State"
                value={state}
                options={stateOptions}
                placeholder="Select state"
                disabled={isSubmitting}
                onChange={setState}
              />
            ) : (
              <TextField
                id="add-student-state"
                label="State"
                value={state}
                disabled={isSubmitting}
                placeholder="Enter state"
                onChange={(event) => setState(event.target.value)}
              />
            )}

            <div className="flex flex-col gap-gutter rounded-xl border border-border-subtle bg-surface px-4 py-4">
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Academic Details
              </p>

              {stateOptions.length > 0 ? (
                <SelectField
                  id="add-student-college-state"
                  label="College State"
                  value={collegeState}
                  options={stateOptions}
                  placeholder="Select college state"
                  disabled={isSubmitting}
                  onChange={(value) => {
                    setCollegeState(value)
                    setCollegeName('')
                  }}
                />
              ) : (
                <TextField
                  id="add-student-college-state"
                  label="College State"
                  value={collegeState}
                  disabled={isSubmitting}
                  placeholder="Enter college state"
                  onChange={(event) => {
                    setCollegeState(event.target.value)
                    setCollegeName('')
                  }}
                />
              )}

              <StudentCollegeNameSelect
                id="add-student-college-name"
                stateCode={collegeState}
                value={collegeName}
                disabled={isSubmitting}
                onChange={setCollegeName}
              />

              <SelectField
                id="add-student-academic-year"
                label="Academic Year"
                value={academicYear}
                options={ACADEMIC_YEAR_OPTIONS}
                placeholder="Select academic year"
                disabled={isSubmitting}
                onChange={setAcademicYear}
              />
            </div>

            <SelectField
              id="add-student-plan"
              label="Plan"
              value={selectedPlanId}
              options={planSelectOptions}
              placeholder="Select a plan"
              disabled={isSubmitting || plans.length === 0}
              error={planError}
              onChange={(value) => {
                setSelectedPlanId(value)
                if (planError) setPlanError(undefined)
              }}
            />

            {formError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {formError}
              </p>
            ) : null}
          </form>
        )}

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || isLoading || !!loadError || plans.length === 0}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Creating...' : 'Add Student'}
          </Button>
        </div>
      </div>
    </div>
  )
}
