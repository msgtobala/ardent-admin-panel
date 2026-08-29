import { doc, getDoc } from 'firebase/firestore'

import {
  CUSTOM_QBANK_QUESTION_ID_SUFFIX,
  formatCustomQuestionId,
  formatQuestionId,
  isCustomQbankQuestionId,
  parseMcqQuestionId,
  resolveNextCustomQbankQuestionIdentity,
} from '@/lib/qbank-question-id'
import type {
  QbankAnswerOption,
  QbankQuestionEditPayload,
  UpdateQbankQuestionInput,
} from '@/types/qbank-question'
import type {
  GrandTestCustomQuestionDraft,
  GrandTestQuestionContentWrite,
  GrandTestQuestionSource,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'
import { resolveCorrectOptionKey } from './qbank-question-display'
import { updateQbankQuestion } from './qbank-questions'
import { fetchQbankQuestionForEdit } from './qbank-references'
import {
  EMPTY_QBANK_QUESTION_REFERENCE,
  parseGrandTestReferencesFromDoc,
  serializeGrandTestReferences,
} from './grand-test-question-references'
import {
  deleteGrandTestCustomQuestionImages,
  uploadGrandTestCustomCorrectAnswerImage,
  uploadGrandTestCustomQuestionImage,
  type UploadGrandTestCustomQuestionImageParams,
} from './grand-test-custom-question-image-storage'
import { db } from './firebase'
import { QBANKS_COLLECTION } from './qbank-subjects'

export function createPendingCustomQuestionId(): string {
  return `pending-cus-${crypto.randomUUID()}`
}

export function isGrandTestCustomQuestionDoc(
  documentId: string,
  data: Record<string, unknown>,
): boolean {
  if (data.source === 'custom') return true
  if (data.source === 'qbanks') return false
  return isCustomQbankQuestionId(documentId)
}

export function collectGrandTestCustomQuestionImageUrls(
  data: Record<string, unknown>,
): string[] {
  const urls = new Set<string>()

  const questionImage =
    typeof data.questionImage === 'string' ? data.questionImage.trim() : ''
  if (questionImage && questionImage !== 'NULL') {
    urls.add(questionImage)
  }

  const correctOption = data.correctOption
  if (correctOption && typeof correctOption === 'object') {
    const image = (correctOption as Record<string, unknown>).image
    if (Array.isArray(image)) {
      for (const imageUrl of image) {
        if (typeof imageUrl === 'string' && imageUrl.trim()) {
          urls.add(imageUrl.trim())
        }
      }
    } else if (typeof image === 'string' && image.trim()) {
      urls.add(image.trim())
    }
  }

  return [...urls]
}

export async function deleteGrandTestCustomQuestionDocAssets(
  data: Record<string, unknown>,
): Promise<void> {
  const imageUrls = collectGrandTestCustomQuestionImageUrls(data)
  if (imageUrls.length === 0) return
  await deleteGrandTestCustomQuestionImages(imageUrls)
}

export function resolveSelectedQuestionSource(
  selected: SelectedGrandTestQuestion,
): GrandTestQuestionSource {
  if (selected.source === 'custom' || selected.source === 'qbanks') {
    return selected.source
  }
  if (selected.isCustom === true) return 'custom'
  return isCustomQbankQuestionId(selected.documentId) ? 'custom' : 'qbanks'
}

export function isQbankSyncEnabled(selected: SelectedGrandTestQuestion): boolean {
  return (
    resolveSelectedQuestionSource(selected) === 'qbanks' &&
    selected.syncWithQbank !== false &&
    selected.hasLocalEdits === true
  )
}

export function hasEditableQuestionDraft(
  selected: SelectedGrandTestQuestion,
): selected is SelectedGrandTestQuestion & {
  customDraft: GrandTestCustomQuestionDraft
} {
  return selected.customDraft != null
}

export function transformCustomDraftToGrandTestQuestion(
  questionId: string,
  draft: GrandTestCustomQuestionDraft,
  order: number,
  source: GrandTestQuestionSource = 'custom',
  syncedWithQbank?: boolean,
): GrandTestQuestionContentWrite {
  const questionText = draft.question.trim()
  if (!questionText) {
    throw new Error('Question text is required')
  }

  const options = draft.answerOptions
    .map((answerOption) => answerOption.choice.trim())
    .filter((choice) => choice.length > 0)

  if (options.length < 2) {
    throw new Error('Question must have at least two answer options')
  }

  const correctIndex = draft.answerOptions.findIndex(
    (answerOption) => answerOption.option === draft.correctOptionKey,
  )

  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`Question ${questionId} has an invalid correct answer`)
  }

  const questionImage = draft.questionImage?.trim() || null
  const correctAnswerImages = draft.correctAnswerImages
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl.length > 0)

  const references = serializeGrandTestReferences(
    draft.reference ?? EMPTY_QBANK_QUESTION_REFERENCE,
  )

  return {
    id: questionId,
    order,
    question: questionText,
    questionImage,
    options,
    correctOption: {
      option: correctIndex + 1,
      description: draft.correctDescription.trim(),
      image: correctAnswerImages,
    },
    source,
    ...(references ? { references } : {}),
    ...(source === 'qbanks' && typeof syncedWithQbank === 'boolean'
      ? { syncedWithQbank }
      : {}),
  }
}

