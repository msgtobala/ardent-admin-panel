import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  SUGGESTED_VIDEOS_SLOT_COUNT,
  type ResolvedSuggestedVideo,
  type SuggestedVideo,
  type SuggestedVideoDocument,
} from '@/types/suggested-video'
import { LESSONS_SUBCOLLECTION } from './video-lessons'
import { VIDEOS_COLLECTION } from './video-subjects'
import { db } from './firebase'

export const SUGGESTED_VIDEOS_COLLECTION = 'suggested_videos'

const DEFAULT_REGION = 'asia-south1'

function getSuggestedVideosRefreshUrl(): string {
  const override = import.meta.env.VITE_SUGGESTED_VIDEOS_REFRESH_URL?.trim()
  if (override) return override

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  const region =
    import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || DEFAULT_REGION

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true' &&
    projectId
  ) {
    return `http://127.0.0.1:5001/${projectId}/${region}/suggestedVideos/refresh`
  }

  if (!projectId) {
    throw new Error('Firebase project ID is not configured.')
  }

  return `https://${region}-${projectId}.cloudfunctions.net/suggestedVideos/refresh`
}

function mapSuggestedVideoDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): SuggestedVideo {
  const data = snapshot.data() as SuggestedVideoDocument

  return {
    id: typeof data.id === 'string' && data.id.trim() ? data.id.trim() : snapshot.id,
    subjectRefId: data.subjectRefId?.trim() ?? '',
    lessonRefId: data.lessonRefId?.trim() ?? '',
    noOfStudentsWatched:
      typeof data.noOfStudentsWatched === 'number' && Number.isFinite(data.noOfStudentsWatched)
        ? data.noOfStudentsWatched
        : 0,
    sortOrder:
      typeof data.sortOrder === 'number' && Number.isFinite(data.sortOrder)
        ? data.sortOrder
        : Number.MAX_SAFE_INTEGER,
    isActive: data.isActive === true,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  }
}

async function resolveSuggestedVideo(
  record: SuggestedVideo,
): Promise<ResolvedSuggestedVideo | null> {
  if (!record.subjectRefId || !record.lessonRefId) {
    return null
  }

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

function extractRefreshErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = (payload as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }

  return `Failed to generate suggested videos (${status}).`
}

export async function fetchSuggestedVideos(): Promise<ResolvedSuggestedVideo[]> {
  const snapshot = await getDocs(
    query(
      collection(db, SUGGESTED_VIDEOS_COLLECTION),
      where('isActive', '==', true),
    ),
  )

  const records = snapshot.docs
    .map(mapSuggestedVideoDoc)
    .filter((record) => record.subjectRefId && record.lessonRefId)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }
      return left.id.localeCompare(right.id)
    })

  const resolved = await Promise.all(records.map(resolveSuggestedVideo))
  return resolved.filter((video): video is ResolvedSuggestedVideo => video !== null)
}

export async function refreshSuggestedVideos(): Promise<void> {
  const response = await fetch(getSuggestedVideosRefreshUrl(), {
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
    throw new Error(extractRefreshErrorMessage(payload, response.status))
  }

  const suggestedVideos = (payload as { suggestedVideos?: unknown } | undefined)
    ?.suggestedVideos

  if (!Array.isArray(suggestedVideos)) {
    throw new Error('Invalid response from server.')
  }

  if (suggestedVideos.length !== SUGGESTED_VIDEOS_SLOT_COUNT) {
    throw new Error(
      `Expected ${SUGGESTED_VIDEOS_SLOT_COUNT} suggested videos, received ${suggestedVideos.length}.`,
    )
  }
}
