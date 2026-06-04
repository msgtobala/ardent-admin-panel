import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  ClinicalVignetteQuestionDocument,
  ClinicalVignetteQuestionRef,
  ResolvedClinicalVignetteQuestion,
  UpsertClinicalVignetteQuestionInput,
} from '@/types/clinical-vignette'
import { resolveQbankQuestionDetails } from './qbank-references'
import { db } from './firebase'

export const CLINICAL_VIGNETTES_COLLECTION = 'clinical_vignettes'
export const CLINICAL_VIGNETTE_CURRENT_QUESTION_DOC = 'current_question'
export const CLINICAL_VIGNETTE_PREVIOUS_QUESTIONS_DOC = 'previous_questions'
export const CLINICAL_VIGNETTE_PREVIOUS_QUESTIONS_SUBCOLLECTION = 'questions'

export const CLINICAL_VIGNETTE_PREVIOUS_PAGE_SIZE = 10

const currentQuestionRef = doc(
  db,
  CLINICAL_VIGNETTES_COLLECTION,
  CLINICAL_VIGNETTE_CURRENT_QUESTION_DOC,
)

const previousQuestionsCollectionRef = collection(
  db,
  CLINICAL_VIGNETTES_COLLECTION,
  CLINICAL_VIGNETTE_PREVIOUS_QUESTIONS_DOC,
  CLINICAL_VIGNETTE_PREVIOUS_QUESTIONS_SUBCOLLECTION,
)

function mapClinicalVignetteQuestionDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ClinicalVignetteQuestionRef {
  const data = snapshot.data() as ClinicalVignetteQuestionDocument

  return {
    id: snapshot.id,
    questionRefId: data.questionRefId ?? '',
    subjectRefId: data.subjectRefId ?? '',
    chapterRefId: data.chapterRefId ?? '',
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

export async function resolveClinicalVignetteQuestion(
  question: ClinicalVignetteQuestionRef,
): Promise<ResolvedClinicalVignetteQuestion> {
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
  }
}

export async function fetchCurrentClinicalVignetteQuestion(): Promise<ClinicalVignetteQuestionRef | null> {
  const snapshot = await getDoc(currentQuestionRef)
  if (!snapshot.exists()) return null

  const data = snapshot.data() as ClinicalVignetteQuestionDocument
  const innerId = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : snapshot.id

  return {
    id: innerId,
    questionRefId: data.questionRefId ?? '',
    subjectRefId: data.subjectRefId ?? '',
    chapterRefId: data.chapterRefId ?? '',
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

export async function fetchPreviousClinicalVignetteQuestions(): Promise<
  ClinicalVignetteQuestionRef[]
> {
  const previousQuery = query(
    previousQuestionsCollectionRef,
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(previousQuery)
  return snapshot.docs.map(mapClinicalVignetteQuestionDoc)
}

export async function upsertCurrentClinicalVignetteQuestion(
  input: UpsertClinicalVignetteQuestionInput,
): Promise<void> {
  const existing = await getDoc(currentQuestionRef)
  const now = serverTimestamp()
  const existingData = existing.data() as ClinicalVignetteQuestionDocument | undefined
  const documentId =
    typeof existingData?.id === 'string' && existingData.id.trim()
      ? existingData.id.trim()
      : crypto.randomUUID()

  await setDoc(currentQuestionRef, {
    id: documentId,
    questionRefId: input.questionRefId.trim(),
    subjectRefId: input.subjectRefId.trim(),
    chapterRefId: input.chapterRefId.trim(),
    createdAt: existing.exists() ? existing.data().createdAt ?? now : now,
    updatedAt: now,
  })
}

