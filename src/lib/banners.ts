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
  Banner,
  BannerDocument,
  BannerSortField,
  SortDirection,
} from '@/types/banner'
import { db } from './firebase'

/**
 * Firestore collection: `banners`
 * Document fields: id (string, equals document ID), link, imageUrl, isActive,
 * createdAt (Timestamp), updatedAt (Timestamp)
 *
 * Security rules (Firebase Console): allow read/write only when request.auth.token.admin == true
 */
export const BANNERS_COLLECTION = 'banners'
export const BANNERS_PAGE_SIZE = 10

export const ACTIVE_BANNER_DELETE_MESSAGE =
  'Deactivate the banner before deleting it.'

const bannersRef = collection(db, BANNERS_COLLECTION)

export function mapBannerDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Banner {
  const data = snapshot.data() as BannerDocument
  return {
    id: data.id ?? snapshot.id,
    link: data.link ?? '',
    imageUrl: data.imageUrl ?? '',
    isActive: data.isActive === true,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate(),
  }
}

export interface FetchBannersPageResult {
  banners: Banner[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  firstDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export async function fetchBannersPage(options: {
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  sortField?: BannerSortField
  sortDirection?: SortDirection
}): Promise<FetchBannersPageResult> {
  const pageSize = options.pageSize ?? BANNERS_PAGE_SIZE
  const sortField = options.sortField ?? 'createdAt'
  const sortDirection = options.sortDirection ?? 'desc'

  const q = options.lastDoc
    ? query(
        bannersRef,
        orderBy(sortField, sortDirection),
        startAfter(options.lastDoc),
        limit(pageSize + 1),
      )
    : query(
        bannersRef,
        orderBy(sortField, sortDirection),
        limit(pageSize + 1),
      )
  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  return {
    banners: pageDocs.map(mapBannerDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    firstDoc: pageDocs.length > 0 ? pageDocs[0] : null,
    hasMore,
  }
}

export async function getBannersCount(): Promise<number> {
  const snapshot = await getCountFromServer(bannersRef)
  return snapshot.data().count
}

export async function updateBannerIsActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, BANNERS_COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export interface CreateBannerInput {
  link: string
  imageUrl: string
  isActive: boolean
}

export async function createBanner(input: CreateBannerInput): Promise<string> {
  const docRef = doc(bannersRef)
  const now = serverTimestamp()

  await setDoc(docRef, {
    id: docRef.id,
    link: input.link,
    imageUrl: input.imageUrl,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

export interface UpdateBannerInput {
  link: string
  imageUrl: string
  isActive: boolean
}

export async function updateBanner(
  id: string,
  input: UpdateBannerInput,
): Promise<void> {
  await updateDoc(doc(db, BANNERS_COLLECTION, id), {
    link: input.link,
    imageUrl: input.imageUrl,
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, BANNERS_COLLECTION, id))
}
