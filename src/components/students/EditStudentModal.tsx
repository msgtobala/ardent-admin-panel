import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACADEMIC_YEAR_OPTIONS } from '@/config/academic-years'
import { fetchActivePlans } from '@/lib/plans'
import {
  buildStudentPlanSnapshot,
  formatPlanOptionLabel,
} from '@/lib/student-plan-assignment'
import {
  canEditStudentEmail,
  canEditStudentPhone,
} from '@/lib/student-utils'
import { fetchStateOptions, stateOptionsToSelectOptions, type StateOption } from '@/lib/states'
import { fetchStudentById, updateStudent } from '@/lib/students'
import type { Plan } from '@/types/plan'
import type { StudentDetail } from '@/types/student'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface EditStudentModalProps {
  isOpen: boolean
  studentUid: string | null
  onClose: () => void
  onSaved: () => void
}

const NO_PLAN_VALUE = ''
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveStateSelectValue(value: string, states: StateOption[]): string {
  const trimmedValue = value.trim()
  if (!trimmedValue) return ''

  const byCode = states.find((state) => state.code === trimmedValue)
  if (byCode) return byCode.code

  const byName = states.find(
    (state) => state.name.toLowerCase() === trimmedValue.toLowerCase(),
  )
  if (byName) return byName.code

  return trimmedValue
}

function getInitialFormState(
  student: StudentDetail | null,
  states: StateOption[],
) {
  return {
    name: student?.name ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    state: resolveStateSelectValue(student?.state ?? '', states),
    collegeState: resolveStateSelectValue(
      student?.academicDetails.collegeState ?? '',
      states,
    ),
    collegeName: student?.academicDetails.collegeName ?? '',
    academicYear: student?.academicDetails.academicYear ?? '',
    selectedPlanId: student?.plans?.planId ?? NO_PLAN_VALUE,
  }
}