function sortUniqueSlotIndices(indices: number[]): number[] {
  return [...new Set(indices)].sort((left, right) => left - right)
}

async function reconcileCustomCorrectAnswerImages(
  draft: GrandTestCustomQuestionDraft,
  params: UploadGrandTestCustomQuestionImageParams,
): Promise<string[]> {
  const kept = draft.correctAnswerImages
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl.length > 0)
  const pending = draft.pendingCorrectAnswerImages ?? []
  const removedSlots = sortUniqueSlotIndices(draft.removedCorrectAnswerSlotIndices ?? [])
  const totalCount = kept.length + pending.length
  const originalSlotCount = kept.length + removedSlots.length

  const result: string[] = []
  let keptIdx = 0
  let pendingIdx = 0

  for (let slot = 0; slot < originalSlotCount; slot += 1) {
    if (removedSlots.includes(slot)) {
      if (pendingIdx < pending.length) {
        const uploadedUrl = await uploadGrandTestCustomCorrectAnswerImage(
          pending[pendingIdx].file,
          params,
          result.length,
          totalCount,
        )
        result.push(uploadedUrl)
        pendingIdx += 1
      }
    } else if (keptIdx < kept.length) {
      result.push(kept[keptIdx])
      keptIdx += 1
    }
  }

  return result
}

export function resolveCustomCorrectAnswerImagePreviews(
  draft: GrandTestCustomQuestionDraft,
): string[] {
  const kept = draft.correctAnswerImages
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl.length > 0)
  const pendingPreviews = (draft.pendingCorrectAnswerImages ?? [])
    .map((pendingImage) => pendingImage.previewUrl.trim())
    .filter((previewUrl) => previewUrl.length > 0)
  const removedSlots = sortUniqueSlotIndices(draft.removedCorrectAnswerSlotIndices ?? [])

  if (removedSlots.length > 0) {
    const originalSlotCount = kept.length + removedSlots.length
    const result: string[] = []
    let keptIdx = 0
    let pendingIdx = 0

    for (let slot = 0; slot < originalSlotCount; slot += 1) {
      if (removedSlots.includes(slot)) {
        if (pendingIdx < pendingPreviews.length) {
          result.push(pendingPreviews[pendingIdx])
          pendingIdx += 1
        }
      } else if (keptIdx < kept.length) {
        result.push(kept[keptIdx])
        keptIdx += 1
      }
    }

    return result
  }

  return [...kept, ...pendingPreviews]
}

