import { useMemo, useState } from 'react'
import { createGrandTest } from '@/lib/grand-test-create'
import { updateGrandTest } from '@/lib/grand-test-edit'
import { fromDatetimeLocalValue } from '@/lib/format-date'
import type {
  GrandTestEditFormData,
  GrandTestFormStep,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { GrandTestStepIndicator } from './GrandTestStepIndicator'
import { GrandTestBasicDetailsStep } from './add-grand-test/GrandTestBasicDetailsStep'
import { GrandTestPreviewStep } from './add-grand-test/GrandTestPreviewStep'
import { GrandTestQuestionPickerStep } from './add-grand-test/GrandTestQuestionPickerStep'

type GrandTestFormMode = 'add' | 'edit'

interface GrandTestFormProps {
  mode: GrandTestFormMode
  testId?: string
  initialData?: GrandTestEditFormData
  onCancel: () => void
  onSaved: () => void
}

const emptyFormState = {
  title: '',
  testStartValue: '',
  testExpiryValue: '',
  isFree: false,
  isActive: true,
  correctMark: '1',
  negativeMark: '-1',
  duration: '',
  questions: '',
  selectedQuestions: [] as SelectedGrandTestQuestion[],
}

function resolveInitialState(initialData?: GrandTestEditFormData) {
  if (!initialData) return emptyFormState

  return {
    title: initialData.title,
    testStartValue: initialData.testStartValue,
    testExpiryValue: initialData.testExpiryValue,
    isFree: initialData.isFree,
    isActive: initialData.isActive,
    correctMark: initialData.correctMark,
    negativeMark: initialData.negativeMark,
    duration: initialData.duration,
    questions: initialData.questions,
    selectedQuestions: initialData.selectedQuestions,
  }
}

export function GrandTestForm({
  mode,
  testId,
  initialData,
  onCancel,
  onSaved,
}: GrandTestFormProps) {
  const { showSnackbar } = useSnackbar()
  const initialState = resolveInitialState(initialData)
  const [currentStep, setCurrentStep] = useState<GrandTestFormStep>(1)
  const [title, setTitle] = useState(initialState.title)
  const [testStartValue, setTestStartValue] = useState(initialState.testStartValue)
  const [testExpiryValue, setTestExpiryValue] = useState(initialState.testExpiryValue)
  const [isFree, setIsFree] = useState(initialState.isFree)
  const [isActive, setIsActive] = useState(initialState.isActive)
  const [correctMark, setCorrectMark] = useState(initialState.correctMark)
  const [negativeMark, setNegativeMark] = useState(initialState.negativeMark)
  const [duration, setDuration] = useState(initialState.duration)
  const [questions, setQuestions] = useState(initialState.questions)
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedGrandTestQuestion[]>(
    initialState.selectedQuestions,
  )
  const [titleError, setTitleError] = useState<string | undefined>()
  const [testStartError, setTestStartError] = useState<string | undefined>()
  const [testExpiryError, setTestExpiryError] = useState<string | undefined>()
  const [correctMarkError, setCorrectMarkError] = useState<string | undefined>()
  const [negativeMarkError, setNegativeMarkError] = useState<string | undefined>()
  const [durationError, setDurationError] = useState<string | undefined>()
  const [questionsError, setQuestionsError] = useState<string | undefined>()
  const [selectedQuestionsError, setSelectedQuestionsError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedTestStart = useMemo(
    () => fromDatetimeLocalValue(testStartValue),
    [testStartValue],
  )
  const parsedTestExpiry = useMemo(
    () => fromDatetimeLocalValue(testExpiryValue),
    [testExpiryValue],
  )
  const parsedDuration = useMemo(() => Number(duration), [duration])
  const parsedQuestions = useMemo(() => Number(questions), [questions])
  const parsedCorrectMark = useMemo(() => Number(correctMark), [correctMark])
  const parsedNegativeMark = useMemo(() => Number(negativeMark), [negativeMark])

  const saveLabel = mode === 'edit' ? 'Update' : 'Save'
  const savingLabel = mode === 'edit' ? 'Updating...' : 'Saving...'

  function validateStep1(): boolean {
    let valid = true
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setTitleError('Test name is required')
      valid = false
    } else {
      setTitleError(undefined)
    }

    if (!testStartValue.trim()) {
      setTestStartError('Start date and time are required')
      valid = false
    } else if (!parsedTestStart) {
      setTestStartError('Enter a valid start date and time')
      valid = false
    } else {
      setTestStartError(undefined)
    }

    if (!testExpiryValue.trim()) {
      setTestExpiryError('End date and time are required')
      valid = false
    } else if (!parsedTestExpiry) {
      setTestExpiryError('Enter a valid end date and time')
      valid = false
    } else {
      setTestExpiryError(undefined)
    }

    if (
      parsedTestStart &&
      parsedTestExpiry &&
      parsedTestExpiry.getTime() <= parsedTestStart.getTime()
    ) {
      setTestExpiryError('End date and time must be after the start date and time')
      valid = false
    }

    if (!correctMark.trim() || Number.isNaN(parsedCorrectMark)) {
      setCorrectMarkError('Correct mark must be a valid number')
      valid = false
    } else {
      setCorrectMarkError(undefined)
    }

    if (!negativeMark.trim() || Number.isNaN(parsedNegativeMark)) {
      setNegativeMarkError('Negative mark must be a valid number')
      valid = false
    } else {
      setNegativeMarkError(undefined)
    }

    return valid
  }

  function validateStep2(): boolean {
    let valid = true

    if (!duration.trim() || Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      setDurationError('Duration must be greater than 0')
      valid = false
    } else {
      setDurationError(undefined)
    }

    if (!questions.trim() || Number.isNaN(parsedQuestions) || parsedQuestions <= 0) {
      setQuestionsError('Number of questions must be greater than 0')
      valid = false
    } else if (parsedQuestions !== selectedQuestions.length) {
      setQuestionsError(
        `Number of questions (${parsedQuestions}) must match selected questions (${selectedQuestions.length})`,
      )
      valid = false
    } else {
      setQuestionsError(undefined)
    }

    if (selectedQuestions.length === 0) {
      setSelectedQuestionsError('Add at least one question to the test')
      valid = false
    } else {
      setSelectedQuestionsError(undefined)
    }

    return valid
  }

  function handleNext() {
    setFormError(undefined)

    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 2 && !validateStep2()) return

    if (currentStep < 3) {
      setCurrentStep((step) => (step + 1) as GrandTestFormStep)
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((step) => (step - 1) as GrandTestFormStep)
    }
  }

  function handleCancel() {
    if (isSubmitting) return
    onCancel()
  }

  async function handleSave() {
    if (!validateStep1() || !validateStep2()) {
      setCurrentStep(validateStep1() ? 2 : 1)
      return
    }

    if (!parsedTestStart || !parsedTestExpiry) return

    if (mode === 'edit' && !testId) {
      setFormError('Test id is missing')
      return
    }

    setFormError(undefined)
    setIsSubmitting(true)

    const payload = {
      title: title.trim(),
      testStart: parsedTestStart,
      testExpiry: parsedTestExpiry,
      duration: parsedDuration,
      questions: parsedQuestions,
      correctMark: parsedCorrectMark,
      negativeMark: parsedNegativeMark,
      isFree,
      isActive,
      selectedQuestions,
    }

    try {
      if (mode === 'edit') {
        await updateGrandTest(testId!, payload)
        showSnackbar('Grand test updated successfully')
      } else {
        await createGrandTest(payload)
        showSnackbar('Grand test created successfully')
      }

      onSaved()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : mode === 'edit'
            ? 'Failed to update grand test. Please try again.'
            : 'Failed to create grand test. Please try again.'
      showSnackbar(message)
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
      <GrandTestStepIndicator currentStep={currentStep} />

      <div className="flex flex-col gap-gutter px-gutter py-gutter">
        {currentStep === 1 ? (
          <div className="mx-auto w-full max-w-3xl">
            <GrandTestBasicDetailsStep
              title={title}
              testStartValue={testStartValue}
              testExpiryValue={testExpiryValue}
              isFree={isFree}
              isActive={isActive}
              correctMark={correctMark}
              negativeMark={negativeMark}
              disabled={isSubmitting}
              titleError={titleError}
              testStartError={testStartError}
              testExpiryError={testExpiryError}
              correctMarkError={correctMarkError}
              negativeMarkError={negativeMarkError}
              onTitleChange={(value) => {
                setTitle(value)
                if (titleError) setTitleError(undefined)
              }}
              onTestStartChange={(value) => {
                setTestStartValue(value)
                if (testStartError) setTestStartError(undefined)
              }}
              onTestExpiryChange={(value) => {
                setTestExpiryValue(value)
                if (testExpiryError) setTestExpiryError(undefined)
              }}
              onIsFreeChange={setIsFree}
              onIsActiveChange={setIsActive}
              onCorrectMarkChange={(value) => {
                setCorrectMark(value)
                if (correctMarkError) setCorrectMarkError(undefined)
              }}
              onNegativeMarkChange={(value) => {
                setNegativeMark(value)
                if (negativeMarkError) setNegativeMarkError(undefined)
              }}
            />
          </div>
        ) : null}

        {currentStep === 2 ? (
          <GrandTestQuestionPickerStep
            duration={duration}
            questions={questions}
            selectedQuestions={selectedQuestions}
            disabled={isSubmitting}
            durationError={durationError}
            questionsError={questionsError}
            selectedQuestionsError={selectedQuestionsError}
            formError={formError}
            layout="page"
            onDurationChange={(value) => {
              setDuration(value)
              if (durationError) setDurationError(undefined)
            }}
            onQuestionsChange={(value) => {
              setQuestions(value)
              if (questionsError) setQuestionsError(undefined)
            }}
            onSelectedQuestionsChange={setSelectedQuestions}
            onClearFormError={() => setFormError(undefined)}
          />
        ) : null}

        {currentStep === 3 ? (
          <div className="mx-auto w-full max-w-4xl">
            <GrandTestPreviewStep
              title={title.trim()}
              testStart={parsedTestStart}
              testExpiry={parsedTestExpiry}
              duration={parsedDuration}
              questionsCount={parsedQuestions}
              isFree={isFree}
              isActive={isActive}
              correctMark={parsedCorrectMark}
              negativeMark={parsedNegativeMark}
              selectedQuestions={selectedQuestions}
            />
          </div>
        ) : null}

        {formError && currentStep === 3 ? (
          <p className="text-label-sm text-error-red" role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-container-low px-gutter py-4">
        <div>
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? savingLabel : saveLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
