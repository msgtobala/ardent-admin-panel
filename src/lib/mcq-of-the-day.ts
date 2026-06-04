import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  McqOfTheDayQuestionDocument,
  McqOfTheDayQuestionRef,
  ResolvedMcqOfTheDayQuestion,
} from '@/types/mcq-of-the-day'
import { resolveQbankQuestionDetails } from './qbank-references'
import { db } from './firebase'

export const MCQ_OF_THE_DAY_COLLECTION = 'mcq_of_the_day'
export const MCQ_OF_THE_DAY_TODAYS_QUESTION_DOC = 'todays_question'
export const MCQ_OF_THE_DAY_PREVIOUS_QUESTIONS_DOC = 'previous_questions'
export const MCQ_OF_THE_DAY_PREVIOUS_QUESTIONS_SUBCOLLECTION = 'questions'

export const MCQ_OF_THE_DAY_PREVIOUS_PAGE_SIZE = 10

const todaysQuestionRef = doc(
  db,
  MCQ_OF_THE_DAY_COLLECTION,
  MCQ_OF_THE_DAY_TODAYS_QUESTION_DOC,
)

const previousQuestionsCollectionRef = collection(
  db,
  MCQ_OF_THE_DAY_COLLECTION,
  MCQ_OF_THE_DAY_PREVIOUS_QUESTIONS_DOC,
  MCQ_OF_THE_DAY_PREVIOUS_QUESTIONS_SUBCOLLECTION,
)

function mapAttendanceCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function mapMcqQuestionFromData(
  documentId: string,
  data: McqOfTheDayQuestionDocument,
): McqOfTheDayQuestionRef {
  const innerId = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : documentId

  return {
    id: innerId,
    questionRefId: data.questionRefId ?? '',
    subjectRefId: data.subjectRefId ?? '',
    chapterRefId: data.chapterRefId ?? '',
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
    correctAnswerCount: mapAttendanceCount(data.correctAnswerCount),
    wrongAnswerCount: mapAttendanceCount(data.wrongAnswerCount),
    studentsAttendedCount: mapAttendanceCount(data.studentsAttendedCount),
  }
}

function mapMcqQuestionDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): McqOfTheDayQuestionRef {
  return mapMcqQuestionFromData(snapshot.id, snapshot.data() as McqOfTheDayQuestionDocument)
}

export async function resolveMcqOfTheDayQuestion(
  question: McqOfTheDayQuestionRef,
): Promise<ResolvedMcqOfTheDayQuestion> {
  const { subjectName, chapterName, questionText } = await resolveQbankQuestionDetails(
    question.subjectRefId,
    question.chapterRefId,
    question.questionRefId,
  )

  return {
    id: question.id,
    questionRefId: question.questionRefId,
    subjectRefId: question.subjectRefId,
    chapterRefId: question.chapterRefId,
    subjectName,
    chapterName,
    questionText,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    correctAnswerCount: question.correctAnswerCount,
    wrongAnswerCount: question.wrongAnswerCount,
    studentsAttendedCount: question.studentsAttendedCount,
  }
}

export async function fetchTodaysMcqQuestion(): Promise<McqOfTheDayQuestionRef | null> {
  const snapshot = await getDoc(todaysQuestionRef)
  if (!snapshot.exists()) return null

  return mapMcqQuestionFromData(snapshot.id, snapshot.data() as McqOfTheDayQuestionDocument)
}

export async function fetchPreviousMcqQuestions(): Promise<McqOfTheDayQuestionRef[]> {
  const previousQuery = query(
    previousQuestionsCollectionRef,
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(previousQuery)
  return snapshot.docs.map(mapMcqQuestionDoc)
}