export async function prepareCustomQuestionDraftImages(
  draft: GrandTestCustomQuestionDraft,
  params: UploadGrandTestCustomQuestionImageParams,
  options?: { deleteRemovedImages?: boolean },
): Promise<GrandTestCustomQuestionDraft> {
  const shouldDeleteRemovedImages = options?.deleteRemovedImages !== false

  if (shouldDeleteRemovedImages && draft.removedStorageImageUrls?.length) {
    await deleteGrandTestCustomQuestionImages(draft.removedStorageImageUrls)
  }

  let questionImage = draft.questionImage?.trim() || null

  if (draft.pendingQuestionImageFile) {
    questionImage = await uploadGrandTestCustomQuestionImage(
      draft.pendingQuestionImageFile,
      params,
    )
  }

  const pendingCorrectAnswerImages = draft.pendingCorrectAnswerImages ?? []
  const removedCorrectAnswerSlotIndices = draft.removedCorrectAnswerSlotIndices ?? []
  let correctAnswerImages = draft.correctAnswerImages
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl.length > 0)

  if (removedCorrectAnswerSlotIndices.length > 0) {
    correctAnswerImages = await reconcileCustomCorrectAnswerImages(draft, params)
  } else if (pendingCorrectAnswerImages.length > 0) {
    const startIndex = correctAnswerImages.length
    const totalCount = startIndex + pendingCorrectAnswerImages.length

    const uploadedUrls = await Promise.all(
      pendingCorrectAnswerImages.map((pendingImage, index) =>
        uploadGrandTestCustomCorrectAnswerImage(
          pendingImage.file,
          params,
          startIndex + index,
          totalCount,
        ),
      ),
    )

    correctAnswerImages = [...correctAnswerImages, ...uploadedUrls]
  }

  return {
    ...draft,
    questionImage,
    correctAnswerImages,
    pendingQuestionImageFile: null,
    pendingQuestionImagePreviewUrl: null,
    pendingCorrectAnswerImages: [],
    removedStorageImageUrls: [],
    removedCorrectAnswerSlotIndices: [],
  }
}

export function mapGrandTestQuestionDocToCustomDraft(
  data: Record<string, unknown>,
): GrandTestCustomQuestionDraft | null {
  const question = typeof data.question === 'string' ? data.question.trim() : ''
  const rawOptions = data.options

  if (!question || !Array.isArray(rawOptions)) return null

  const choices = rawOptions
    .map((option) => (typeof option === 'string' ? option.trim() : ''))
    .filter((option) => option.length > 0)

  if (choices.length < 2) return null

  const answerOptions: QbankAnswerOption[] = choices.map((choice, index) => ({
    option: String.fromCharCode(65 + index),
    choice,
    sortOrder: index,
  }))

  const correctOption = data.correctOption
  const correctOptionRecord =
    correctOption && typeof correctOption === 'object'
      ? (correctOption as Record<string, unknown>)
      : null

  const correctIndex =
    typeof correctOptionRecord?.option === 'number'
      ? correctOptionRecord.option - 1
      : 0

  const correctOptionKey =
    answerOptions[correctIndex]?.option ?? answerOptions[0]?.option ?? 'A'

  const correctDescription =
    typeof correctOptionRecord?.description === 'string'
      ? correctOptionRecord.description.trim()
      : ''

  const questionImage =
    typeof data.questionImage === 'string' && data.questionImage.trim()
      ? data.questionImage.trim()
      : null

  const rawCorrectImages = correctOptionRecord?.image
  const correctAnswerImages = Array.isArray(rawCorrectImages)
    ? rawCorrectImages
        .map((imageUrl) => (typeof imageUrl === 'string' ? imageUrl.trim() : ''))
        .filter((imageUrl) => imageUrl.length > 0)
    : []

  return {
    question,
    answerOptions,
    correctOptionKey,
    correctDescription,
    reference: parseGrandTestReferencesFromDoc(data),
    questionImage,
    correctAnswerImages,
  }
}

async function readSubjectMcqMid(subjectId: string): Promise<number | null> {
  const subjectSnapshot = await getDoc(doc(db, QBANKS_COLLECTION, subjectId))
  if (!subjectSnapshot.exists()) return null

  const mcqMid = subjectSnapshot.data().mcqMid
  return typeof mcqMid === 'number' ? mcqMid : null
}

export async function resolveCustomGrandTestQuestionId(options: {
  subjectId: string
  chapterId: string
  subjectName: string
  chapterName: string
  reservedIds: ReadonlySet<string>
}): Promise<string> {
  const mcqMid = await readSubjectMcqMid(options.subjectId)
  const identity = await resolveNextCustomQbankQuestionIdentity({
    subjectId: options.subjectId,
    chapterId: options.chapterId,
    mcqMid,
    subjectName: options.subjectName,
    chapterName: options.chapterName,
  })

  const baseQuestionId = identity.questionId.endsWith(CUSTOM_QBANK_QUESTION_ID_SUFFIX)
    ? identity.questionId.slice(0, -CUSTOM_QBANK_QUESTION_ID_SUFFIX.length)
    : identity.questionId

  let parsed = parseMcqQuestionId(baseQuestionId)
  if (!parsed) {
    return identity.questionId
  }

  let questionId = formatCustomQuestionId(
    formatQuestionId(parsed.subjectCode, parsed.chapterCode, parsed.number),
  )

  while (options.reservedIds.has(questionId)) {
    parsed = {
      ...parsed,
      number: parsed.number + 1,
    }
    questionId = formatCustomQuestionId(
      formatQuestionId(parsed.subjectCode, parsed.chapterCode, parsed.number),
    )
  }

  return questionId
}

