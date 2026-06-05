import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

import type {
  CreateQbankQuestionInput,
  QbankAnswerOption,
  QbankCorrectAnswer,
  QbankQuestionReference,
  UpdateQbankQuestionInput,
} from '@/types/qbank-question'
import { deleteQbankQuestionImages } from './qbank-question-image-storage'
import { db } from './firebase'
import { QBANKS_COLLECTION } from './qbank-subjects'

export interface DeleteQbankQuestionWithAssetsInput {
  documentId: string
  questionImage: string | null
  correctAnswerImages: string[]
}

function serializeReference(
  reference: QbankQuestionReference,
): Record<string, string> | null {
  const payload: Record<string, string> = {}

  if (reference.bookName.trim()) payload.bookName = reference.bookName.trim()
  if (reference.pageNo.trim()) payload.pageNo = reference.pageNo.trim()
  if (reference.chapter.trim()) payload.chapter = reference.chapter.trim()

  return Object.keys(payload).length > 0 ? payload : null
}

function resolveCorrectAnswerIndex(
  answerOptions: QbankAnswerOption[],
  selectedOptionKey: string,
): number {
  const normalizedKey = selectedOptionKey.trim()
  if (!normalizedKey) return 0

  const optionIndex = answerOptions.findIndex(
    (answerOption) => answerOption.option.trim() === normalizedKey,
  )
  if (optionIndex >= 0) return optionIndex

  const numericKey = Number(normalizedKey)
  if (
    !Number.isNaN(numericKey) &&
    numericKey >= 0 &&
    numericKey < answerOptions.length
  ) {
    return numericKey
  }

  return 0
}

function serializeCorrectAnswer(
  correctAnswer: QbankCorrectAnswer | null,
  answerOptions: QbankAnswerOption[],
  correctAnswerImages: string[] = [],
): Record<string, unknown> | null {
  if (!correctAnswer) return null

  const optionKey = correctAnswer.option.trim()
  const description = correctAnswer.description.trim()

  if (!optionKey && !description && correctAnswerImages.length === 0) return null

  return {
    option: resolveCorrectAnswerIndex(answerOptions, optionKey),
    description,
    image: correctAnswerImages,
  }
}

function serializeAnswerOptions(answerOptions: QbankAnswerOption[]) {
  return answerOptions.map((answerOption, index) => ({
    option: answerOption.option.trim(),
    choice: answerOption.choice.trim(),
    sortOrder: index,
  }))
}

function buildQuestionContentPayload(
  input: UpdateQbankQuestionInput,
): Record<string, unknown> {
  const questionImage = input.questionImage?.trim() ?? ''
  const reference = serializeReference(input.reference)
  const correctAnswer = serializeCorrectAnswer(
    input.correctAnswer,
    input.answerOptions,
    input.correctAnswerImages ?? [],
  )

  const payload: Record<string, unknown> = {
    question: input.question.trim(),
    questionImage,
    answerOptions: serializeAnswerOptions(input.answerOptions),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    updatedAt: serverTimestamp(),
  }

  if (input.tags !== undefined) {
    payload.tags = input.tags
  }

  if (input.difficulty !== undefined) {
    const difficulty = input.difficulty?.trim() ?? ''
    payload.difficulty = difficulty || null
  }

  if (reference) {
    payload.reference = reference
  } else {
    payload.reference = null
  }

  if (correctAnswer) {
    payload.correctAnswer = correctAnswer
  }

  return payload
}

function buildUpdatePayload(input: UpdateQbankQuestionInput): Record<string, unknown> {
  return buildQuestionContentPayload(input)
}

function buildCreatePayload(
  subjectId: string,
  chapterId: string,
  documentId: string,
  input: CreateQbankQuestionInput,
): Record<string, unknown> {
  const now = serverTimestamp()

  return {
    ...buildQuestionContentPayload(input),
    id: documentId,
    questionRefId: documentId,
    subjectRefId: subjectId,
    chapterRefId: chapterId,
    tags: [],
    difficulty: 'easy',
    microtopics: [],
    createdBy: '',
    createdAt: now,
  }
}

export async function createQbankQuestion(
  subjectId: string,
  chapterId: string,
  input: CreateQbankQuestionInput,
): Promise<void> {
  const normalizedSubjectId = subjectId.trim()
  const normalizedChapterId = chapterId.trim()
  const documentId = input.documentId.trim()

  if (!normalizedSubjectId || !normalizedChapterId || !documentId) return

  await setDoc(
    doc(
      db,
      QBANKS_COLLECTION,
      normalizedSubjectId,
      'chapters',
      normalizedChapterId,
      'questions',
      documentId,
    ),
    buildCreatePayload(normalizedSubjectId, normalizedChapterId, documentId, input),
  )
}

export async function updateQbankQuestion(
  subjectId: string,
  chapterId: string,
  documentId: string,
  input: UpdateQbankQuestionInput,
): Promise<void> {
  if (!subjectId.trim() || !chapterId.trim() || !documentId.trim()) return

  await updateDoc(
    doc(db, QBANKS_COLLECTION, subjectId, 'chapters', chapterId, 'questions', documentId),
    buildUpdatePayload(input),
  )
}

export async function deleteQbankQuestion(
  subjectId: string,
  chapterId: string,
  documentId: string,
): Promise<void> {
  const normalizedSubjectId = subjectId.trim()
  const normalizedChapterId = chapterId.trim()
  const normalizedDocumentId = documentId.trim()

  if (!normalizedSubjectId || !normalizedChapterId || !normalizedDocumentId) return

  await deleteDoc(
    doc(
      db,
      QBANKS_COLLECTION,
      normalizedSubjectId,
      'chapters',
      normalizedChapterId,
      'questions',
      normalizedDocumentId,
    ),
  )
}

export async function deleteQbankQuestionWithAssets(
  subjectId: string,
  chapterId: string,
  question: DeleteQbankQuestionWithAssetsInput,
): Promise<void> {
  await deleteQbankQuestionImages(question)
  await deleteQbankQuestion(subjectId, chapterId, question.documentId)
}
