import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  CreateVideoLessonInput,
  UpdateVideoLessonInput,
  VideoLesson,
  VideoLessonDocument,
} from '@/types/video-lesson'
import { VIDEOS_COLLECTION } from './video-subjects'
import { db } from './firebase'

export const LESSONS_SUBCOLLECTION = 'lessons'
export const VIDEO_LESSONS_PAGE_SIZE = 10

function lessonsRef(subjectId: string) {
  return collection(db, VIDEOS_COLLECTION, subjectId, LESSONS_SUBCOLLECTION)
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
    thumbnailImage: input.thumbnailImage.trim(),
    duration: input.duration,
    muxAssetId: input.muxAssetId.trim(),
    muxPlaybackId: input.muxPlaybackId.trim(),
    timelines: [],
    facultyId: input.facultyId.trim(),
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