export function isPendingCustomQuestionId(documentId: string): boolean {
  return documentId.trim().startsWith('pending-cus-')
}

/** @deprecated Use hasEditableQuestionDraft */
export function shouldWriteCustomQuestionToTestOnly(
  selected: SelectedGrandTestQuestion,
): selected is SelectedGrandTestQuestion & {
  isCustom: true
  customDraft: GrandTestCustomQuestionDraft
} {
  return selected.isCustom === true && selected.customDraft != null
}

export function mapQbankEditPayloadToDraft(
  payload: QbankQuestionEditPayload,
): GrandTestCustomQuestionDraft | null {
  const answerOptions = payload.answerOptions
    .map((answerOption, index) => ({
      option: answerOption.option.trim() || String.fromCharCode(65 + index),
      choice: answerOption.choice.trim(),
      sortOrder: index,
    }))
    .filter((answerOption) => answerOption.choice.length > 0)

  if (!payload.questionText.trim() || answerOptions.length < 2) return null

  const correctOptionKey = resolveCorrectOptionKey(
    answerOptions,
    payload.correctAnswer?.option.trim() || answerOptions[0]?.option || 'A',
  )

  return {
    question: payload.questionText.trim(),
    answerOptions,
    correctOptionKey,
    correctDescription: payload.correctAnswer?.description.trim() ?? '',
    reference: payload.reference,
    questionImage: payload.questionImage,
    correctAnswerImages: [...payload.correctAnswerImages],
  }
}

export function buildQbankUpdateInputFromDraft(
  draft: GrandTestCustomQuestionDraft,
  existing: Pick<QbankQuestionEditPayload, 'isActive' | 'sortOrder' | 'difficulty' | 'tags'>,
): UpdateQbankQuestionInput {
  return {
    question: draft.question.trim(),
    questionImage: draft.questionImage,
    difficulty: existing.difficulty,
    tags: existing.tags,
    answerOptions: draft.answerOptions,
    correctAnswer: {
      option: draft.correctOptionKey,
      description: draft.correctDescription.trim(),
    },
    correctAnswerImages: draft.correctAnswerImages,
    reference: draft.reference,
    isActive: existing.isActive,
    sortOrder: existing.sortOrder ?? 0,
  }
}

export async function syncQuestionDraftToQbankMaster(
  selected: SelectedGrandTestQuestion & { customDraft: GrandTestCustomQuestionDraft },
): Promise<void> {
  const existing = await fetchQbankQuestionForEdit(
    selected.subjectRefId,
    selected.chapterRefId,
    selected.documentId,
  )

  if (!existing) {
    throw new Error(
      `Question ${selected.questionRefId} could not be found in the question bank to sync`,
    )
  }

  await updateQbankQuestion(
    selected.subjectRefId,
    selected.chapterRefId,
    selected.documentId,
    buildQbankUpdateInputFromDraft(selected.customDraft, existing),
  )
}

export async function ensureSelectedQuestionHasDraft(
  selected: SelectedGrandTestQuestion,
): Promise<SelectedGrandTestQuestion> {
  if (selected.customDraft) return selected

  const source = resolveSelectedQuestionSource(selected)
  if (source === 'custom') {
    throw new Error(`Custom question ${selected.questionRefId} is missing editable content`)
  }

  const payload = await fetchQbankQuestionForEdit(
    selected.subjectRefId,
    selected.chapterRefId,
    selected.documentId,
  )

  if (!payload) {
    throw new Error(`Question ${selected.questionRefId} could not be loaded for editing`)
  }

  const customDraft = mapQbankEditPayloadToDraft(payload)
  if (!customDraft) {
    throw new Error(`Question ${selected.questionRefId} is missing required fields for editing`)
  }

  return {
    ...selected,
    source: 'qbanks',
    customDraft,
    syncWithQbank: selected.syncWithQbank !== false,
  }
}
