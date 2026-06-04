import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { UpdateVideoSubjectInput, VideoSubject, VideoSubjectDocument } from '@/types/video-subject'
import { db } from './firebase'

export const VIDEOS_COLLECTION = 'videos'
export const VIDEO_SUBJECTS_PAGE_SIZE = 10

const videosRef = collection(db, VIDEOS_COLLECTION)

export function mapVideoSubjectDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): VideoSubject {
  const data = snapshot.data() as VideoSubjectDocument

  return {
    id: data.id ?? snapshot.id,
    subjectName: data.subjectName ?? '',
    description: data.description ?? '',
    imageUrl: data.imageUrl ?? '',
    icon: data.icon ?? '',
    mvid: data.mvid ?? 0,
    totalLessons: data.totalLessons ?? 0,
    totalModules: data.totalModules ?? 0,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive === true,
    studentsCompleted: data.studentsCompleted ?? 0,
    studentsProgressing: data.studentsProgressing ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

function sortVideoSubjects(subjects: VideoSubject[]): VideoSubject[] {
  return [...subjects].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return left.subjectName.localeCompare(right.subjectName)
  })
}

export async function fetchVideoSubjects(): Promise<VideoSubject[]> {
  const snapshot = await getDocs(videosRef)
  return sortVideoSubjects(snapshot.docs.map(mapVideoSubjectDoc))
}

export async function updateVideoSubjectIsActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, VIDEOS_COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export async function updateVideoSubject(
  id: string,
  input: UpdateVideoSubjectInput,
): Promise<void> {
  await updateDoc(doc(db, VIDEOS_COLLECTION, id), {
    icon: input.icon.trim(),
    subjectName: input.subjectName.trim(),
    description: input.description.trim(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateVideoSubjectsSortOrder(
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  if (updates.length === 0) return

  const batch = writeBatch(db)

  for (const update of updates) {
    batch.update(doc(db, VIDEOS_COLLECTION, update.id), {
      sortOrder: update.sortOrder,
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
