import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  MUX_ASSET_STATUS,
  type CreateVideoLessonInput,
  type MuxAssetStatus,
  type UpdateVideoLessonInput,
  type VideoLesson,
  type VideoLessonDocument,
} from '@/types/video-lesson'
import { VIDEOS_COLLECTION } from './video-subjects'
import { db } from './firebase'

export const LESSONS_SUBCOLLECTION = 'lessons'
export const VIDEO_LESSONS_PAGE_SIZE = 10

function lessonsRef(subjectId: string) {
  return collection(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION)
}

function normalizeMuxAssetStatus(data: VideoLessonDocument): MuxAssetStatus {
  const status = data.muxAssetStatus
  if (
    status === MUX_ASSET_STATUS.idle ||
    status === MUX_ASSET_STATUS.processing ||
    status === MUX_ASSET_STATUS.ready ||
    status === MUX_ASSET_STATUS.errored
  ) {
    return status
  }

  if (data.muxPlaybackId?.trim()) {
    return MUX_ASSET_STATUS.ready
  }

  return MUX_ASSET_STATUS.idle
}

export function mapVideoLessonDoc(
  subjectId: string,
  snapshot: QueryDocumentSnapshot<DocumentData>,
): VideoLesson {
  const data = snapshot.data() as VideoLessonDocument

  return {
    id: data.id ?? snapshot.id,
    subjectId,
    lessonName: data.lessonName ?? '',
    moduleName: data.moduleName ?? '',
    description: data.description ?? '',
    thumbnailImage: data.thumbnailImage ?? '',
    duration: data.duration ?? 0,
    muxAssetId: data.muxAssetId ?? '',
    muxPlaybackId: data.muxPlaybackId ?? '',
    muxAssetStatus: normalizeMuxAssetStatus(data),
    muxAssetError: data.muxAssetError?.trim() || undefined,
    timelines: data.timelines ?? [],
    facultyId: data.facultyId ?? '',
    sortOrder: data.sortOrder ?? 0,
    rating: data.rating ?? 0,
    isActive: data.isActive ?? false,
    isFree: data.isFree ?? false,
    studentsCompleted: data.studentsCompleted ?? 0,
    studentsProgressing: data.studentsProgressing ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

function compareLessonSort(left: VideoLesson, right: VideoLesson): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder
  }

  const moduleCompare = left.moduleName.localeCompare(right.moduleName, undefined, {
    sensitivity: 'base',
  })
  if (moduleCompare !== 0) return moduleCompare

  return left.lessonName.localeCompare(right.lessonName, undefined, {
    sensitivity: 'base',
  })
}

export async function fetchVideoLesson(
  subjectId: string,
  lessonId: string,
): Promise<VideoLesson | null> {
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()
  if (!trimmedSubjectId || !trimmedLessonId) return null

  const snapshot = await getDoc(
    doc(db, VIDEOS_COLLECTION, trimmedSubjectId, LESSONS_SUBCOLLECTION, trimmedLessonId),
  )
  if (!snapshot.exists()) return null

  return mapVideoLessonDoc(trimmedSubjectId, snapshot)
}

export async function fetchVideoLessons(subjectId: string): Promise<VideoLesson[]> {
  const snapshot = await getDocs(lessonsRef(subjectId))
  const lessons = snapshot.docs.map((lessonDoc) =>
    mapVideoLessonDoc(subjectId, lessonDoc),
  )

  return lessons.sort(compareLessonSort)
}

export async function createVideoLesson(
  subjectId: string,
  input: CreateVideoLessonInput,
): Promise<string> {
  const lessonRef = doc(lessonsRef(subjectId))
  const now = serverTimestamp()

  await setDoc(lessonRef, {
    id: lessonRef.id,
    lessonName: input.lessonName.trim(),
    moduleName: input.moduleName.trim(),
    description: input.description.trim(),
    thumbnailImage: '',
    duration: 0,
    muxAssetId: '',
    muxPlaybackId: '',
    muxAssetStatus: MUX_ASSET_STATUS.idle,
    muxAssetError: '',
    timelines: [],
    facultyId: '',
    sortOrder: input.sortOrder,
    rating: 0,
    isActive: input.isActive,
    isFree: input.isFree,
    studentsCompleted: 0,
    studentsProgressing: 0,
    createdAt: now,
    updatedAt: now,
  })

  await syncSubjectTotalLessons(subjectId)
  return lessonRef.id
}

export async function updateVideoLesson(
  subjectId: string,
  lessonId: string,
  input: UpdateVideoLessonInput,
): Promise<void> {
  await updateDoc(doc(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION, lessonId), {
    lessonName: input.lessonName.trim(),
    moduleName: input.moduleName.trim(),
    description: input.description.trim(),
    isActive: input.isActive,
    isFree: input.isFree,
    sortOrder: input.sortOrder,
    updatedAt: serverTimestamp(),
  })
}

export async function updateVideoLessonMuxAssetStatus(
  subjectId: string,
  lessonId: string,
  status: MuxAssetStatus,
  options?: { errorMessage?: string },
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    muxAssetStatus: status,
    updatedAt: serverTimestamp(),
  }

  if (status === MUX_ASSET_STATUS.errored && options?.errorMessage?.trim()) {
    updatePayload.muxAssetError = options.errorMessage.trim()
  }

  if (status === MUX_ASSET_STATUS.processing) {
    updatePayload.muxAssetError = ''
  }

  if (status === MUX_ASSET_STATUS.ready) {
    updatePayload.muxAssetError = ''
  }

  await updateDoc(
    doc(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION, lessonId),
    updatePayload,
  )
}

export async function updateVideoLessonThumbnailImage(
  subjectId: string,
  lessonId: string,
  thumbnailImage: string,
): Promise<void> {
  await updateDoc(doc(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION, lessonId), {
    thumbnailImage: thumbnailImage.trim(),
    updatedAt: serverTimestamp(),
  })
}

async function syncSubjectTotalLessons(subjectId: string): Promise<void> {
  const countSnapshot = await getCountFromServer(lessonsRef(subjectId))
  const totalLessons = countSnapshot.data().count

  await updateDoc(doc(db, VIDEOS_COLLECTION, subjectId), {
    totalLessons,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteVideoLesson(
  subjectId: string,
  lessonId: string,
): Promise<void> {
  await deleteDoc(doc(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION, lessonId))
  await syncSubjectTotalLessons(subjectId)
}
