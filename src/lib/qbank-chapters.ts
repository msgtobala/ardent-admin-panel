import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

import { uploadQbankChapterImage } from './qbank-chapter-image-storage'
import { db } from './firebase'
import type {
  CreateQbankChapterInput,
  QbankChapter,
  QbankChapterDocument,
  UpdateQbankChapterInput,
} from '@/types/qbank-chapter'
import { QBANKS_COLLECTION } from './qbank-subjects'

export const QBANK_CHAPTERS_SUBCOLLECTION = 'chapters'
export const QBANK_CHAPTERS_PAGE_SIZE = 10

export function mapQbankChapterDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): QbankChapter {
  const data = snapshot.data() as QbankChapterDocument

  const imageUrl = data.imageUrl?.trim()

  return {
    id: (data.id ?? snapshot.id)?.toString() ?? '',
    chapterName: (data.chapterName ?? '')?.toString(),
    description: (data.description ?? '')?.toString(),
    imageUrl: imageUrl || null,
    moduleName: (data.moduleName ?? '')?.toString(),
    questionsCount: data.questionsCount ?? 0,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive === true,
    isFree: data.isFree === true,
    studentsCompleted: data.studentsCompleted ?? 0,
    studentsProgressing: data.studentsProgressing ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

function sortChapters(chapters: QbankChapter[]): QbankChapter[] {
  return [...chapters].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }
    return left.chapterName.localeCompare(right.chapterName, undefined, {
      sensitivity: 'base',
    })
  })
}

export async function fetchQbankChapters(
  subjectId: string,
): Promise<QbankChapter[]> {
  const trimmedSubjectId = subjectId.trim()
  if (!trimmedSubjectId) return []

  const chaptersRef = collection(db, QBANKS_COLLECTION, trimmedSubjectId, QBANK_CHAPTERS_SUBCOLLECTION)
  const snapshot = await getDocs(chaptersRef)

  return sortChapters(snapshot.docs.map(mapQbankChapterDoc))
}

export async function resolveNextQbankChapterSortOrder(
  subjectId: string,
): Promise<number> {
  const chapters = await fetchQbankChapters(subjectId)
  if (chapters.length === 0) return 0

  const maxSortOrder = chapters.reduce(
    (max, chapter) => Math.max(max, chapter.sortOrder),
    -1,
  )
  return maxSortOrder + 1
}

export async function createQbankChapter(
  subjectId: string,
  subjectName: string,
  input: CreateQbankChapterInput,
  imageFile?: File | null,
): Promise<string> {
  const trimmedSubjectId = subjectId.trim()
  if (!trimmedSubjectId) {
    throw new Error('Subject is required to create a chapter.')
  }

  const chaptersRef = collection(
    db,
    QBANKS_COLLECTION,
    trimmedSubjectId,
    QBANK_CHAPTERS_SUBCOLLECTION,
  )
  const chapterDocRef = doc(chaptersRef)
  const chapterId = chapterDocRef.id
  const resolvedModuleName = input.moduleName.trim() || subjectName.trim()

  let imageUrl = input.imageUrl?.trim() ?? ''
  if (imageFile) {
    imageUrl = await uploadQbankChapterImage(imageFile, {
      subjectId: trimmedSubjectId,
      chapterId,
      moduleName: resolvedModuleName,
    })
  }

  const now = serverTimestamp()

  await setDoc(chapterDocRef, {
    id: chapterId,
    chapterName: input.chapterName.trim(),
    subjectName: subjectName.trim(),
    moduleName: resolvedModuleName,
    description: input.description.trim(),
    imageUrl,
    mcqSmChildId: '',
    questionsCount: 0,
    microtopics: [],
    rating: 0,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    isFree: input.isFree,
    studentsCompleted: 0,
    studentsProgressing: 0,
    createdAt: now,
    updatedAt: now,
  })

  return chapterId
}

export async function updateQbankChaptersSortOrder(
  subjectId: string,
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  const trimmedSubjectId = subjectId.trim()
  if (!trimmedSubjectId || updates.length === 0) return

  const batch = writeBatch(db)

  for (const update of updates) {
    batch.update(
      doc(db, QBANKS_COLLECTION, trimmedSubjectId, QBANK_CHAPTERS_SUBCOLLECTION, update.id),
      {
        sortOrder: update.sortOrder,
        updatedAt: serverTimestamp(),
      },
    )
  }

  await batch.commit()
}

export async function updateQbankChapter(
  subjectId: string,
  chapterId: string,
  input: UpdateQbankChapterInput,
): Promise<void> {
  const trimmedSubjectId = subjectId.trim()
  const trimmedChapterId = chapterId.trim()

  if (!trimmedSubjectId || !trimmedChapterId) {
    throw new Error('Subject and chapter are required to update a chapter.')
  }

  const imageUrl = input.imageUrl?.trim() ?? ''

  await updateDoc(
    doc(db, QBANKS_COLLECTION, trimmedSubjectId, QBANK_CHAPTERS_SUBCOLLECTION, trimmedChapterId),
    {
      chapterName: input.chapterName.trim(),
      description: input.description.trim(),
      moduleName: input.moduleName.trim(),
      sortOrder: input.sortOrder,
      imageUrl,
      isActive: input.isActive,
      isFree: input.isFree,
      updatedAt: serverTimestamp(),
    },
  )
}

