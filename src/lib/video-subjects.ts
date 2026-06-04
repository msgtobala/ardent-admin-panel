import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  CreateVideoSubjectInput,
  UpdateVideoSubjectInput,
  VideoSubject,
  VideoSubjectDocument,
} from '@/types/video-subject'
import { buildVideoSubjectIdFromName } from './video-subject-id'
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
    mvid: data.mvid ?? null,
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

export async function createVideoSubject(
  input: CreateVideoSubjectInput,
): Promise<string> {
  const subjectName = input.subjectName.trim()
  const subjectId = buildVideoSubjectIdFromName(subjectName)

  if (!subjectId) {
    throw new Error(
      'Subject name must contain letters or numbers to generate a document id.',
    )
  }

  const docRef = doc(db, VIDEOS_COLLECTION, subjectId)
  const existing = await getDoc(docRef)

  if (existing.exists()) {
    throw new Error('A video subject with this name already exists.')
  }

  const subjects = await fetchVideoSubjects()
  const maxSortOrder = subjects.reduce(
    (max, subject) => Math.max(max, subject.sortOrder),
    -1,
  )
  const now = serverTimestamp()

  await setDoc(docRef, {
    id: subjectId,
    subjectName,
    description: input.description.trim(),
    icon: input.icon.trim(),
    imageUrl: '',
    mvid: null,
    totalLessons: 0,
    totalModules: 0,
    sortOrder: maxSortOrder + 1,
    isActive: false,
    studentsCompleted: 0,
    studentsProgressing: 0,
    createdAt: now,
    updatedAt: now,
  })

  return subjectId
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
