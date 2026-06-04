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
import type {
  CreateQbankSubjectInput,
  QbankSubject,
  QbankSubjectDocument,
  UpdateQbankSubjectInput,
} from '@/types/qbank-subject'
import { uploadVideoSubjectIcon } from './video-subject-icon-storage'
import { db } from './firebase'

export const QBANKS_COLLECTION = 'qbanks'
export const QBANK_SUBJECTS_PAGE_SIZE = 10

const qbanksRef = collection(db, QBANKS_COLLECTION)

export function mapQbankSubjectDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): QbankSubject {
  const data = snapshot.data() as QbankSubjectDocument

  return {
    id: snapshot.id,
    subjectName: data.subjectName ?? '',
    description: data.description ?? '',
    facultyId: data.facultyId ?? '',
    imageUrl: data.imageUrl ?? '',
    icon: data.icon ?? '',
    chaptersCount: data.chaptersCount ?? 0,
    mcqMid: data.mcqMid ?? null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive === true,
    studentsCompleted: data.studentsCompleted ?? 0,
    studentsProgressing: data.studentsProgressing ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.(),
  }
}

function sortQbankSubjects(subjects: QbankSubject[]): QbankSubject[] {
  return [...subjects].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return left.subjectName.localeCompare(right.subjectName)
  })
}

export async function fetchQbankSubjects(): Promise<QbankSubject[]> {
  const snapshot = await getDocs(qbanksRef)
  return sortQbankSubjects(snapshot.docs.map(mapQbankSubjectDoc))
}

export async function updateQbankSubjectIsActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, QBANKS_COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export async function createQbankSubject(
  input: CreateQbankSubjectInput,
): Promise<string> {
  const subjectName = input.subjectName.trim()
  const docRef = doc(qbanksRef)
  const documentId = docRef.id

  const iconUrl = await uploadVideoSubjectIcon(input.iconFile, documentId)

  const subjects = await fetchQbankSubjects()
  const maxSortOrder = subjects.reduce(
    (max, subject) => Math.max(max, subject.sortOrder),
    -1,
  )
  const now = serverTimestamp()

  await setDoc(docRef, {
    id: documentId,
    subjectName,
    description: input.description.trim(),
    icon: iconUrl,
    facultyId: '',
    imageUrl: '',
    chaptersCount: 0,
    mcqMid: null,
    sortOrder: maxSortOrder + 1,
    isActive: false,
    studentsCompleted: 0,
    studentsProgressing: 0,
    createdAt: now,
    updatedAt: now,
  })

  return documentId
}

export async function updateQbankSubject(
  id: string,
  input: UpdateQbankSubjectInput,
): Promise<void> {
  await updateDoc(doc(db, QBANKS_COLLECTION, id), {
    id,
    icon: input.icon.trim(),
    subjectName: input.subjectName.trim(),
    description: input.description.trim(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateQbankSubjectsSortOrder(
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  if (updates.length === 0) return

  const batch = writeBatch(db)

  for (const update of updates) {
    batch.update(doc(db, QBANKS_COLLECTION, update.id), {
      sortOrder: update.sortOrder,
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
