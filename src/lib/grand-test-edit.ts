import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { isCustomQbankQuestionId } from '@/lib/qbank-question-id'
import {
  collectGrandTestCustomQuestionImageUrls,
  isGrandTestCustomQuestionDoc,
  mapGrandTestQuestionDocToCustomDraft,
} from '@/lib/grand-test-custom-question'
import { deleteGrandTestCustomQuestionImages } from '@/lib/grand-test-custom-question-image-storage'
import {
  fetchQbankChapterModuleName,
  fetchQbankChapterName,
  fetchQbankSubjectName,
  resolveQbankQuestionLocationsByDocumentIds,
} from '@/lib/qbank-references'
import { toGrandTestDatetimeValue } from '@/lib/format-date'
import type {
  CreateGrandTestInput,
  GrandTestEditFormData,
  GrandTestNamedRef,
  GrandTestQuestionSource,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'
import { GRAND_TESTS_COLLECTION, mapGrandTestDoc } from './grand-tests'
import { writeGrandTestQuestionsToBatch } from './grand-test-questions-write'
import { db } from './firebase'

export interface UpdateGrandTestOptions {
  syncQuestions?: boolean
}

interface GrandTestQuestionDocument extends DocumentData {
  id?: string
  order?: number
  question?: string
  options?: string[]
  correctOption?: {
    option?: number
    description?: string
  }
  source?: GrandTestQuestionSource
  subject?: GrandTestNamedRef | string
  chapter?: GrandTestNamedRef
  module?: string
  subjectRefId?: string
  chapterRefId?: string
  questionRefId?: string
  syncedWithQbank?: boolean
}

function readStoredNamedRef(value: unknown): GrandTestNamedRef | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''

  if (!id && !name) return null

  return { id, name }
}

function readStoredQuestionLocation(
  documentId: string,
  questionData: GrandTestQuestionDocument,
): Pick<
  SelectedGrandTestQuestion,
  'subjectRefId' | 'chapterRefId' | 'questionRefId' | 'documentId'
> | null {
  const storedSubject = readStoredNamedRef(questionData.subject)
  const storedChapter = readStoredNamedRef(questionData.chapter)

  const subjectRefId =
    storedSubject?.id ||
    (typeof questionData.subjectRefId === 'string'
      ? questionData.subjectRefId.trim()
      : '')
  const chapterRefId =
    storedChapter?.id ||
    (typeof questionData.chapterRefId === 'string'
      ? questionData.chapterRefId.trim()
      : '')

  if (!subjectRefId || !chapterRefId) {
    return null
  }

  return {
    documentId,
    subjectRefId,
    chapterRefId,
    questionRefId:
      typeof questionData.questionRefId === 'string' && questionData.questionRefId.trim()
        ? questionData.questionRefId.trim()
        : documentId,
  }
}

function readStoredQuestionMetadata(
  questionData: GrandTestQuestionDocument,
): Pick<SelectedGrandTestQuestion, 'subjectName' | 'chapterName' | 'moduleName'> | null {
  const storedSubject = readStoredNamedRef(questionData.subject)
  const storedChapter = readStoredNamedRef(questionData.chapter)
  const storedModule =
    typeof questionData.module === 'string' ? questionData.module.trim() : ''

  if (!storedSubject && !storedChapter && !storedModule) {
    return null
  }

  const legacySubjectName =
    typeof questionData.subject === 'string' ? questionData.subject.trim() : ''

  return {
    subjectName: storedSubject?.name || legacySubjectName,
    chapterName: storedChapter?.name || '',
    moduleName: storedModule,
  }
}

function buildQuestionLabel(questionRefId: string, questionText: string): string {
  const truncated =
    questionText.length > 80 ? `${questionText.slice(0, 80)}…` : questionText
  return `${questionRefId} — ${truncated}`
}

function resolveGrandTestQuestionSource(
  documentId: string,
  data: GrandTestQuestionDocument,
): GrandTestQuestionSource {
  if (data.source === 'custom' || data.source === 'qbanks') {
    return data.source
  }

  return isCustomQbankQuestionId(documentId) ? 'custom' : 'qbanks'
}

