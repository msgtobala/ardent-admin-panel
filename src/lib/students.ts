import {
  collection,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { resolveStudentSearchField } from '@/lib/student-utils'
import type {
  Student,
  StudentAcademicDetails,
  StudentDetail,
  StudentDeviceDetails,
  StudentDocument,
  StudentPlansSnapshot,
  StudentSortField,
  UpdateStudentInput,
} from '@/types/student'
import type { SortDirection } from '@/types/table'
import { db } from './firebase'

/**
 * Firestore collection: `users`
 * Student profiles keyed by Firebase Auth uid.
 *
 * Pagination uses cursor-based queries (limit + startAfter).
 * Required single-field indexes (Firestore usually auto-creates these):
 * - `name` ASC/DESC
 * - `plans.planName` ASC/DESC
 * - `email` ASC (for prefix search)
 * - `phone` ASC (for prefix search)
 *
 * See docs/firestore-students-indexes.md for setup details.
 */
export const STUDENTS_COLLECTION = 'users'
export const STUDENTS_PAGE_SIZE = 10

const studentsRef = collection(db, STUDENTS_COLLECTION)

function parsePlanName(plans: StudentDocument['plans']): string {
  if (!plans || typeof plans !== 'object') return ''
  if (typeof plans.planName === 'string') return plans.planName.trim()
  return ''
}

function parseStudentState(state: unknown): string {
  if (typeof state === 'string') return state.trim()
  if (!state || typeof state !== 'object') return ''

  const stateRecord = state as Record<string, unknown>
  if (typeof stateRecord.code === 'string') return stateRecord.code.trim()
  if (typeof stateRecord.name === 'string') return stateRecord.name.trim()

  return ''
}

function parseAcademicDetails(
  academicDetails: StudentDocument['academicDetails'],
): StudentAcademicDetails {
  return {
    collegeState: academicDetails?.collegeState?.trim() ?? '',
    collegeName: academicDetails?.collegeName?.trim() ?? '',
    academicYear: academicDetails?.academicYear?.trim() ?? '',
  }
}

function parsePlansSnapshot(
  plans: StudentDocument['plans'],
): StudentPlansSnapshot | null {
  if (!plans || typeof plans !== 'object') return null
  if (!plans.planId && !plans.planName) return null
  return plans
}

function parseLoginTimestamp(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

function parseHasDeviceDetails(deviceDetails: StudentDocument['deviceDetails']): boolean {
  return parseDeviceDetails(deviceDetails) != null
}

export function parseDeviceDetails(
  deviceDetails: StudentDocument['deviceDetails'],
): StudentDeviceDetails | null {
  if (deviceDetails == null || typeof deviceDetails !== 'object' || Array.isArray(deviceDetails)) {
    return null
  }

  const record = deviceDetails as Record<string, unknown>
  const deviceName = typeof record.deviceName === 'string' ? record.deviceName.trim() : ''
  const platform = typeof record.platform === 'string' ? record.platform.trim() : ''
  const loginTimestamp = parseLoginTimestamp(record.loginTimestamp)

  const hasMeaningfulData =
    typeof record.deviceId === 'string' ||
    deviceName.length > 0 ||
    platform.length > 0 ||
    loginTimestamp != null

  if (!hasMeaningfulData) return null

  return {
    deviceName: deviceName || 'Unknown device',
    platform: platform || 'Unknown platform',
    loginTimestamp,
  }
}

export async function fetchStudentDeviceDetails(
  uid: string,
): Promise<StudentDeviceDetails | null> {
  const docSnap = await getDocFromServer(doc(db, STUDENTS_COLLECTION, uid))
  if (!docSnap.exists()) return null

  const data = docSnap.data() as StudentDocument
  return parseDeviceDetails(data.deviceDetails)
}

export async function resolveStudentsDeviceDetails(students: Student[]): Promise<Student[]> {
  if (students.length === 0) return students

  const snapshots = await Promise.all(
    students.map((student) =>
      getDocFromServer(doc(db, STUDENTS_COLLECTION, student.uid)),
    ),
  )

  return students.map((student, index) => {
    const snapshot = snapshots[index]
    if (!snapshot?.exists()) {
      return { ...student, hasDeviceDetails: false }
    }

    const data = snapshot.data() as StudentDocument
    return {
      ...student,
      hasDeviceDetails: parseHasDeviceDetails(data.deviceDetails),
    }
  })
}

export function mapStudentDoc(snapshot: QueryDocumentSnapshot<DocumentData>): Student {
  const data = snapshot.data() as StudentDocument

  return {
    id: data.uid ?? snapshot.id,
    uid: data.uid ?? snapshot.id,
    name: data.name?.trim() ?? '',
    email: data.email?.trim() ?? '',
    phone: data.phone ?? null,
    authenticationMethod: data.authenticationMethod?.trim() ?? '',
    planName: parsePlanName(data.plans),
    isActiveUser: data.isActiveUser === true,
    hasDeviceDetails: parseHasDeviceDetails(data.deviceDetails),
  }
}

export function mapStudentDetailDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): StudentDetail {
  const data = snapshot.data() as StudentDocument
  const baseStudent = mapStudentDoc(snapshot)

  return {
    ...baseStudent,
    state: parseStudentState(data.state),
    academicDetails: parseAcademicDetails(data.academicDetails),
    plans: parsePlansSnapshot(data.plans),
  }
}

export async function fetchStudentById(uid: string): Promise<StudentDetail | null> {
  const docRef = doc(db, STUDENTS_COLLECTION, uid)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  return mapStudentDetailDoc(docSnap as QueryDocumentSnapshot<DocumentData>)
}

export async function updateStudent(uid: string, input: UpdateStudentInput): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, uid)

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    state: input.state.trim(),
    academicDetails: {
      collegeState: input.academicDetails.collegeState.trim(),
      collegeName: input.academicDetails.collegeName.trim(),
      academicYear: input.academicDetails.academicYear.trim(),
    },
    plans: input.plans ? input.plans : deleteField(),
  }

  if (input.email !== undefined) {
    payload.email = input.email.trim()
  }

  if (input.phone !== undefined) {
    payload.phone = input.phone?.trim() ? input.phone.trim() : null
  }

  await updateDoc(docRef, payload)
}

