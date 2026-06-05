import { useCallback, useEffect, useMemo, useState } from 'react'

import { resolveCorrectOptionKey } from '@/lib/qbank-question-display'
import {
  deleteQbankQuestionImageFromUrl,
  uploadQbankCorrectAnswerImage,
  uploadQbankQuestionImage,
} from '@/lib/qbank-question-image-storage'
import {
  qbankQuestionDocumentExists,
  resolveNextQbankQuestionIdentity,
} from '@/lib/qbank-question-id'
import { fetchQbankQuestionForEdit } from '@/lib/qbank-references'
import { createQbankQuestion, updateQbankQuestion } from '@/lib/qbank-questions'
import {
  QbankCorrectAnswerImagesUpload,
  type PendingCorrectAnswerImage,
} from '@/components/qbank-questions/QbankCorrectAnswerImagesUpload'
import { QbankQuestionImageUpload } from '@/components/qbank-questions/QbankQuestionImageUpload'
import type { QbankAnswerOption } from '@/types/qbank-question'
import type { QbankQuestionListItem } from '@/types/qbank-question-list-item'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface EditQbankQuestionModalProps {
  isOpen: boolean
  subjectId: string
  chapterId: string
  subjectName: string
  chapterName: string
  moduleName: string
  mcqMid: number | null
  question: QbankQuestionListItem | null
  onClose: () => void
  onSaved: () => void
}

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-70 disabled:shadow-none'

const emptyReference = () => ({
  bookName: '',
  pageNo: '',
  chapter: '',
})

function normalizeQuestionText(questionText: string): string {
  return questionText === '—' ? '' : questionText
}

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  const trimmed = imageUrl?.trim()
  return trimmed || null
}

