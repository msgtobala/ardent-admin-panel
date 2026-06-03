import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { FirestorePlanType } from '@/config/plan-sections'
import type { Plan, PlanDocument } from '@/types/plan'
import { db } from './firebase'

/**
 * Firestore collection: `plans`
 * Document fields: planId, planName, planType, originalPrice, sellingPrice,
 * durationMonths, planModules, description, displayOrder, badge, validUntilDate,
 * isActive, createdBy, updatedBy, createdAt, updatedAt
 *
 * Queries filter by planType only (single-field index). Sorting and pagination
 * are handled in the client after fetch.
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

function sortPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder
    }

    return left.planName.localeCompare(right.planName)
  })
}

export async function fetchPlansByType(planType: FirestorePlanType): Promise<Plan[]> {
  const snapshot = await getDocs(
    query(plansRef, where('planType', '==', planType)),
  )

  return sortPlans(snapshot.docs.map(mapPlanDoc))
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