export async function resetStudentDeviceDetails(uid: string): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, uid)
  await updateDoc(docRef, { deviceDetails: null })
}

export interface FetchStudentsPageResult {
  students: Student[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

function getOrderFieldPath(sortField: StudentSortField): string {
  return sortField === 'planName' ? 'plans.planName' : 'name'
}

function normalizeSearchTerm(searchField: ReturnType<typeof resolveStudentSearchField>, term: string): string {
  if (searchField === 'email') return term.toLowerCase()
  return term
}

function buildStudentsListQuery(options: {
  searchQuery?: string
  sortField: StudentSortField
  sortDirection: SortDirection
  pageSize: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
}): Query<DocumentData> {
  const searchTerm = options.searchQuery?.trim() ?? ''

  if (searchTerm) {
    const searchField = resolveStudentSearchField(searchTerm)
    const normalizedTerm = normalizeSearchTerm(searchField, searchTerm)

    if (searchField === 'uid') {
      const uidQuery = query(studentsRef, where('uid', '==', searchTerm))

      if (options.lastDoc) {
        return query(uidQuery, startAfter(options.lastDoc), limit(options.pageSize + 1))
      }

      return query(uidQuery, limit(options.pageSize + 1))
    }

    const endTerm = `${normalizedTerm}\uf8ff`
    const prefixQuery = query(
      studentsRef,
      where(searchField, '>=', normalizedTerm),
      where(searchField, '<=', endTerm),
      orderBy(searchField),
    )

    if (options.lastDoc) {
      return query(prefixQuery, startAfter(options.lastDoc), limit(options.pageSize + 1))
    }

    return query(prefixQuery, limit(options.pageSize + 1))
  }

  const orderField = getOrderFieldPath(options.sortField)

  if (options.lastDoc) {
    return query(
      studentsRef,
      orderBy(orderField, options.sortDirection),
      startAfter(options.lastDoc),
      limit(options.pageSize + 1),
    )
  }

  return query(
    studentsRef,
    orderBy(orderField, options.sortDirection),
    limit(options.pageSize + 1),
  )
}

async function fetchStudentsByUid(searchTerm: string): Promise<FetchStudentsPageResult> {
  const docRef = doc(db, STUDENTS_COLLECTION, searchTerm)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      students: [mapStudentDoc(docSnap as QueryDocumentSnapshot<DocumentData>)],
      lastDoc: docSnap as QueryDocumentSnapshot<DocumentData>,
      hasMore: false,
    }
  }

  const snapshot = await getDocs(
    query(studentsRef, where('uid', '==', searchTerm), limit(STUDENTS_PAGE_SIZE + 1)),
  )
  const docs = snapshot.docs
  const hasMore = docs.length > STUDENTS_PAGE_SIZE
  const pageDocs = hasMore ? docs.slice(0, STUDENTS_PAGE_SIZE) : docs

  return {
    students: pageDocs.map(mapStudentDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

export async function fetchStudentsPage(options: {
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  sortField?: StudentSortField
  sortDirection?: SortDirection
  searchQuery?: string
}): Promise<FetchStudentsPageResult> {
  const pageSize = options.pageSize ?? STUDENTS_PAGE_SIZE
  const sortField = options.sortField ?? 'name'
  const sortDirection = options.sortDirection ?? 'asc'
  const searchTerm = options.searchQuery?.trim() ?? ''

  if (searchTerm && resolveStudentSearchField(searchTerm) === 'uid' && !options.lastDoc) {
    return fetchStudentsByUid(searchTerm)
  }

  const listQuery = buildStudentsListQuery({
    searchQuery: searchTerm,
    sortField,
    sortDirection,
    pageSize,
    lastDoc: options.lastDoc,
  })

  const snapshot = await getDocs(listQuery)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  return {
    students: pageDocs.map(mapStudentDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  }
}

export async function getStudentsCount(options?: {
  searchQuery?: string
}): Promise<number> {
  const searchTerm = options?.searchQuery?.trim() ?? ''

  if (!searchTerm) {
    const snapshot = await getCountFromServer(studentsRef)
    return snapshot.data().count
  }

  const searchField = resolveStudentSearchField(searchTerm)

  if (searchField === 'uid') {
    const docSnap = await getDoc(doc(db, STUDENTS_COLLECTION, searchTerm))
    if (docSnap.exists()) return 1

    const uidCountSnapshot = await getCountFromServer(
      query(studentsRef, where('uid', '==', searchTerm)),
    )
    return uidCountSnapshot.data().count
  }

  const normalizedTerm = normalizeSearchTerm(searchField, searchTerm)
  const endTerm = `${normalizedTerm}\uf8ff`

  const countSnapshot = await getCountFromServer(
    query(
      studentsRef,
      where(searchField, '>=', normalizedTerm),
      where(searchField, '<=', endTerm),
    ),
  )

  return countSnapshot.data().count
}
