import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  normalizeUserQueryStatus,
  normalizeUserQueryType,
  parseUserQueryContext,
} from '@/lib/user-query-display'
import type {
  SortDirection,
  UserQuery,
  UserQueryDocument,
  UserQuerySortField,
  UserQueryStatus,
  UserQueryStatusFilter,
} from '@/types/user-query'
import { db } from './firebase'

/**
 * Firestore collection: `user_queries`
 * Security rules (Firebase Console): admin read/update; users read own + create.
 */
export const USER_QUERIES_COLLECTION = 'user_queries'
export const USER_QUERIES_PAGE_SIZE = 10

const userQueriesRef = collection(db, USER_QUERIES_COLLECTION)

export function mapUserQueryDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): UserQuery {
  const data = snapshot.data() as UserQueryDocument

  return {
    id: data.id ?? snapshot.id,
    userId: data.userId ?? '',
    type: normalizeUserQueryType(data.type),
    description: data.description ?? '',
    status: normalizeUserQueryStatus(data.status),
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate(),
    context: parseUserQueryContext(data.context),
  }
}

export interface FetchUserQueriesPageResult {
  queries: UserQuery[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  firstDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

function buildUserQueriesQuery(options: {
  sortField: UserQuerySortField
  sortDirection: SortDirection
  statusFilter?: UserQueryStatusFilter
}): Query<DocumentData> {
  const constraints = []

  if (options.statusFilter && options.statusFilter !== 'all') {
    constraints.push(where('status', '==', options.statusFilter))
  }

  constraints.push(orderBy(options.sortField, options.sortDirection))

  return query(userQueriesRef, ...constraints)
}

export async function fetchUserQueriesPage(options: {
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  sortField?: UserQuerySortField
  sortDirection?: SortDirection
  statusFilter?: UserQueryStatusFilter
}): Promise<FetchUserQueriesPageResult> {
  const pageSize = options.pageSize ?? USER_QUERIES_PAGE_SIZE
  const sortField = options.sortField ?? 'createdAt'
  const sortDirection = options.sortDirection ?? 'desc'
  const statusFilter = options.statusFilter ?? 'all'

  const baseQuery = buildUserQueriesQuery({
    sortField,
    sortDirection,
    statusFilter,
  })

  const q = options.lastDoc
    ? query(baseQuery, startAfter(options.lastDoc), limit(pageSize + 1))
    : query(baseQuery, limit(pageSize + 1))

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  return {
    queries: pageDocs.map(mapUserQueryDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    firstDoc: pageDocs.length > 0 ? pageDocs[0] : null,
    hasMore,
  }
}

export async function getUserQueriesCount(
  statusFilter: UserQueryStatusFilter = 'all',
): Promise<number> {
  const countQuery =
    statusFilter === 'all'
      ? userQueriesRef
      : query(userQueriesRef, where('status', '==', statusFilter))
  const snapshot = await getCountFromServer(countQuery)
  return snapshot.data().count
}

export async function updateUserQueryStatus(
  id: string,
  status: UserQueryStatus,
): Promise<void> {
  await updateDoc(doc(db, USER_QUERIES_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  })
}