function revokePreviewUrlIfBlob(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function cloneAnswerOptions(answerOptions: QbankAnswerOption[]): QbankAnswerOption[] {
  return answerOptions.map((answerOption, index) => ({
    option: answerOption.option,
    choice: answerOption.choice,
    sortOrder: index,
  }))
}

function defaultAddAnswerOptions(): QbankAnswerOption[] {
  return [
    { option: 'A', choice: '', sortOrder: 0 },
    { option: 'B', choice: '', sortOrder: 1 },
  ]
}

function applyListItemToForm(question: QbankQuestionListItem) {
  const answerOptions = cloneAnswerOptions(question.answerOptions)

  return {
    questionText: normalizeQuestionText(question.questionText),
    answerOptions,
    correctOption: resolveCorrectOptionKey(
      answerOptions,
      question.correctAnswer?.option ?? '',
    ),
    correctDescription: question.correctAnswer?.description ?? '',
    reference: emptyReference(),
    isActive: question.isActive,
    sortOrder: question.sortOrder !== null ? String(question.sortOrder) : '',
  }
}

export function EditQbankQuestionModal({
  isOpen,
  subjectId,
  chapterId,
  subjectName,
  chapterName,
  moduleName,
  mcqMid,
  question,
  onClose,
  onSaved,
}: EditQbankQuestionModalProps) {
  const { showSnackbar } = useSnackbar()
  const isAddMode = isOpen && !question && Boolean(subjectId && chapterId)

  const [questionText, setQuestionText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [removedImageUrl, setRemovedImageUrl] = useState<string | null>(null)
  const [answerOptions, setAnswerOptions] = useState<QbankAnswerOption[]>([])
  const [correctOption, setCorrectOption] = useState('')
  const [correctDescription, setCorrectDescription] = useState('')
  const [existingCorrectAnswerImages, setExistingCorrectAnswerImages] = useState<string[]>([])
  const [pendingCorrectAnswerFiles, setPendingCorrectAnswerFiles] = useState<
    PendingCorrectAnswerImage[]
  >([])
  const [removedCorrectAnswerUrls, setRemovedCorrectAnswerUrls] = useState<string[]>([])
  const [referenceBookName, setReferenceBookName] = useState('')
  const [referencePageNo, setReferencePageNo] = useState('')
  const [referenceChapter, setReferenceChapter] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState('')

  const [questionTextError, setQuestionTextError] = useState<string | undefined>()
  const [answerOptionsError, setAnswerOptionsError] = useState<string | undefined>()
  const [correctOptionError, setCorrectOptionError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [proposedQuestionId, setProposedQuestionId] = useState('')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isLoadingProposal, setIsLoadingProposal] = useState(false)
  const [proposalError, setProposalError] = useState<string | undefined>()
  const [proposalIndexUrl, setProposalIndexUrl] = useState<string | undefined>()
  const [proposalRetryKey, setProposalRetryKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setPreviewUrl((prev) => {
        revokePreviewUrlIfBlob(prev)
        return null
      })
      setQuestionText('')
      setFile(null)
      setExistingImageUrl(null)
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setAnswerOptions([])
      setCorrectOption('')
      setCorrectDescription('')
      setExistingCorrectAnswerImages([])
      setPendingCorrectAnswerFiles((prev) => {
        for (const pending of prev) revokePreviewUrlIfBlob(pending.previewUrl)
        return []
      })
      setRemovedCorrectAnswerUrls([])
      setReferenceBookName('')
      setReferencePageNo('')
      setReferenceChapter('')
      setIsActive(true)
      setSortOrder('')
      setProposedQuestionId('')
      setQuestionTextError(undefined)
      setAnswerOptionsError(undefined)
      setCorrectOptionError(undefined)
      setFormError(undefined)
      setProposalError(undefined)
      setProposalIndexUrl(undefined)
      setIsLoadingDetails(false)
      setIsLoadingProposal(false)
      setIsSubmitting(false)
      return
    }

    if (isAddMode) {
      setPreviewUrl((prev) => {
        revokePreviewUrlIfBlob(prev)
        return null
      })
      setQuestionText('')
      setFile(null)
      setExistingImageUrl(null)
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setAnswerOptions(defaultAddAnswerOptions())
      setCorrectOption('')
      setCorrectDescription('')
      setExistingCorrectAnswerImages([])
      setPendingCorrectAnswerFiles((prev) => {
        for (const pending of prev) revokePreviewUrlIfBlob(pending.previewUrl)
        return []
      })
      setRemovedCorrectAnswerUrls([])
      setReferenceBookName('')
      setReferencePageNo('')
      setReferenceChapter('')
      setIsActive(true)
      setSortOrder('')
      setProposedQuestionId('')
      setQuestionTextError(undefined)
      setAnswerOptionsError(undefined)
      setCorrectOptionError(undefined)
      setFormError(undefined)
      setProposalError(undefined)
      setProposalIndexUrl(undefined)
      setIsLoadingDetails(false)
      setIsSubmitting(false)

      let isCancelled = false

      async function loadProposal() {
        setIsLoadingProposal(true)
        setProposalError(undefined)
        setProposalIndexUrl(undefined)

        try {
          const identity = await resolveNextQbankQuestionIdentity({
            subjectId,
            chapterId,
            mcqMid,
            subjectName,
            chapterName,
          })
          if (isCancelled) return

          setProposedQuestionId(identity.questionId)
          setSortOrder(String(identity.sortOrder))
        } catch (error) {
          console.error('Failed to resolve next qbank question ID:', error)
          if (!isCancelled) {
            const details = getFirestoreErrorDetails(
              error,
              'Failed to generate question ID. Please try again.',
            )
            setProposalError(details.message)
            setProposalIndexUrl(details.indexUrl)
            setProposedQuestionId('')
          }
        } finally {
          if (!isCancelled) setIsLoadingProposal(false)
        }
      }

      void loadProposal()

      return () => {
        isCancelled = true
      }
    }

    if (!question) return

    const initial = applyListItemToForm(question)
    const initialImageUrl = normalizeImageUrl(question.questionImage)
    setQuestionText(initial.questionText)
    setFile(null)
    setExistingImageUrl(initialImageUrl)
    setPreviewUrl(initialImageUrl)
    setImageRemoved(false)
    setRemovedImageUrl(null)
    setAnswerOptions(initial.answerOptions)
    setCorrectOption(initial.correctOption)
    setCorrectDescription(initial.correctDescription)
    setExistingCorrectAnswerImages(question.correctAnswerImages ?? [])
    setPendingCorrectAnswerFiles((prev) => {
      for (const pending of prev) revokePreviewUrlIfBlob(pending.previewUrl)
      return []
    })
    setRemovedCorrectAnswerUrls([])
    setIsActive(initial.isActive)
    setSortOrder(initial.sortOrder)
    setQuestionTextError(undefined)
    setAnswerOptionsError(undefined)
    setCorrectOptionError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)

    if (!subjectId.trim() || !chapterId.trim()) return

    const documentId = question.documentId
    let isCancelled = false

    async function loadDetails() {
      setIsLoadingDetails(true)

      try {
        const payload = await fetchQbankQuestionForEdit(
          subjectId,
          chapterId,
          documentId,
        )
        if (isCancelled || !payload) return

        setQuestionText(normalizeQuestionText(payload.questionText))
        const loadedImageUrl = normalizeImageUrl(payload.questionImage)
        setExistingImageUrl(loadedImageUrl)
        setPreviewUrl((prev) => {
          if (prev?.startsWith('blob:')) revokePreviewUrlIfBlob(prev)
          return loadedImageUrl
        })
        setFile(null)
        setImageRemoved(false)
        setRemovedImageUrl(null)
        const loadedAnswerOptions = cloneAnswerOptions(payload.answerOptions)
        setAnswerOptions(loadedAnswerOptions)
        setCorrectOption(
          resolveCorrectOptionKey(
            loadedAnswerOptions,
            payload.correctAnswer?.option ?? '',
          ),
        )
        setCorrectDescription(payload.correctAnswer?.description ?? '')
        setExistingCorrectAnswerImages(payload.correctAnswerImages)
        setPendingCorrectAnswerFiles((prev) => {
          for (const pending of prev) revokePreviewUrlIfBlob(pending.previewUrl)
          return []
        })
        setRemovedCorrectAnswerUrls([])
        setReferenceBookName(payload.reference.bookName)
        setReferencePageNo(payload.reference.pageNo)
        setReferenceChapter(payload.reference.chapter)
        setIsActive(payload.isActive)
        setSortOrder(payload.sortOrder !== null ? String(payload.sortOrder) : '')
      } catch {
        if (!isCancelled) {
          setFormError('Failed to load question details. Please try again.')
        }
      } finally {
        if (!isCancelled) setIsLoadingDetails(false)
      }
    }

    void loadDetails()

    return () => {
      isCancelled = true
    }
  }, [
    isOpen,
    isAddMode,
    question,
    subjectId,
    chapterId,
    mcqMid,
    subjectName,
    chapterName,
    proposalRetryKey,
  ])

  const correctOptionSelectOptions: SelectOption[] = useMemo(
    () =>
      answerOptions
        .filter((answerOption) => answerOption.option.trim())
        .map((answerOption) => ({
          value: answerOption.option.trim(),
          label: answerOption.option.trim(),
        })),
    [answerOptions],
  )

  function handleAddAnswerOption() {
    setAnswerOptions((prev) => {
      const nextIndex = prev.length
      return [
        ...prev,
        {
          option: String.fromCharCode(65 + nextIndex),
          choice: '',
          sortOrder: nextIndex,
        },
      ]
    })
    setAnswerOptionsError(undefined)
  }

  function handleRemoveAnswerOption(index: number) {
    setAnswerOptions((prev) => {
      if (prev.length <= 2) return prev
      const next = prev
        .filter((_, optionIndex) => optionIndex !== index)
        .map((answerOption, optionIndex) => ({
          ...answerOption,
          sortOrder: optionIndex,
        }))
      return next
    })
    setAnswerOptionsError(undefined)
  }

  function handleRemoveImage() {
    const persistedUrl =
      existingImageUrl ??
      (previewUrl && !previewUrl.startsWith('blob:') ? previewUrl : null)

    setRemovedImageUrl(persistedUrl)
    setPreviewUrl((prev) => {
      revokePreviewUrlIfBlob(prev)
      return null
    })
    setFile(null)
    setExistingImageUrl(null)
    setImageRemoved(true)
  }

  const displayedCorrectAnswerImages = useMemo(
    () =>
      existingCorrectAnswerImages.filter(
        (imageUrl) => !removedCorrectAnswerUrls.includes(imageUrl),
      ),
    [existingCorrectAnswerImages, removedCorrectAnswerUrls],
  )

  function handleAddCorrectAnswerFiles(files: File[]) {
    if (files.length === 0) return

    setPendingCorrectAnswerFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  function handleRemovePersistedCorrectAnswerImage(imageUrl: string) {
    setRemovedCorrectAnswerUrls((prev) =>
      prev.includes(imageUrl) ? prev : [...prev, imageUrl],
    )
  }

  function handleRemovePendingCorrectAnswerImage(id: string) {
    setPendingCorrectAnswerFiles((prev) => {
      const pending = prev.find((entry) => entry.id === id)
      if (pending) revokePreviewUrlIfBlob(pending.previewUrl)
      return prev.filter((entry) => entry.id !== id)
    })
  }

  function handleImageFileChange(
    selectedFile: File | null,
    selectedPreviewUrl: string | null,
  ) {
    if (selectedFile && selectedPreviewUrl) {
      setImageRemoved(false)
      setRemovedImageUrl(null)
      setPreviewUrl((prev) => {
        if (prev && prev !== selectedPreviewUrl) revokePreviewUrlIfBlob(prev)
        return selectedPreviewUrl
      })
      setFile(selectedFile)
      return
    }

    setFile(null)
    setPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) revokePreviewUrlIfBlob(prev)
      return imageRemoved ? null : existingImageUrl
    })
  }

  function handleAnswerOptionChange(
    index: number,
    field: 'option' | 'choice',
    value: string,
  ) {
    setAnswerOptions((prev) =>
      prev.map((answerOption, optionIndex) =>
        optionIndex === index ? { ...answerOption, [field]: value } : answerOption,
      ),
    )
    if (answerOptionsError) setAnswerOptionsError(undefined)
  }

  function validate(): boolean {
    let valid = true

    if (!questionText.trim()) {
      setQuestionTextError('Question text is required')
      valid = false
    } else {
      setQuestionTextError(undefined)
    }

    const validOptions = answerOptions.filter(
      (answerOption) => answerOption.option.trim() && answerOption.choice.trim(),
    )

    if (validOptions.length < 2) {
      setAnswerOptionsError('At least two answer options with text are required')
      valid = false
    } else {
      setAnswerOptionsError(undefined)
    }

    const normalizedCorrectOption = correctOption.trim()
    if (
      !normalizedCorrectOption ||
      !validOptions.some((answerOption) => answerOption.option.trim() === normalizedCorrectOption)
    ) {
      setCorrectOptionError('Select a valid correct option')
      valid = false
    } else {
      setCorrectOptionError(undefined)
    }

    return valid
  }

  async function handleSave() {
    if (!validate()) return
    if (!isAddMode && !question) return
    if (isAddMode && (isLoadingProposal || proposalError || !proposedQuestionId.trim())) {
      if (proposalError) setFormError(proposalError)
      return
    }

    setFormError(undefined)
    setIsSubmitting(true)

    const parsedSortOrder = Number(sortOrder.trim())
    const normalizedSortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0

    const normalizedAnswerOptions = answerOptions
      .filter((answerOption) => answerOption.option.trim() && answerOption.choice.trim())
      .map((answerOption, index) => ({
        option: answerOption.option.trim(),
        choice: answerOption.choice.trim(),
        sortOrder: index,
      }))

    const sharedInput = {
      question: questionText.trim(),
      answerOptions: normalizedAnswerOptions,
      correctAnswer: {
        option: correctOption.trim(),
        description: correctDescription.trim(),
      },
      reference: {
        bookName: referenceBookName,
        pageNo: referencePageNo,
        chapter: referenceChapter,
      },
      isActive,
      sortOrder: normalizedSortOrder,
    }

    try {
      if (isAddMode) {
        const identity = await resolveNextQbankQuestionIdentity({
          subjectId,
          chapterId,
          mcqMid,
          subjectName,
          chapterName,
        })
        const questionRefId = identity.questionId

        const alreadyExists = await qbankQuestionDocumentExists(
          subjectId,
          chapterId,
          questionRefId,
        )
        if (alreadyExists) {
          throw new Error(
            `Question ID ${questionRefId} already exists. Close and reopen the dialog to get a new ID.`,
          )
        }

        const uploadParams = {
          subjectId,
          chapterId,
          moduleName,
          questionRefId,
        }
        const uploadedCorrectAnswerImages = await Promise.all(
          pendingCorrectAnswerFiles.map((pendingFile, index) =>
            uploadQbankCorrectAnswerImage(
              pendingFile.file,
              uploadParams,
              index,
              pendingCorrectAnswerFiles.length,
            ),
          ),
        )
        const questionImage = file
          ? await uploadQbankQuestionImage(file, uploadParams)
          : null

        await createQbankQuestion(subjectId, chapterId, {
          documentId: questionRefId,
          ...sharedInput,
          questionImage,
          correctAnswerImages: uploadedCorrectAnswerImages,
        })

        showSnackbar('Qbank question created successfully')
        onSaved()
        onClose()
        return
      }

      if (!question) return

      if (imageRemoved && removedImageUrl) {
        await deleteQbankQuestionImageFromUrl(removedImageUrl)
      }

      if (removedCorrectAnswerUrls.length > 0) {
        await Promise.all(
          removedCorrectAnswerUrls.map((imageUrl) =>
            deleteQbankQuestionImageFromUrl(imageUrl),
          ),
        )
      }

      const keptCorrectAnswerImages = existingCorrectAnswerImages.filter(
        (imageUrl) => !removedCorrectAnswerUrls.includes(imageUrl),
      )
      const totalCorrectAnswerImages =
        keptCorrectAnswerImages.length + pendingCorrectAnswerFiles.length
      const uploadParams = {
        subjectId,
        chapterId,
        moduleName,
        questionRefId: question.questionRefId,
      }
      const uploadedCorrectAnswerImages = await Promise.all(
        pendingCorrectAnswerFiles.map((pendingFile, index) =>
          uploadQbankCorrectAnswerImage(
            pendingFile.file,
            uploadParams,
            keptCorrectAnswerImages.length + index,
            totalCorrectAnswerImages,
          ),
        ),
      )
      const finalCorrectAnswerImages = [
        ...keptCorrectAnswerImages,
        ...uploadedCorrectAnswerImages,
      ]

      const questionImage = imageRemoved
        ? null
        : file
          ? await uploadQbankQuestionImage(file, {
              subjectId,
              chapterId,
              moduleName,
              questionRefId: question.questionRefId,
            })
          : existingImageUrl

      await updateQbankQuestion(subjectId, chapterId, question.documentId, {
        ...sharedInput,
        questionImage,
        correctAnswerImages: finalCorrectAnswerImages,
      })

      showSnackbar('Qbank question updated successfully')
      onSaved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isAddMode
            ? 'Failed to create qbank question. Please try again.'
            : 'Failed to update qbank question. Please try again.'
      showSnackbar(message)
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  if (!isAddMode && !question) return null

  const questionIdLabel = isAddMode ? proposedQuestionId : question?.questionRefId ?? ''
  const isFormLoading = isLoadingDetails || isLoadingProposal

  const subjectLabel = subjectName.trim() || subjectId
  const chapterLabel = chapterName.trim() || chapterId

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={
          isAddMode ? 'Close add qbank question dialog' : 'Close edit qbank question dialog'
        }
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-qbank-question-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-qbank-question-modal-title" className="text-h3 text-on-surface">
              {isAddMode ? 'Add Qbank Question' : 'Edit Qbank Question'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isAddMode
                ? `Create a new question for ${subjectLabel} · ${chapterLabel}`
                : `Update question content for ${subjectLabel} · ${chapterLabel}`}
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
            void handleSave()
          }}
          noValidate
        >
          {isLoadingDetails ? (
            <p className="text-body-md text-on-surface-variant">Loading question details...</p>
          ) : null}

          {isLoadingProposal ? (
            <p className="text-body-md text-on-surface-variant">Generating question ID...</p>
          ) : null}

          {proposalError ? (
            <div className="flex flex-col gap-2">
              <p className="text-label-sm text-error-red" role="alert">
                {proposalError}
              </p>
              {proposalIndexUrl ? (
                <a
                  href={proposalIndexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-body-md text-primary underline transition hover:text-primary-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  Create Firestore index
                </a>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingProposal}
                onClick={() => setProposalRetryKey((prev) => prev + 1)}
                className="w-fit px-3 py-1.5 text-label-sm"
              >
                Retry ID generation
              </Button>
            </div>
          ) : null}

          <TextField
            id="qbank-question-ref-id"
            label="Question ID"
            value={questionIdLabel}
            disabled
            onChange={() => undefined}
          />

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="qbank-question-text" className="text-label-sm text-on-surface">
              Question
              <span className="text-error-red" aria-hidden="true">
                {' '}
                *
              </span>
            </label>
            <textarea
              id="qbank-question-text"
              value={questionText}
              disabled={isSubmitting || isFormLoading}
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
            file={file}
            previewUrl={previewUrl}
            disabled={isSubmitting || isFormLoading}
            onFileChange={handleImageFileChange}
            onRemove={handleRemoveImage}
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-label-sm text-on-surface">Answer Options</span>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isFormLoading}
                onClick={handleAddAnswerOption}
                className="gap-1 px-3 py-1.5 text-label-sm"
              >
                <MaterialIcon name="add" size={16} />
                Add option
              </Button>
            </div>

            {answerOptions.map((answerOption, index) => (
              <div
                key={`answer-option-${index}`}
                className="flex items-start gap-2 rounded-xl border border-border-subtle p-3"
              >
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <TextField
                    id={`qbank-answer-option-key-${index}`}
                    label="Option"
                    value={answerOption.option}
                    disabled={isSubmitting || isFormLoading}
                    onChange={(event) =>
                      handleAnswerOptionChange(index, 'option', event.target.value)
                    }
                  />
                  <TextField
                    id={`qbank-answer-option-choice-${index}`}
                    label="Choice"
                    value={answerOption.choice}
                    disabled={isSubmitting || isFormLoading}
                    onChange={(event) =>
                      handleAnswerOptionChange(index, 'choice', event.target.value)
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove answer option ${index + 1}`}
                  disabled={isSubmitting || isFormLoading || answerOptions.length <= 2}
                  onClick={() => handleRemoveAnswerOption(index)}
                  className="mt-6 cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MaterialIcon name="delete" size={18} className="text-on-surface-variant" />
                </button>
              </div>
            ))}

            {answerOptionsError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {answerOptionsError}
              </p>
            ) : null}
          </div>

          <SelectField
            id="qbank-question-correct-option"
            label="Correct Option"
            value={correctOption}
            options={correctOptionSelectOptions}
            disabled={isSubmitting || isFormLoading || correctOptionSelectOptions.length === 0}
            placeholder="Select correct option"
            error={correctOptionError}
            onChange={setCorrectOption}
          />

          <div className="flex w-full flex-col gap-1">
            <label
              htmlFor="qbank-question-correct-description"
              className="text-label-sm text-on-surface"
            >
              Correct Answer Description
            </label>
            <textarea
              id="qbank-question-correct-description"
              value={correctDescription}
              disabled={isSubmitting || isFormLoading}
              className={textareaClasses}
              onChange={(event) => setCorrectDescription(event.target.value)}
            />
          </div>

          <QbankCorrectAnswerImagesUpload
            persistedImages={displayedCorrectAnswerImages}
            pendingFiles={pendingCorrectAnswerFiles}
            disabled={isSubmitting || isFormLoading}
            onAddFiles={handleAddCorrectAnswerFiles}
            onRemovePersisted={handleRemovePersistedCorrectAnswerImage}
            onRemovePending={handleRemovePendingCorrectAnswerImage}
          />

          <div className="flex flex-col gap-3">
            <span className="text-label-sm text-on-surface">Reference</span>
            <TextField
              id="qbank-question-reference-book"
              label="Book Name"
              value={referenceBookName}
              disabled={isSubmitting || isFormLoading}
              onChange={(event) => setReferenceBookName(event.target.value)}
            />
            <TextField
              id="qbank-question-reference-page"
              label="Page No"
              value={referencePageNo}
              disabled={isSubmitting || isFormLoading}
              onChange={(event) => setReferencePageNo(event.target.value)}
            />
            <TextField
              id="qbank-question-reference-chapter"
              label="Chapter"
              value={referenceChapter}
              disabled={isSubmitting || isFormLoading}
              onChange={(event) => setReferenceChapter(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-label-sm text-on-surface">Status</span>
            <ActiveToggle
              isActive={isActive}
              disabled={isSubmitting || isFormLoading}
              ariaLabel={`Toggle active status for question ${questionIdLabel}`}
              onChange={setIsActive}
            />
          </div>

          <TextField
            id="qbank-question-sort-order"
            label="Sort Order"
            value={sortOrder}
            disabled={isSubmitting || isFormLoading}
            onChange={(event) => setSortOrder(event.target.value)}
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
            onClick={() => void handleSave()}
            disabled={isSubmitting || isFormLoading || Boolean(isAddMode && proposalError)}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting
              ? isAddMode
                ? 'Adding...'
                : 'Saving...'
              : isAddMode
                ? 'Add Question'
                : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
