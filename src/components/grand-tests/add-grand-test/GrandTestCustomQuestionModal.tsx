import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { QbankCorrectAnswerImagesUpload } from '@/components/qbank-questions/QbankCorrectAnswerImagesUpload'
import { QbankQuestionImageUpload } from '@/components/qbank-questions/QbankQuestionImageUpload'
import {
  createPendingCustomQuestionId,
  resolveSelectedQuestionSource,
} from '@/lib/grand-test-custom-question'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { resolveNextCustomQbankQuestionIdentity } from '@/lib/qbank-question-id'
import type { QbankAnswerOption } from '@/types/qbank-question'
import type {
  GrandTestCustomQuestionDraft,
  GrandTestCustomQuestionPendingImage,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface GrandTestCustomQuestionModalProps {
  isOpen: boolean
  subjectRefId: string
  chapterRefId: string
  subjectName: string
  chapterName: string
  moduleName: string
  mcqMid: number | null
  disabled?: boolean
  editingQuestion?: SelectedGrandTestQuestion | null
  onClose: () => void
  onAdd: (question: SelectedGrandTestQuestion) => void
  onSave?: (question: SelectedGrandTestQuestion) => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70 disabled:shadow-none'

function defaultAnswerOptions(): QbankAnswerOption[] {
  return [
    { option: 'A', choice: '', sortOrder: 0 },
    { option: 'B', choice: '', sortOrder: 1 },
    { option: 'C', choice: '', sortOrder: 2 },
    { option: 'D', choice: '', sortOrder: 3 },
  ]
}

function buildQuestionLabel(questionRefId: string, questionText: string): string {
  const truncated =
    questionText.length > 80 ? `${questionText.slice(0, 80)}…` : questionText
  return `${questionRefId} — ${truncated}`
}

function revokePreviewUrlIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function GrandTestCustomQuestionModal({
  isOpen,
  subjectRefId,
  chapterRefId,
  subjectName,
  chapterName,
  moduleName,
  mcqMid,
  disabled = false,
  editingQuestion = null,
  onClose,
  onAdd,
  onSave,
}: GrandTestCustomQuestionModalProps) {
  const isEditMode = editingQuestion != null
  const editingSource = editingQuestion
    ? resolveSelectedQuestionSource(editingQuestion)
    : 'custom'
  const isEditingQbankQuestion = isEditMode && editingSource === 'qbanks'
  const initializedModalKeyRef = useRef<string | null>(null)

  const [questionText, setQuestionText] = useState('')
  const [answerOptions, setAnswerOptions] = useState<QbankAnswerOption[]>(defaultAnswerOptions)
  const [correctOptionKey, setCorrectOptionKey] = useState('')
  const [correctDescription, setCorrectDescription] = useState('')
  const [referenceBookName, setReferenceBookName] = useState('')
  const [referencePageNo, setReferencePageNo] = useState('')
  const [referenceChapter, setReferenceChapter] = useState('')
  const [proposedQuestionId, setProposedQuestionId] = useState('')
  const [syncWithQbank, setSyncWithQbank] = useState(true)
  const [questionTextError, setQuestionTextError] = useState<string | undefined>()
  const [answerOptionsError, setAnswerOptionsError] = useState<string | undefined>()
  const [correctOptionError, setCorrectOptionError] = useState<string | undefined>()
  const [proposalError, setProposalError] = useState<string | undefined>()
  const [isLoadingProposal, setIsLoadingProposal] = useState(false)
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null)
  const [questionImagePreviewUrl, setQuestionImagePreviewUrl] = useState<string | null>(null)
  const [persistedQuestionImage, setPersistedQuestionImage] = useState<string | null>(null)
  const [persistedCorrectAnswerImages, setPersistedCorrectAnswerImages] = useState<string[]>([])
  const [pendingCorrectAnswerImages, setPendingCorrectAnswerImages] = useState<
    GrandTestCustomQuestionPendingImage[]
  >([])
  const [removedStorageImageUrls, setRemovedStorageImageUrls] = useState<string[]>([])
  const [removedCorrectAnswerSlotIndices, setRemovedCorrectAnswerSlotIndices] = useState<
    number[]
  >([])
  const initialCorrectAnswerImageUrlsRef = useRef<string[]>([])

  const correctOptionSelectOptions = useMemo(
    () =>
      answerOptions.map((answerOption) => ({
        value: answerOption.option,
        label: `Option ${answerOption.option}`,
      })),
    [answerOptions],
  )

  const questionImageDisplayUrl = questionImagePreviewUrl ?? persistedQuestionImage

  const markImageForRemoval = useCallback((imageUrl: string | null | undefined) => {
    const trimmed = imageUrl?.trim()
    if (!trimmed || trimmed.startsWith('blob:')) return

    setRemovedStorageImageUrls((previous) =>
      previous.includes(trimmed) ? previous : [...previous, trimmed],
    )
  }, [])

  const clearFormFields = useCallback(() => {
    setQuestionText('')
    setAnswerOptions(defaultAnswerOptions())
    setCorrectOptionKey('')
    setCorrectDescription('')
    setReferenceBookName('')
    setReferencePageNo('')
    setReferenceChapter('')
    setProposedQuestionId('')
    setSyncWithQbank(true)
    setQuestionTextError(undefined)
    setAnswerOptionsError(undefined)
    setCorrectOptionError(undefined)
    setProposalError(undefined)
    setQuestionImageFile(null)
    setPersistedQuestionImage(null)
    setPersistedCorrectAnswerImages([])
    setRemovedStorageImageUrls([])
    setRemovedCorrectAnswerSlotIndices([])
    initialCorrectAnswerImageUrlsRef.current = []
    setQuestionImagePreviewUrl(null)
    setPendingCorrectAnswerImages([])
  }, [])

  const resetForm = useCallback(() => {
    setQuestionImagePreviewUrl((previous) => {
      revokePreviewUrlIfBlob(previous)
      return null
    })
    setPendingCorrectAnswerImages((previous) => {
      for (const pendingImage of previous) {
        revokePreviewUrlIfBlob(pendingImage.previewUrl)
      }
      return []
    })
    clearFormFields()
  }, [clearFormFields])

  const clearFormAfterSave = useCallback(() => {
    clearFormFields()
  }, [clearFormFields])

  const populateFromEditingQuestion = useCallback(
    (question: SelectedGrandTestQuestion) => {
      const draft = question.customDraft
      if (!draft) return

      setQuestionText(draft.question)
      setAnswerOptions(
        draft.answerOptions.length > 0 ? draft.answerOptions : defaultAnswerOptions(),
      )
      setCorrectOptionKey(draft.correctOptionKey)
      setCorrectDescription(draft.correctDescription)
      setReferenceBookName(draft.reference.bookName)
      setReferencePageNo(draft.reference.pageNo)
      setReferenceChapter(draft.reference.chapter)
      setProposedQuestionId(question.questionRefId)
      setSyncWithQbank(
        resolveSelectedQuestionSource(question) === 'qbanks'
          ? question.syncWithQbank !== false
          : true,
      )
      setPersistedQuestionImage(draft.questionImage)
      setPersistedCorrectAnswerImages([...draft.correctAnswerImages])
      initialCorrectAnswerImageUrlsRef.current = [...draft.correctAnswerImages]
      setRemovedStorageImageUrls([...(draft.removedStorageImageUrls ?? [])])
      setRemovedCorrectAnswerSlotIndices([
        ...(draft.removedCorrectAnswerSlotIndices ?? []),
      ])
      setQuestionImageFile(null)
      setQuestionImagePreviewUrl(null)
      setPendingCorrectAnswerImages([])
    },
    [],
  )

  const handleClose = useCallback(() => {
    if (disabled) return
    resetForm()
    onClose()
  }, [disabled, onClose, resetForm])

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
  }, [handleClose, isOpen])

  useEffect(() => {
    if (!isOpen) {
      initializedModalKeyRef.current = null
      return
    }

    const modalKey = editingQuestion?.documentId ?? '__add__'
    if (initializedModalKeyRef.current === modalKey) return
    initializedModalKeyRef.current = modalKey

    if (editingQuestion) {
      populateFromEditingQuestion(editingQuestion)
      return
    }

    resetForm()
  }, [editingQuestion, isOpen, populateFromEditingQuestion, resetForm])

  useEffect(() => {
    if (!isOpen || isEditMode) return

    let isCancelled = false

    async function loadProposal() {
      setIsLoadingProposal(true)
      setProposalError(undefined)

      try {
        const identity = await resolveNextCustomQbankQuestionIdentity({
          subjectId: subjectRefId,
          chapterId: chapterRefId,
          mcqMid,
          subjectName,
          chapterName,
        })

        if (!isCancelled) {
          setProposedQuestionId(identity.questionId)
        }
      } catch (error) {
        if (!isCancelled) {
          const details = getFirestoreErrorDetails(
            error,
            'Failed to generate question ID. Please try again.',
          )
          setProposalError(details.message)
        }
      } finally {
        if (!isCancelled) setIsLoadingProposal(false)
      }
    }

    void loadProposal()

    return () => {
      isCancelled = true
    }
  }, [chapterName, chapterRefId, isEditMode, isOpen, mcqMid, subjectName, subjectRefId])

  function handleAnswerOptionChange(index: number, value: string) {
    setAnswerOptions((previous) =>
      previous.map((answerOption, optionIndex) =>
        optionIndex === index ? { ...answerOption, choice: value } : answerOption,
      ),
    )
    if (answerOptionsError) setAnswerOptionsError(undefined)
  }

  function validate(): boolean {
    let valid = true
    const trimmedQuestion = questionText.trim()

    if (!trimmedQuestion) {
      setQuestionTextError('Question text is required')
      valid = false
    } else {
      setQuestionTextError(undefined)
    }

    const filledOptions = answerOptions.filter((answerOption) => answerOption.choice.trim())
    if (filledOptions.length < 2) {
      setAnswerOptionsError('Enter at least two answer options')
      valid = false
    } else {
      setAnswerOptionsError(undefined)
    }

    if (!correctOptionKey.trim()) {
      setCorrectOptionError('Select the correct answer')
      valid = false
    } else {
      setCorrectOptionError(undefined)
    }

    return valid
  }

  function buildDraft(): GrandTestCustomQuestionDraft {
    const normalizedOptions = answerOptions
      .map((answerOption, index) => ({
        option: answerOption.option,
        choice: answerOption.choice.trim(),
        sortOrder: index,
      }))
      .filter((answerOption) => answerOption.choice.length > 0)

    return {
      question: questionText.trim(),
      answerOptions: normalizedOptions,
      correctOptionKey,
      correctDescription: correctDescription.trim(),
      reference: {
        bookName: referenceBookName.trim(),
        pageNo: referencePageNo.trim(),
        chapter: referenceChapter.trim(),
      },
      questionImage: persistedQuestionImage,
      correctAnswerImages: [...persistedCorrectAnswerImages],
      pendingQuestionImageFile: questionImageFile,
      pendingQuestionImagePreviewUrl: questionImagePreviewUrl,
      pendingCorrectAnswerImages,
      ...(isEditMode && removedStorageImageUrls.length > 0
        ? { removedStorageImageUrls: [...removedStorageImageUrls] }
        : {}),
      ...(isEditMode && removedCorrectAnswerSlotIndices.length > 0
        ? { removedCorrectAnswerSlotIndices: [...removedCorrectAnswerSlotIndices] }
        : {}),
    }
  }

  function handleSubmit() {
    if (!validate()) return

    const draft = buildDraft()

    if (isEditMode && editingQuestion && onSave) {
      const source = resolveSelectedQuestionSource(editingQuestion)
      const nextSyncWithQbank = source === 'qbanks' ? syncWithQbank : undefined

      if (source === 'qbanks' && nextSyncWithQbank) {
        const confirmed = window.confirm(
          'Sync is on. Saving will update this grand test copy and the master question bank record. Continue?',
        )
        if (!confirmed) return
      }

      onSave({
        ...editingQuestion,
        label: buildQuestionLabel(editingQuestion.questionRefId, draft.question),
        questionText: draft.question,
        source,
        isCustom: source === 'custom',
        customDraft: draft,
        hasLocalEdits: true,
        ...(typeof nextSyncWithQbank === 'boolean'
          ? { syncWithQbank: nextSyncWithQbank }
          : {}),
      })
      clearFormAfterSave()
      onClose()
      return
    }

    const pendingId = createPendingCustomQuestionId()
    const previewId = proposedQuestionId || 'Custom question'

    onAdd({
      documentId: pendingId,
      questionRefId: previewId,
      label: buildQuestionLabel(previewId, draft.question),
      questionText: draft.question,
      subjectRefId,
      chapterRefId,
      subjectName,
      chapterName,
      moduleName,
      source: 'custom',
      isCustom: true,
      customDraft: draft,
    })

    clearFormAfterSave()
    onClose()
  }

  if (!isOpen) return null

  const dialogTitle = isEditMode
    ? isEditingQbankQuestion
      ? 'Edit question'
      : 'Edit custom question'
    : 'Add custom question'
  const submitLabel = isEditMode ? 'Save changes' : 'Add to test'
  const submitIcon = isEditMode ? 'save' : 'add'
  const isSubmitDisabled =
    disabled || (!isEditMode && (isLoadingProposal || Boolean(proposalError)))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={`Close ${dialogTitle.toLowerCase()} dialog`}
        className="absolute inset-0 cursor-default bg-overlay-scrim"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grand-test-custom-question-title"
        className="relative flex max-h-[min(90vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-gutter py-4">
          <div className="flex flex-col gap-1">
            <h2 id="grand-test-custom-question-title" className="text-card-title text-on-surface">
              {dialogTitle}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {subjectName} · {chapterName}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {isEditMode
                ? `Question ID: ${editingQuestion?.questionRefId ?? '—'}`
                : isLoadingProposal
                  ? 'Generating question ID...'
                  : proposedQuestionId
                    ? `Question ID: ${proposedQuestionId}`
                    : 'Question ID unavailable'}
            </p>
            {proposalError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {proposalError}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={disabled}
            className="cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-gutter overflow-y-auto px-gutter py-gutter">
          {isEditingQbankQuestion ? (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border-subtle bg-surface-container-low px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-label-sm font-semibold text-on-surface">
                  Sync with question bank
                </p>
                <p className="text-body-md text-on-surface-variant">
                  On by default. Turn off to update only this grand test copy.
                </p>
              </div>
              <ActiveToggle
                isActive={syncWithQbank}
                disabled={disabled}
                ariaLabel="Sync edits with master question bank"
                onChange={setSyncWithQbank}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="grand-test-custom-question-text" className="text-label-sm font-semibold text-on-surface">
              Question <span className="text-error-red">*</span>
            </label>
            <textarea
              id="grand-test-custom-question-text"
              value={questionText}
              disabled={disabled}
              placeholder="Enter the question text"
              className={textareaClasses}
              onChange={(event) => {
                setQuestionText(event.target.value)
                if (questionTextError) setQuestionTextError(undefined)
              }}
            />
            {questionTextError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {questionTextError}
              </p>
            ) : null}
          </div>

          <QbankQuestionImageUpload
            file={questionImageFile}
            previewUrl={questionImageDisplayUrl}
            disabled={disabled}
            onFileChange={(file, previewUrl) => {
              setQuestionImagePreviewUrl((previous) => {
                revokePreviewUrlIfBlob(previous)
                return previewUrl
              })
              setQuestionImageFile(file)
              if (file) {
                if (isEditMode) {
                  markImageForRemoval(persistedQuestionImage)
                }
                setPersistedQuestionImage(null)
              }
            }}
            onRemove={() => {
              if (isEditMode) {
                markImageForRemoval(persistedQuestionImage)
              }
              setQuestionImagePreviewUrl((previous) => {
                revokePreviewUrlIfBlob(previous)
                return null
              })
              setQuestionImageFile(null)
              setPersistedQuestionImage(null)
            }}
          />

          <div className="flex flex-col gap-3">
            <span className="text-label-sm font-semibold text-on-surface">
              Answer options <span className="text-error-red">*</span>
            </span>
            {answerOptions.map((answerOption, index) => (
              <TextField
                key={answerOption.option}
                id={`grand-test-custom-option-${answerOption.option}`}
                label={`Option ${answerOption.option}`}
                value={answerOption.choice}
                disabled={disabled}
                placeholder={`Enter option ${answerOption.option}`}
                onChange={(event) => handleAnswerOptionChange(index, event.target.value)}
              />
            ))}
            {answerOptionsError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {answerOptionsError}
              </p>
            ) : null}
          </div>

          <SelectField
            id="grand-test-custom-correct-option"
            label="Correct answer"
            required
            value={correctOptionKey}
            options={correctOptionSelectOptions}
            disabled={disabled}
            placeholder="Select correct option"
            error={correctOptionError}
            onChange={(value) => {
              setCorrectOptionKey(value)
              if (correctOptionError) setCorrectOptionError(undefined)
            }}
          />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="grand-test-custom-correct-description"
              className="text-label-sm font-semibold text-on-surface"
            >
              Correct answer description
            </label>
            <textarea
              id="grand-test-custom-correct-description"
              value={correctDescription}
              disabled={disabled}
              placeholder="Optional explanation for the correct answer"
              className={textareaClasses}
              onChange={(event) => setCorrectDescription(event.target.value)}
            />
          </div>

          <QbankCorrectAnswerImagesUpload
            persistedImages={persistedCorrectAnswerImages}
            pendingFiles={pendingCorrectAnswerImages}
            disabled={disabled}
            onAddFiles={(files) => {
              setPendingCorrectAnswerImages((previous) => [
                ...previous,
                ...files.map((file) => ({
                  id: crypto.randomUUID(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                })),
              ])
            }}
            onRemovePersisted={(url) => {
              if (isEditMode) {
                markImageForRemoval(url)

                const originalSlotIndex =
                  initialCorrectAnswerImageUrlsRef.current.indexOf(url)
                if (originalSlotIndex >= 0) {
                  setRemovedCorrectAnswerSlotIndices((previous) =>
                    previous.includes(originalSlotIndex)
                      ? previous
                      : [...previous, originalSlotIndex],
                  )
                }
              }
              setPersistedCorrectAnswerImages((previous) =>
                previous.filter((imageUrl) => imageUrl !== url),
              )
            }}
            onRemovePending={(id) => {
              setPendingCorrectAnswerImages((previous) => {
                const pendingImage = previous.find((item) => item.id === id)
                if (pendingImage) revokePreviewUrlIfBlob(pendingImage.previewUrl)
                return previous.filter((item) => item.id !== id)
              })
            }}
          />

          <div className="flex flex-col gap-3">
            <span className="text-label-sm text-on-surface">Reference</span>
            <TextField
              id="grand-test-custom-reference-book"
              label="Book Name"
              value={referenceBookName}
              disabled={disabled}
              onChange={(event) => setReferenceBookName(event.target.value)}
            />
            <TextField
              id="grand-test-custom-reference-page"
              label="Page No"
              value={referencePageNo}
              disabled={disabled}
              onChange={(event) => setReferencePageNo(event.target.value)}
            />
            <TextField
              id="grand-test-custom-reference-chapter"
              label="Chapter"
              value={referenceChapter}
              disabled={disabled}
              onChange={(event) => setReferenceChapter(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={disabled}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="gap-2"
          >
            <MaterialIcon name={submitIcon} size={16} />
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
