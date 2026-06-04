import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { clearMuxPlaybackCache } from '@/lib/mux-playback'
import { functions } from './functions'
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
const FIRESTORE_BATCH_LIMIT = 500

const deleteVideoLessonCallable = httpsCallable<
  { subjectId: string; lessonId: string },
  { deleted: boolean; muxAssetDeleted: boolean }
>(functions, 'deleteVideoLesson')

const DELETE_LESSON_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/invalid-argument': 'Invalid lesson details for delete.',
  'functions/not-found': 'Lesson was not found.',
  'functions/internal': 'Failed to delete video lesson. Please try again.',
}

function mapDeleteLessonError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    const mapped = DELETE_LESSON_ERROR_MESSAGES[code]
    if (mapped) return mapped

    const message = error.message.trim()
    if (message) return message
  }

  return 'Failed to delete video lesson. Please try again.'
}

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
  const existingLessons = await fetchVideoLessons(subjectId)
  const maxSortOrder = existingLessons.reduce(
    (max, lesson) => Math.max(max, lesson.sortOrder),
    -1,
  )
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
    sortOrder: maxSortOrder + 1,
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
    updatedAt: serverTimestamp(),
  })
}

export async function renameVideoLessonModule(
  subjectId: string,
  currentModuleName: string,
  nextModuleName: string,
): Promise<number> {
  const trimmedSubjectId = subjectId.trim()
  const trimmedCurrent = currentModuleName.trim()
  const trimmedNext = nextModuleName.trim()

  if (!trimmedSubjectId) {
    throw new Error('Subject is required to rename a module.')
  }

  if (!trimmedCurrent) {
    throw new Error('Current module name is required.')
  }

  if (!trimmedNext) {
    throw new Error('Module name is required.')
  }

  if (trimmedCurrent === trimmedNext) {
    return 0
  }

  const lessons = await fetchVideoLessons(trimmedSubjectId)
  const lessonsToUpdate = lessons.filter(
    (lesson) => lesson.moduleName.trim() === trimmedCurrent,
  )

  if (lessonsToUpdate.length === 0) {
    return 0
  }

  for (let offset = 0; offset < lessonsToUpdate.length; offset += FIRESTORE_BATCH_LIMIT) {
    const chunk = lessonsToUpdate.slice(offset, offset + FIRESTORE_BATCH_LIMIT)
    const batch = writeBatch(db)

    for (const lesson of chunk) {
      batch.update(
        doc(db, VIDEOS_COLLECTION, trimmedSubjectId, LESSONS_SUBCOLLECTION, lesson.id),
        {
          moduleName: trimmedNext,
          updatedAt: serverTimestamp(),
        },
      )
    }

    await batch.commit()
  }

  return lessonsToUpdate.length
}

export async function updateVideoLessonsSortOrder(
  subjectId: string,
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  if (!subjectId.trim() || updates.length === 0) return

  const batch = writeBatch(db)

  for (const update of updates) {
    batch.update(
      doc(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION, update.id),
      {
        sortOrder: update.sortOrder,
        updatedAt: serverTimestamp(),
      },
    )
  }

  await batch.commit()
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
  const trimmedSubjectId = subjectId.trim()
  const trimmedLessonId = lessonId.trim()

  if (!trimmedSubjectId || !trimmedLessonId) {
    throw new Error('Subject and lesson are required to delete a video lesson.')
  }

  try {
    await deleteVideoLessonCallable({
      subjectId: trimmedSubjectId,
      lessonId: trimmedLessonId,
    })
    clearMuxPlaybackCache(trimmedSubjectId, trimmedLessonId)
  } catch (error) {
    throw new Error(mapDeleteLessonError(error), { cause: error })
  }
}
