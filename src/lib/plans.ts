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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { Plan, PlanDocument, PlanSortField, SortDirection } from '@/types/plan'
import { db } from './firebase'

/**
 * Firestore collection: `plans`
 * Document fields: planId, planName, planType, originalPrice, sellingPrice,
 * durationMonths, planModules, description, displayOrder, badge, validUntilDate,
 * isActive, createdBy, updatedBy, createdAt, updatedAt
 */
export const PLANS_COLLECTION = 'plans'
export const PLANS_PAGE_SIZE = 10

const plansRef = collection(db, PLANS_COLLECTION)

function parseBadge(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

export function mapPlanDoc(snapshot: QueryDocumentSnapshot<DocumentData>): Plan {
  const data = snapshot.data() as PlanDocument

  return {
    id: data.planId ?? snapshot.id,
    planId: data.planId ?? snapshot.id,
    planName: data.planName ?? '',
    planType: data.planType ?? '',
    originalPrice: data.originalPrice ?? 0,
    sellingPrice: data.sellingPrice ?? 0,
    durationMonths: data.durationMonths ?? 0,
    planModules: data.planModules ?? [],
    description: data.description ?? [],
    displayOrder: data.displayOrder ?? 0,
    badge: parseBadge(data.badge),
    validUntilDate: data.validUntilDate?.toDate?.() ?? null,
    isActive: data.isActive === true,
    createdBy: data.createdBy ?? '',
    updatedBy: data.updatedBy ?? '',
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate(),
  }
}

export interface FetchPlansPageResult {
  plans: Plan[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  firstDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

export async function fetchPlansPage(options: {
  pageSize?: number
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  sortField?: PlanSortField
  sortDirection?: SortDirection
}): Promise<FetchPlansPageResult> {
  const pageSize = options.pageSize ?? PLANS_PAGE_SIZE
  const sortField = options.sortField ?? 'planName'
  const sortDirection = options.sortDirection ?? 'asc'

  const q = options.lastDoc
    ? query(
        plansRef,
        orderBy(sortField, sortDirection),
        startAfter(options.lastDoc),
        limit(pageSize + 1),
      )
    : query(plansRef, orderBy(sortField, sortDirection), limit(pageSize + 1))

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  return {
    plans: pageDocs.map(mapPlanDoc),
    lastDoc: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
    firstDoc: pageDocs.length > 0 ? pageDocs[0] : null,
    hasMore,
  }
}

export async function getPlansCount(): Promise<number> {
  const snapshot = await getCountFromServer(plansRef)
  return snapshot.data().count
}

export async function updatePlanIsActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, PLANS_COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

export interface UpdatePlanInput {
  planName: string
  planType: string
  originalPrice: number
  sellingPrice: number
  durationMonths: number
  isActive: boolean
  displayOrder: number
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<void> {
  await updateDoc(doc(db, PLANS_COLLECTION, id), {
    planId: id,
    planName: input.planName,
    planType: input.planType,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    durationMonths: input.durationMonths,
    isActive: input.isActive,
    displayOrder: input.displayOrder,
    updatedAt: serverTimestamp(),
  })
}