async function mapGrandTestQuestionToSelected(
  documentId: string,
  data: GrandTestQuestionDocument,
  resolvedLocations: Map<
    string,
    Pick<
      SelectedGrandTestQuestion,
      'subjectRefId' | 'chapterRefId' | 'questionRefId' | 'documentId'
    >
  >,
): Promise<SelectedGrandTestQuestion | null> {
  const location =
    readStoredQuestionLocation(documentId, data) ?? resolvedLocations.get(documentId)

  if (!location) return null

  const questionText =
    typeof data.question === 'string' && data.question.trim()
      ? data.question.trim()
      : documentId

  const storedMetadata = readStoredQuestionMetadata(data)

  const [fetchedSubjectName, fetchedChapterName, fetchedModuleName] = await Promise.all([
    storedMetadata?.subjectName
      ? Promise.resolve(storedMetadata.subjectName)
      : fetchQbankSubjectName(location.subjectRefId),
    storedMetadata?.chapterName
      ? Promise.resolve(storedMetadata.chapterName)
      : fetchQbankChapterName(location.subjectRefId, location.chapterRefId),
    storedMetadata?.moduleName
      ? Promise.resolve(storedMetadata.moduleName)
      : fetchQbankChapterModuleName(location.subjectRefId, location.chapterRefId),
  ])

  const source = resolveGrandTestQuestionSource(documentId, data)
  const isCustom = source === 'custom'

  const customDraft = mapGrandTestQuestionDocToCustomDraft(data)

  if (isCustom && !customDraft) {
    return null
  }

  const subjectName =
    fetchedSubjectName === '—' || !fetchedSubjectName
      ? location.subjectRefId
      : fetchedSubjectName
  const chapterName =
    fetchedChapterName === '—' || !fetchedChapterName
      ? location.chapterRefId
      : fetchedChapterName

  const syncWithQbank =
    source === 'qbanks'
      ? typeof data.syncedWithQbank === 'boolean'
        ? data.syncedWithQbank
        : true
      : undefined

  return {
    documentId: location.documentId,
    questionRefId: location.questionRefId,
    label: buildQuestionLabel(location.questionRefId, questionText),
    questionText,
    subjectRefId: location.subjectRefId,
    chapterRefId: location.chapterRefId,
    subjectName,
    chapterName,
    moduleName: fetchedModuleName,
    source,
    ...(isCustom ? { isCustom: true as const } : {}),
    ...(customDraft ? { customDraft } : {}),
    ...(typeof syncWithQbank === 'boolean' ? { syncWithQbank } : {}),
  }
}

export async function fetchGrandTestForEdit(
  testId: string,
): Promise<GrandTestEditFormData> {
  const testRef = doc(db, GRAND_TESTS_COLLECTION, testId)
  const testSnapshot = await getDoc(testRef)

  if (!testSnapshot.exists()) {
    throw new Error('Grand test not found')
  }

  const test = mapGrandTestDoc(testSnapshot)
  const questionsSnapshot = await getDocs(
    query(collection(testRef, 'questions'), orderBy('order', 'asc')),
  )

  const unresolvedDocumentIds = questionsSnapshot.docs
    .filter((questionDoc) => {
      if (isCustomQbankQuestionId(questionDoc.id)) return false
      return !readStoredQuestionLocation(questionDoc.id, questionDoc.data())
    })
    .map((questionDoc) => questionDoc.id)

  const resolvedLocations = await resolveQbankQuestionLocationsByDocumentIds(
    unresolvedDocumentIds,
  )

  const selectedQuestions = (
    await Promise.all(
      questionsSnapshot.docs.map((questionDoc) =>
        mapGrandTestQuestionToSelected(
          questionDoc.id,
          questionDoc.data(),
          resolvedLocations,
        ),
      ),
    )
  ).filter((question): question is SelectedGrandTestQuestion => question !== null)

  if (selectedQuestions.length !== questionsSnapshot.docs.length) {
    throw new Error('Some test questions could not be resolved in the qbank')
  }

  return {
    title: test.title,
    testStartValue: toGrandTestDatetimeValue(test.testStart),
    testExpiryValue: toGrandTestDatetimeValue(test.testExpiry),
    isFree: test.isFree,
    isActive: test.isActive,
    correctMark: String(test.correctMark),
    negativeMark: String(test.negativeMark),
    duration: String(test.duration),
    questions: String(test.questions),
    selectedQuestions,
  }
}

export async function updateGrandTest(
  testId: string,
  input: CreateGrandTestInput,
  options: UpdateGrandTestOptions = {},
): Promise<void> {
  if (input.selectedQuestions.length === 0) {
    throw new Error('At least one question is required')
  }

  if (input.questions !== input.selectedQuestions.length) {
    throw new Error(
      `Number of questions (${input.questions}) must match selected questions (${input.selectedQuestions.length})`,
    )
  }

  const syncQuestions = options.syncQuestions ?? true
  const testRef = doc(db, GRAND_TESTS_COLLECTION, testId)
  const batch = writeBatch(db)

  batch.update(testRef, {
    title: input.title.trim(),
    testStart: Timestamp.fromDate(input.testStart),
    testExpiry: Timestamp.fromDate(input.testExpiry),
    duration: input.duration,
    questions: input.questions,
    correctMark: input.correctMark,
    negativeMark: input.negativeMark,
    isFree: input.isFree,
    isActive: input.isActive,
  })

  if (!syncQuestions) {
    await batch.commit()
    return
  }

  const existingQuestionsSnapshot = await getDocs(collection(testRef, 'questions'))
  const nextQuestionIds = new Set(
    input.selectedQuestions.map((question) => question.documentId),
  )

  const removedCustomQuestionImageUrls: string[] = []

  for (const existingQuestion of existingQuestionsSnapshot.docs) {
    if (nextQuestionIds.has(existingQuestion.id)) continue

    const data = existingQuestion.data()
    if (isGrandTestCustomQuestionDoc(existingQuestion.id, data)) {
      removedCustomQuestionImageUrls.push(
        ...collectGrandTestCustomQuestionImageUrls(data),
      )
    }

    batch.delete(existingQuestion.ref)
  }

  await writeGrandTestQuestionsToBatch(batch, testRef, input.selectedQuestions)
  await batch.commit()

  if (removedCustomQuestionImageUrls.length > 0) {
    await deleteGrandTestCustomQuestionImages(removedCustomQuestionImageUrls)
  }
}