export function EditStudentModal({
  isOpen,
  studentUid,
  onClose,
  onSaved,
}: EditStudentModalProps) {
  const { showSnackbar } = useSnackbar()
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [collegeState, setCollegeState] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState(NO_PLAN_VALUE)
  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [loadError, setLoadError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const planSelectOptions = useMemo(
    () => [
      { value: NO_PLAN_VALUE, label: 'No plan assigned' },
      ...plans.map((plan) => ({
        value: plan.planId,
        label: formatPlanOptionLabel(plan),
      })),
    ],
    [plans],
  )

  const canEditEmail = student
    ? canEditStudentEmail(student.authenticationMethod)
    : false
  const canEditPhone = student
    ? canEditStudentPhone(student.authenticationMethod)
    : false

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
    if (!isOpen || !studentUid) {
      setStudent(null)
      setPlans([])
      setStateOptions([])
      setName('')
      setEmail('')
      setPhone('')
      setState('')
      setCollegeState('')
      setCollegeName('')
      setAcademicYear('')
      setSelectedPlanId(NO_PLAN_VALUE)
      setNameError(undefined)
      setEmailError(undefined)
      setFormError(undefined)
      setLoadError(undefined)
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    const uid = studentUid
    let isCancelled = false

    async function loadModalData() {
      setIsLoading(true)
      setLoadError(undefined)
      setFormError(undefined)
      setNameError(undefined)

      try {
        const [studentResult, planResults, stateResults] = await Promise.all([
          fetchStudentById(uid),
          fetchActivePlans(),
          fetchStateOptions(),
        ])

        if (isCancelled) return

        if (!studentResult) {
          setLoadError('Student not found. They may have been removed.')
          setStudent(null)
          return
        }

        const initial = getInitialFormState(studentResult, stateResults)
        setStudent(studentResult)
        setPlans(planResults)
        setStateOptions(stateOptionsToSelectOptions(stateResults))
        setName(initial.name)
        setEmail(initial.email)
        setPhone(initial.phone)
        setState(initial.state)
        setCollegeState(initial.collegeState)
        setCollegeName(initial.collegeName)
        setAcademicYear(initial.academicYear)
        setSelectedPlanId(initial.selectedPlanId)
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load student details. Please try again.')
          setStudent(null)
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadModalData()

    return () => {
      isCancelled = true
    }
  }, [isOpen, studentUid])

  function validate(): boolean {
    let valid = true

    if (!name.trim()) {
      setNameError('Name is required')
      valid = false
    } else {
      setNameError(undefined)
    }

    if (canEditEmail) {
      const trimmedEmail = email.trim()
      if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
        setEmailError('Enter a valid email address')
        valid = false
      } else {
        setEmailError(undefined)
      }
    }

    return valid
  }

  async function handleSave() {
    if (!studentUid || !student || !validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    const selectedPlan = plans.find((plan) => plan.planId === selectedPlanId)
    const nextPlans =
      selectedPlanId && selectedPlan
        ? buildStudentPlanSnapshot(selectedPlan, student.plans)
        : null

    try {
      await updateStudent(studentUid, {
        name,
        ...(canEditEmail ? { email } : {}),
        ...(canEditPhone ? { phone: phone.trim() || null } : {}),
        state,
        academicDetails: {
          collegeState,
          collegeName,
          academicYear,
        },
        plans: nextPlans,
      })

      showSnackbar('Student updated successfully')
      onSaved()
      onClose()
    } catch {
      const errorMessage = 'Failed to update student. Please try again.'
      showSnackbar(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !studentUid) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close edit student dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-student-modal-title" className="text-h3 text-on-surface">
              Edit Student
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Update profile details, academic information, and assigned plan
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
                key={`student-modal-skeleton-${index}`}
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
              handleSave()
            }}
            noValidate
          >
            <TextField
              id="student-name"
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
              id="student-email"
              label="Email"
              type="email"
              value={email}
              disabled={isSubmitting || !canEditEmail}
              error={emailError}
              placeholder={canEditEmail ? 'Enter email address' : undefined}
              onChange={(event) => {
                if (!canEditEmail) return
                setEmail(event.target.value)
                if (emailError) setEmailError(undefined)
              }}
            />

            <TextField
              id="student-phone"
              label="Phone"
              type="tel"
              value={phone}
              disabled={isSubmitting || !canEditPhone}
              placeholder={canEditPhone ? 'Enter phone number' : undefined}
              onChange={(event) => {
                if (!canEditPhone) return
                setPhone(event.target.value)
              }}
            />

            {stateOptions.length > 0 ? (
              <SelectField
                id="student-state"
                label="State"
                value={state}
                options={stateOptions}
                placeholder="Select state"
                disabled={isSubmitting}
                onChange={setState}
              />
            ) : (
              <TextField
                id="student-state"
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
                  id="student-college-state"
                  label="College State"
                  value={collegeState}
                  options={stateOptions}
                  placeholder="Select college state"
                  disabled={isSubmitting}
                  onChange={setCollegeState}
                />
              ) : (
                <TextField
                  id="student-college-state"
                  label="College State"
                  value={collegeState}
                  disabled={isSubmitting}
                  placeholder="Enter college state"
                  onChange={(event) => setCollegeState(event.target.value)}
                />
              )}

              <TextField
                id="student-college-name"
                label="College Name"
                value={collegeName}
                disabled={isSubmitting}
                placeholder="Enter college name"
                onChange={(event) => setCollegeName(event.target.value)}
              />

              <SelectField
                id="student-academic-year"
                label="Academic Year"
                value={academicYear}
                options={ACADEMIC_YEAR_OPTIONS}
                placeholder="Select academic year"
                disabled={isSubmitting}
                onChange={setAcademicYear}
              />
            </div>

            <SelectField
              id="student-plan"
              label="Plan"
              value={selectedPlanId}
              options={planSelectOptions}
              placeholder="Select a plan"
              disabled={isSubmitting || plans.length === 0}
              onChange={setSelectedPlanId}
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
            onClick={handleSave}
            disabled={isSubmitting || isLoading || !!loadError}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
