import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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

export async function getNextDisplayOrder(planType: FirestorePlanType): Promise<number> {
  const plans = await fetchPlansByType(planType)
  if (plans.length === 0) return 0

  const maxOrder = Math.max(...plans.map((plan) => plan.displayOrder))
  return maxOrder + 1
}

export interface UpsertPlanInput {
  planName: string
  planType: FirestorePlanType
  originalPrice: number
  sellingPrice: number
  durationMonths: number
  description: string[]
  planModules: string[]
  isActive: boolean
  displayOrder: number
}

export async function createPlan(input: UpsertPlanInput): Promise<string> {
  const docRef = doc(plansRef)
  const now = serverTimestamp()

  await setDoc(docRef, {
    planId: docRef.id,
    planName: input.planName,
    planType: input.planType,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    durationMonths: input.durationMonths,
    planModules: input.planModules,
    description: input.description,
    displayOrder: input.displayOrder,
    badge: '',
    isActive: input.isActive,
    createdBy: '',
    updatedBy: '',
    createdAt: now,
    updatedAt: now,
  })

  return docRef.id
}

export interface UpdatePlanInput {
  planName: string
  planType: FirestorePlanType
  originalPrice: number
  sellingPrice: number
  durationMonths: number
  description: string[]
  planModules: string[]
  isActive: boolean
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<void> {
  await updateDoc(doc(db, PLANS_COLLECTION, id), {
    planId: id,
    planName: input.planName,
    planType: input.planType,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    durationMonths: input.durationMonths,
    description: input.description,
    planModules: input.planModules,
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  })
}

export async function updatePlansDisplayOrder(
  updates: { id: string; displayOrder: number }[],
): Promise<void> {
  if (updates.length === 0) return

  const batch = writeBatch(db)

  for (const update of updates) {
    batch.update(doc(db, PLANS_COLLECTION, update.id), {
      displayOrder: update.displayOrder,
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}
