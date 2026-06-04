import { useCallback, useEffect, useMemo, useState } from 'react'
import { upsertCurrentClinicalVignetteQuestion } from '@/lib/clinical-vignettes'
import {
  fetchQbankChapterOptions,
  fetchQbankQuestionOptions,
} from '@/lib/qbank-references'
import { fetchQbankSubjects } from '@/lib/qbank-subjects'
import type { ResolvedClinicalVignetteQuestion } from '@/types/clinical-vignette'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'

interface EditClinicalVignetteModalProps {
  isOpen: boolean
  question: ResolvedClinicalVignetteQuestion | null
  onClose: () => void
  onSaved: () => void
}

export function EditClinicalVignetteModal({
  isOpen,
  question,
  onClose,
  onSaved,
}: EditClinicalVignetteModalProps) {
  const { showSnackbar } = useSnackbar()
  const [subjectRefId, setSubjectRefId] = useState('')
  const [chapterRefId, setChapterRefId] = useState('')
  const [questionRefId, setQuestionRefId] = useState('')
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([])
  const [chapterOptions, setChapterOptions] = useState<SelectOption[]>([])
  const [questionOptions, setQuestionOptions] = useState<SelectOption[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [subjectError, setSubjectError] = useState<string | undefined>()
  const [chapterError, setChapterError] = useState<string | undefined>()
  const [questionError, setQuestionError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormDisabled = isSubmitting || isLoadingSubjects

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
      setSubjectRefId('')
      setChapterRefId('')
      setQuestionRefId('')
      setSubjectOptions([])
      setChapterOptions([])
      setQuestionOptions([])
      setSubjectError(undefined)
      setChapterError(undefined)
      setQuestionError(undefined)
      setFormError(undefined)
      setIsSubmitting(false)
      return
    }

    setSubjectRefId(question?.subjectRefId ?? '')
    setChapterRefId(question?.chapterRefId ?? '')
    setQuestionRefId(question?.questionRefId ?? '')
    setSubjectError(undefined)
    setChapterError(undefined)
    setQuestionError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)

    let isCancelled = false

    async function loadSubjects() {
      setIsLoadingSubjects(true)

      try {
        const subjects = await fetchQbankSubjects()
        if (isCancelled) return

        setSubjectOptions(
          subjects.map((subject) => ({
            value: subject.id,
            label: subject.subjectName || subject.id,
          })),
        )
      } catch {
        if (!isCancelled) {
          setFormError('Failed to load qbank subjects. Please try again.')
        }
      } finally {
        if (!isCancelled) setIsLoadingSubjects(false)
      }
    }

    loadSubjects()

    return () => {
      isCancelled = true
    }
  }, [isOpen, question])

  useEffect(() => {
    if (!isOpen || !subjectRefId) {
      setChapterOptions([])
      if (!subjectRefId) setChapterRefId('')
      return
    }

    let isCancelled = false

    async function loadChapters() {
      setIsLoadingChapters(true)

      try {
        const chapters = await fetchQbankChapterOptions(subjectRefId)
        if (isCancelled) return

        setChapterOptions(
          chapters.map((chapter) => ({
            value: chapter.id,
            label: chapter.chapterName,
          })),
        )
      } catch {
        if (!isCancelled) {
          setFormError('Failed to load chapters for the selected subject.')
        }
      } finally {
        if (!isCancelled) setIsLoadingChapters(false)
      }
    }

    loadChapters()

    return () => {
      isCancelled = true
    }
  }, [isOpen, subjectRefId])

  useEffect(() => {
    if (!isOpen || !subjectRefId || !chapterRefId) {
      setQuestionOptions([])
      if (!chapterRefId) setQuestionRefId('')
      return
    }

    let isCancelled = false

    async function loadQuestions() {
      setIsLoadingQuestions(true)

      try {
        const questions = await fetchQbankQuestionOptions(subjectRefId, chapterRefId)
        if (isCancelled) return

        setQuestionOptions(
          questions.map((item) => ({
            value: item.questionRefId,
            label: item.label,
          })),
        )
      } catch {
        if (!isCancelled) {
          setFormError('Failed to load questions for the selected chapter.')
        }
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false)
      }
    }

    loadQuestions()

    return () => {
      isCancelled = true
    }
  }, [isOpen, subjectRefId, chapterRefId])

  const chapterSelectDisabled = useMemo(
    () => isFormDisabled || isLoadingChapters || !subjectRefId,
    [isFormDisabled, isLoadingChapters, subjectRefId],
  )

  const questionSelectDisabled = useMemo(
    () => isFormDisabled || isLoadingQuestions || !chapterRefId,
    [isFormDisabled, isLoadingQuestions, chapterRefId],
  )

  function validate(): boolean {
    let valid = true

    if (!subjectRefId) {
      setSubjectError('Subject is required')
      valid = false
    } else {
      setSubjectError(undefined)
    }

    if (!chapterRefId) {
      setChapterError('Chapter is required')
      valid = false
    } else {
      setChapterError(undefined)
    }

    if (!questionRefId) {
      setQuestionError('Question is required')
      valid = false
    } else {
      setQuestionError(undefined)
    }

    return valid
  }

  async function handleSave() {
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      await upsertCurrentClinicalVignetteQuestion({
        subjectRefId,
        chapterRefId,
        questionRefId,
      })

      showSnackbar("Today's clinical vignette question updated successfully")
      onSaved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update today's question. Please try again."
      showSnackbar(message)
      setFormError(message)
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
        aria-label="Close edit clinical vignette dialog"
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-clinical-vignette-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-clinical-vignette-modal-title" className="text-h3 text-on-surface">
              Edit Today&apos;s Question
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Select a qbank subject, chapter, and question for today&apos;s vignette
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
          <SelectField
            id="clinical-vignette-subject"
            label="Subject"
            value={subjectRefId}
            options={subjectOptions}
            disabled={isFormDisabled}
            required
            error={subjectError}
            placeholder={isLoadingSubjects ? 'Loading subjects...' : 'Select subject'}
            onChange={(value) => {
              setSubjectRefId(value)
              setChapterRefId('')
              setQuestionRefId('')
              if (subjectError) setSubjectError(undefined)
            }}
          />

          <SelectField
            id="clinical-vignette-chapter"
            label="Chapter"
            value={chapterRefId}
            options={chapterOptions}
            disabled={chapterSelectDisabled}
            required
            error={chapterError}
            placeholder={
              !subjectRefId
                ? 'Select a subject first'
                : isLoadingChapters
                  ? 'Loading chapters...'
                  : 'Select chapter'
            }
            onChange={(value) => {
              setChapterRefId(value)
              setQuestionRefId('')
              if (chapterError) setChapterError(undefined)
            }}
          />

          <SelectField
            id="clinical-vignette-question"
            label="Question"
            value={questionRefId}
            options={questionOptions}
            disabled={questionSelectDisabled}
            required
            error={questionError}
            placeholder={
              !chapterRefId
                ? 'Select a chapter first'
                : isLoadingQuestions
                  ? 'Loading questions...'
                  : 'Select question'
            }
            onChange={(value) => {
              setQuestionRefId(value)
              if (questionError) setQuestionError(undefined)
            }}
          />

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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
