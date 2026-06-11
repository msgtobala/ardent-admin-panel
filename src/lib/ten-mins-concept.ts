import {
  collection,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  ResolvedTenMinsConcept,
  TenMinsConcept,
  TenMinsConceptDocument,
} from '@/types/ten-mins-concept'
import { LESSONS_SUBCOLLECTION } from './video-lessons'
import { VIDEOS_COLLECTION } from './video-subjects'
import { db } from './firebase'

export const TEN_MINS_CONCEPT_COLLECTION = '10_mins_concept'

const DEFAULT_REGION = 'asia-south1'

function getTenMinsConceptSuggestUrl(): string {
  const override = import.meta.env.VITE_TEN_MINS_CONCEPT_SUGGEST_URL?.trim()
  if (override) return override

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  const region =
    import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || DEFAULT_REGION

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true' &&
    projectId
  ) {
    return `http://127.0.0.1:5001/${projectId}/${region}/tenMinsConcept/random`
  }

  if (!projectId) {
    throw new Error('Firebase project ID is not configured.')
  }

  return `https://${region}-${projectId}.cloudfunctions.net/tenMinsConcept/random`
}

function mapTenMinsConceptDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): TenMinsConcept {
  const data = snapshot.data() as TenMinsConceptDocument

  return {
    id: typeof data.id === 'string' && data.id.trim() ? data.id.trim() : snapshot.id,
    subjectRefId: data.subjectRefId?.trim() ?? '',
    lessonRefId: data.lessonRefId?.trim() ?? '',
    isActive: data.isActive === true,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  }
}

function isCompleteConcept(record: TenMinsConcept): boolean {
  return Boolean(record.subjectRefId && record.lessonRefId)
}

function compareConceptRecency(left: TenMinsConcept, right: TenMinsConcept): number {
  const leftTime = (left.updatedAt ?? left.createdAt)?.getTime() ?? 0
  const rightTime = (right.updatedAt ?? right.createdAt)?.getTime() ?? 0
  return rightTime - leftTime
}

async function resolveTenMinsConcept(
  record: TenMinsConcept,
): Promise<ResolvedTenMinsConcept | null> {
  const [subjectSnap, lessonSnap] = await Promise.all([
    getDoc(doc(db, VIDEOS_COLLECTION, record.subjectRefId)),
    getDoc(
      doc(
        db,
        VIDEOS_COLLECTION,
        record.subjectRefId,
        LESSONS_SUBCOLLECTION,
        record.lessonRefId,
      ),
    ),
  ])

  if (!subjectSnap.exists() || !lessonSnap.exists()) {
    return null
  }

  const subjectData = subjectSnap.data()
  const lessonData = lessonSnap.data()

  return {
    ...record,
    subjectName:
      typeof subjectData.subjectName === 'string' ? subjectData.subjectName.trim() : '',
    lessonName: typeof lessonData.lessonName === 'string' ? lessonData.lessonName.trim() : '',
    thumbnailImage:
      typeof lessonData.thumbnailImage === 'string' ? lessonData.thumbnailImage.trim() : '',
  }
}

function extractSuggestErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = (payload as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }

  return `Failed to suggest 10 mins concept (${status}).`
}

export async function fetchCurrentTenMinsConcept(): Promise<ResolvedTenMinsConcept | null> {
  const snapshot = await getDocs(collection(db, TEN_MINS_CONCEPT_COLLECTION))

  const records = snapshot.docs
    .map(mapTenMinsConceptDoc)
    .filter((record) => record.isActive && isCompleteConcept(record))
    .sort(compareConceptRecency)

  if (records.length === 0) {
    return null
  }

  return resolveTenMinsConcept(records[0])
}

export async function suggestTenMinsConcept(): Promise<void> {
  const response = await fetch(getTenMinsConceptSuggestUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new Error(extractSuggestErrorMessage(payload, response.status))
  }

  const concept = (payload as { concept?: unknown } | undefined)?.concept
  if (!concept || typeof concept !== 'object') {
    throw new Error('Invalid response from server.')
  }
}
