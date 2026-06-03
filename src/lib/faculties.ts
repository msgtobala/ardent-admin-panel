import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  Faculty,
  FacultyDocument,
  FacultySortField,
  SortDirection,
} from '@/types/faculty'
import { db } from './firebase'

/**
 * Firestore collection: `faculties`
 * Document fields: facultyId, firstName, lastName, displayName, email, phoneNo,
 * gender, title, bio, languages, specialities, experienceYears, createdAt, updatedAt
 */
export const FACULTIES_COLLECTION = 'faculties'
export const FACULTIES_PAGE_SIZE = 10

const facultiesRef = collection(db, FACULTIES_COLLECTION)

export function mapFacultyDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Faculty {
  const data = snapshot.data() as FacultyDocument

  return {
    id: data.facultyId ?? snapshot.id,
    facultyId: data.facultyId ?? snapshot.id,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    displayName: data.displayName ?? '',
    email: data.email ?? '',
    phoneNo: data.phoneNo ?? '',
    gender: data.gender ?? '',
    title: data.title ?? '',
    bio: data.bio ?? '',
    languages: data.languages ?? '',
    specialities: data.specialities ?? '',
    experienceYears: data.experienceYears ?? 0,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate(),
  }
}

export interface FetchFacultiesPageResult {
  faculties: Faculty[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  firstDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export async function fetchFacultiesPage(options: {
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  sortField?: FacultySortField
  sortDirection?: SortDirection
}): Promise<FetchFacultiesPageResult> {
  const pageSize = options.pageSize ?? FACULTIES_PAGE_SIZE
  const sortField = options.sortField ?? 'displayName'
  const sortDirection = options.sortDirection ?? 'asc'

  const q = options.lastDoc
    ? query(
        facultiesRef,
        orderBy(sortField, sortDirection),
        startAfter(options.lastDoc),
        limit(pageSize + 1),
      )
    : query(
        facultiesRef,
        orderBy(sortField, sortDirection),
        limit(pageSize + 1),
      )

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  return {
    faculties: pageDocs.map(mapFacultyDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    firstDoc: pageDocs.length > 0 ? pageDocs[0] : null,
    hasMore,
  }
}

export async function getFacultiesCount(): Promise<number> {
  const snapshot = await getCountFromServer(facultiesRef)
  return snapshot.data().count
}

export interface UpsertFacultyInput {
  firstName: string
  lastName: string
  displayName: string
  email: string
  phoneNo: string
  gender: string
  title: string
  bio: string
  languages: string
  specialities: string
  experienceYears: number
}

export async function createFaculty(input: UpsertFacultyInput): Promise<string> {
  const docRef = doc(facultiesRef)
  const now = serverTimestamp()

  await setDoc(docRef, {
    facultyId: docRef.id,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: input.displayName,
    email: input.email,
    phoneNo: input.phoneNo,
    gender: input.gender,
    title: input.title,
    bio: input.bio,
    languages: input.languages,
    specialities: input.specialities,
    experienceYears: input.experienceYears,
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

export async function updateFaculty(
  id: string,
  input: UpsertFacultyInput,
): Promise<void> {
  await updateDoc(doc(db, FACULTIES_COLLECTION, id), {
    facultyId: id,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: input.displayName,
    email: input.email,
    phoneNo: input.phoneNo,
    gender: input.gender,
    title: input.title,
    bio: input.bio,
    languages: input.languages,
    specialities: input.specialities,
    experienceYears: input.experienceYears,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFaculty(id: string): Promise<void> {
  await deleteDoc(doc(db, FACULTIES_COLLECTION, id))
}
