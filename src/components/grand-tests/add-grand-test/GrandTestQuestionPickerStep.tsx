import { useEffect, useMemo, useState } from 'react'
import {
  fetchQbankChapterOptions,
  fetchQbankQuestionOptions,
  type QbankQuestionOption,
} from '@/lib/qbank-references'
import { fetchQbankSubjects } from '@/lib/qbank-subjects'
import type { QbankSubject } from '@/types/qbank-subject'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { GrandTestChapterQuestionList } from './GrandTestChapterQuestionList'
import { GrandTestCustomQuestionModal } from './GrandTestCustomQuestionModal'
import { SelectedQuestionsList } from './SelectedQuestionsList'

interface GrandTestQuestionPickerStepProps {
  duration: string
  selectedQuestions: SelectedGrandTestQuestion[]
  disabled?: boolean
  durationError?: string
  selectedQuestionsError?: string
  formError?: string
  layout?: 'modal' | 'page'
  onDurationChange: (value: string) => void
  onSelectedQuestionsChange: (questions: SelectedGrandTestQuestion[]) => void
  onClearFormError?: () => void
}

export function GrandTestQuestionPickerStep({
  duration,
  selectedQuestions,
  disabled = false,
  durationError,
  selectedQuestionsError,
  formError,
  layout = 'page',
  onDurationChange,
  onSelectedQuestionsChange,
  onClearFormError,
}: GrandTestQuestionPickerStepProps) {
  const [subjectRefId, setSubjectRefId] = useState('')
  const [chapterRefId, setChapterRefId] = useState('')
  const [pendingQuestionIds, setPendingQuestionIds] = useState<string[]>([])
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<QbankSubject[]>([])
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([])
  const [isCustomQuestionModalOpen, setIsCustomQuestionModalOpen] = useState(false)
  const [editingCustomQuestion, setEditingCustomQuestion] =
    useState<SelectedGrandTestQuestion | null>(null)
  const [chapterOptions, setChapterOptions] = useState<SelectOption[]>([])
  const [chapterQuestions, setChapterQuestions] = useState<QbankQuestionOption[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()

  const isFormDisabled = disabled || isLoadingSubjects

  const alreadyAddedIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.documentId)),
    [selectedQuestions],
  )

  useEffect(() => {
    let isCancelled = false

    async function loadSubjects() {
      setIsLoadingSubjects(true)
      setLoadError(undefined)

      try {
        const loadedSubjects = await fetchQbankSubjects()
        if (isCancelled) return

        setSubjects(loadedSubjects)
        setSubjectOptions(
          loadedSubjects.map((subject) => ({
            value: subject.id,
            label: subject.subjectName || subject.id,
          })),
        )
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load qbank subjects. Please try again.')
        }
      } finally {
        if (!isCancelled) setIsLoadingSubjects(false)
      }
    }

    loadSubjects()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!subjectRefId) {
      setChapterOptions([])
      setChapterRefId('')
      return
    }

    let isCancelled = false

    async function loadChapters() {
      setIsLoadingChapters(true)
      setLoadError(undefined)

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
          setLoadError('Failed to load chapters for the selected subject.')
        }
      } finally {
        if (!isCancelled) setIsLoadingChapters(false)
      }
    }

    loadChapters()

    return () => {
      isCancelled = true
    }
  }, [subjectRefId])

  useEffect(() => {
    if (!subjectRefId || !chapterRefId) {
      setChapterQuestions([])
      setPendingQuestionIds([])
      setExpandedDetailId(null)
      return
    }

    let isCancelled = false

    async function loadQuestions() {
      setIsLoadingQuestions(true)
      setLoadError(undefined)

      try {
        const questions = await fetchQbankQuestionOptions(subjectRefId, chapterRefId)
        if (isCancelled) return

        setChapterQuestions(questions)
        setPendingQuestionIds([])
        setExpandedDetailId(null)
      } catch {
        if (!isCancelled) {
          setLoadError('Failed to load questions for the selected chapter.')
        }
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false)
      }
    }

    loadQuestions()

    return () => {
      isCancelled = true
    }
  }, [subjectRefId, chapterRefId])

  const chapterSelectDisabled = useMemo(
    () => isFormDisabled || isLoadingChapters || !subjectRefId,
    [isFormDisabled, isLoadingChapters, subjectRefId],
  )

  const selectedSubject =
    subjects.find((subject) => subject.id === subjectRefId) ?? null
  const selectedSubjectLabel = selectedSubject?.subjectName || subjectRefId
  const selectedChapterLabel =
    chapterOptions.find((option) => option.value === chapterRefId)?.label ?? ''

  function handleOpenCustomQuestionModal() {
    if (!subjectRefId || !chapterRefId) return
    setEditingCustomQuestion(null)
    setIsCustomQuestionModalOpen(true)
    onClearFormError?.()
  }

  function handleCloseCustomQuestionModal() {
    setIsCustomQuestionModalOpen(false)
    setEditingCustomQuestion(null)
  }

  function handleAddCustomQuestion(question: SelectedGrandTestQuestion) {
    onSelectedQuestionsChange([...selectedQuestions, question])
    onClearFormError?.()
  }

  function handleEditCustomQuestion(documentId: string) {
    const question = selectedQuestions.find((item) => item.documentId === documentId)
    if (!question?.isCustom || !question.customDraft) return

    setEditingCustomQuestion(question)
    setIsCustomQuestionModalOpen(true)
    onClearFormError?.()
  }

  function handleSaveCustomQuestion(question: SelectedGrandTestQuestion) {
    onSelectedQuestionsChange(
      selectedQuestions.map((item) =>
        item.documentId === question.documentId ? question : item,
      ),
    )
    onClearFormError?.()
  }

  function handleToggleSelect(documentId: string) {
    if (alreadyAddedIds.has(documentId)) return

    setPendingQuestionIds((previous) =>
      previous.includes(documentId)
        ? previous.filter((id) => id !== documentId)
        : [...previous, documentId],
    )
    onClearFormError?.()
  }

  function handleToggleDetails(documentId: string) {
    setExpandedDetailId((previous) => (previous === documentId ? null : documentId))
  }

  function handleAddSelectedQuestions() {
    if (pendingQuestionIds.length === 0) return

    const existingIds = new Set(selectedQuestions.map((question) => question.documentId))
    const nextQuestions = [...selectedQuestions]

    for (const documentId of pendingQuestionIds) {
      if (existingIds.has(documentId)) continue

      const question = chapterQuestions.find((item) => item.documentId === documentId)
      if (!question) continue

      nextQuestions.push({
        documentId: question.documentId,
        questionRefId: question.questionRefId,
        label: question.label,
        questionText: question.questionText,
        subjectRefId,
        chapterRefId,
        subjectName: selectedSubjectLabel || subjectRefId,
        chapterName: selectedChapterLabel || chapterRefId,
        source: 'qbanks',
      })
      existingIds.add(documentId)
    }

    onSelectedQuestionsChange(nextQuestions)
    setPendingQuestionIds([])
    onClearFormError?.()
  }

  function handleRemoveQuestion(documentId: string) {
    onSelectedQuestionsChange(
      selectedQuestions.filter((question) => question.documentId !== documentId),
    )
    onClearFormError?.()
  }

  const listMaxHeightClass =
    layout === 'page' ? 'max-h-[min(32rem,60vh)]' : 'max-h-80'

  return (
    <div className="flex flex-col gap-gutter">
      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-gutter">
          <TextField
            id="grand-test-duration"
            label="Duration (minutes)"
            type="number"
            min={1}
            required
            value={duration}
            disabled={disabled}
            error={durationError}
            placeholder="e.g. 120"
            onChange={(event) => onDurationChange(event.target.value)}
          />

          <SelectField
            id="grand-test-subject"
            label="Subject"
            value={subjectRefId}
            options={subjectOptions}
            disabled={isFormDisabled}
            placeholder={isLoadingSubjects ? 'Loading subjects...' : 'Select a subject'}
            onChange={(value) => {
              setSubjectRefId(value)
              setChapterRefId('')
              setPendingQuestionIds([])
              setExpandedDetailId(null)
              onClearFormError?.()
            }}
          />

          <SelectField
            id="grand-test-chapter"
            label="Chapter"
            value={chapterRefId}
            options={chapterOptions}
            disabled={chapterSelectDisabled}
            placeholder={
              !subjectRefId
                ? 'Select a subject first'
                : isLoadingChapters
                  ? 'Loading chapters...'
                  : 'Select a chapter'
            }
            onChange={(value) => {
              setChapterRefId(value)
              setPendingQuestionIds([])
              setExpandedDetailId(null)
              onClearFormError?.()
            }}
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-label-sm font-semibold text-on-surface">
                Chapter questions
              </span>
              {chapterRefId ? (
                <span className="text-label-sm text-on-surface-variant">
                  {isLoadingQuestions
                    ? 'Loading...'
                    : `${pendingQuestionIds.length} checked · ${chapterQuestions.length} available`}
                </span>
              ) : null}
            </div>

            {!chapterRefId ? (
              <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
                Select a subject and chapter to browse questions with full details.
              </p>
            ) : isLoadingQuestions ? (
              <p className="rounded-xl border border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
                Loading questions...
              </p>
            ) : (
              <GrandTestChapterQuestionList
                questions={chapterQuestions}
                selectedIds={pendingQuestionIds}
                expandedDetailId={expandedDetailId}
                alreadyAddedIds={alreadyAddedIds}
                subjectRefId={subjectRefId}
                chapterRefId={chapterRefId}
                disabled={disabled}
                listMaxHeightClass={listMaxHeightClass}
                onToggleSelect={handleToggleSelect}
                onToggleDetails={handleToggleDetails}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || pendingQuestionIds.length === 0}
              onClick={handleAddSelectedQuestions}
              className="gap-2"
            >
              <MaterialIcon name="playlist_add" size={16} />
              Add {pendingQuestionIds.length > 0 ? `${pendingQuestionIds.length} ` : ''}selected
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !subjectRefId || !chapterRefId}
              onClick={handleOpenCustomQuestionModal}
              className="gap-2"
            >
              <MaterialIcon name="edit_note" size={16} />
              Add custom question
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-label-sm font-semibold text-on-surface">
              Selected questions
            </span>
            <span className="text-label-sm text-on-surface-variant">
              {selectedQuestions.length} selected
            </span>
          </div>
          <SelectedQuestionsList
            questions={selectedQuestions}
            disabled={disabled}
            listMaxHeightClass={listMaxHeightClass}
            onRemove={handleRemoveQuestion}
            onEditCustomQuestion={handleEditCustomQuestion}
          />
          {selectedQuestionsError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {selectedQuestionsError}
            </p>
          ) : null}
        </div>
      </div>

      {loadError || formError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {loadError ?? formError}
        </p>
      ) : null}

      {isCustomQuestionModalOpen &&
      (editingCustomQuestion || (subjectRefId && chapterRefId)) ? (
        <GrandTestCustomQuestionModal
          isOpen={isCustomQuestionModalOpen}
          subjectRefId={editingCustomQuestion?.subjectRefId ?? subjectRefId}
          chapterRefId={editingCustomQuestion?.chapterRefId ?? chapterRefId}
          subjectName={editingCustomQuestion?.subjectName ?? selectedSubjectLabel}
          chapterName={editingCustomQuestion?.chapterName ?? selectedChapterLabel}
          mcqMid={selectedSubject?.mcqMid ?? null}
          disabled={disabled}
          editingQuestion={editingCustomQuestion}
          onClose={handleCloseCustomQuestionModal}
          onAdd={handleAddCustomQuestion}
          onSave={handleSaveCustomQuestion}
        />
      ) : null}
    </div>
  )
}
