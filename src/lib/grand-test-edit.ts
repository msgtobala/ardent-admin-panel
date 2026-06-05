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
import {
  fetchQbankChapterName,
  fetchQbankSubjectName,
  resolveQbankQuestionLocationsByDocumentIds,
} from '@/lib/qbank-references'
import { toDatetimeLocalValue } from '@/lib/format-date'
import type {
  CreateGrandTestInput,
  GrandTestEditFormData,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'
import { GRAND_TESTS_COLLECTION, mapGrandTestDoc } from './grand-tests'
import { writeGrandTestQuestionsToBatch } from './grand-test-questions-write'
import { db } from './firebase'

interface GrandTestQuestionDocument extends DocumentData {
  id?: string
  order?: number
  question?: string
  subjectRefId?: string
  chapterRefId?: string
  questionRefId?: string
}

function readStoredQuestionLocation(
  documentId: string,
  questionData: GrandTestQuestionDocument,
): Pick<
  SelectedGrandTestQuestion,
  'subjectRefId' | 'chapterRefId' | 'questionRefId' | 'documentId'
> | null {
  if (
    typeof questionData.subjectRefId !== 'string' ||
    !questionData.subjectRefId.trim() ||
    typeof questionData.chapterRefId !== 'string' ||
    !questionData.chapterRefId.trim()
  ) {
    return null
  }

  return {
    documentId,
    subjectRefId: questionData.subjectRefId.trim(),
    chapterRefId: questionData.chapterRefId.trim(),
    questionRefId:
      typeof questionData.questionRefId === 'string' && questionData.questionRefId.trim()
        ? questionData.questionRefId.trim()
        : documentId,
  }
}

function buildQuestionLabel(questionRefId: string, questionText: string): string {
  const truncated =
    questionText.length > 80 ? `${questionText.slice(0, 80)}…` : questionText
  return `${questionRefId} — ${truncated}`
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

  const [subjectName, chapterName] = await Promise.all([
    fetchQbankSubjectName(location.subjectRefId),
    fetchQbankChapterName(location.subjectRefId, location.chapterRefId),
  ])

  return {
    documentId: location.documentId,
    questionRefId: location.questionRefId,
    label: buildQuestionLabel(location.questionRefId, questionText),
    questionText,
    subjectRefId: location.subjectRefId,
    chapterRefId: location.chapterRefId,
    subjectName: subjectName === '—' ? location.subjectRefId : subjectName,
    chapterName: chapterName === '—' ? location.chapterRefId : chapterName,
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
    .filter((questionDoc) => !readStoredQuestionLocation(questionDoc.id, questionDoc.data()))
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
    testStartValue: toDatetimeLocalValue(test.testStart),
    testExpiryValue: toDatetimeLocalValue(test.testExpiry),
    isFree: test.isFree,
    isActive: test.isActive,
    correctMark: String(test.correctMark),
    negativeMark: String(test.negativeMark),
    duration: String(test.duration),
    selectedQuestions,
  }
}

export async function updateGrandTest(
  testId: string,
  input: CreateGrandTestInput,
): Promise<void> {
  if (input.selectedQuestions.length === 0) {
    throw new Error('At least one question is required')
  }

  const testRef = doc(db, GRAND_TESTS_COLLECTION, testId)
  const existingQuestionsSnapshot = await getDocs(collection(testRef, 'questions'))
  const nextQuestionIds = new Set(
    input.selectedQuestions.map((question) => question.documentId),
  )

  const batch = writeBatch(db)

  batch.update(testRef, {
    title: input.title.trim(),
    testStart: Timestamp.fromDate(input.testStart),
    testExpiry: Timestamp.fromDate(input.testExpiry),
    duration: input.duration,
    questions: input.selectedQuestions.length,
    correctMark: input.correctMark,
    negativeMark: input.negativeMark,
    isFree: input.isFree,
    isActive: input.isActive,
  })

  for (const existingQuestion of existingQuestionsSnapshot.docs) {
    if (!nextQuestionIds.has(existingQuestion.id)) {
      batch.delete(existingQuestion.ref)
    }
  }

  await writeGrandTestQuestionsToBatch(batch, testRef, input.selectedQuestions)
  await batch.commit()
}
