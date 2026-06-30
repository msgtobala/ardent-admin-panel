import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { GrandTest, GrandTestDocument, GrandTestMonthGroup } from '@/types/grand-test'
import { db } from './firebase'

/**
 * Firestore collection: `grand_tests`
 * Document fields: id, title, testStart, testExpiry, duration, questions,
 * correctMark, negativeMark, isFree, isActive, isLeaderboardPublished,
 * totalParticipants, leaderboardScheduleTaskId, createdAt
 */
export const GRAND_TESTS_COLLECTION = 'grand_tests'
export const GRAND_TESTS_CARDS_PAGE_SIZE = 6

export const GRAND_TEST_TIME_ZONE = 'Asia/Kolkata'

const grandTestsRef = collection(db, GRAND_TESTS_COLLECTION)

export function mapGrandTestDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): GrandTest {
  const data = snapshot.data() as GrandTestDocument

  return {
    id: data.id ?? snapshot.id,
    title: data.title ?? '',
    testStart: data.testStart?.toDate() ?? new Date(),
    testExpiry: data.testExpiry?.toDate() ?? new Date(),
    duration: data.duration ?? 0,
    questions: data.questions ?? 0,
    correctMark: data.correctMark ?? 0,
    negativeMark: data.negativeMark ?? 0,
    isFree: data.isFree === true,
    isActive: data.isActive === true,
    isLeaderboardPublished: data.isLeaderboardPublished === true,
    totalParticipants: data.totalParticipants ?? 0,
    leaderboardScheduleTaskId: data.leaderboardScheduleTaskId,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  }
}

export function getGrandTestMonthKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: GRAND_TEST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(date)
}

export function getMonthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey

  const labelDate = new Date(Date.UTC(year, month - 1, 1))
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: GRAND_TEST_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(labelDate)
}

export function groupGrandTestsByMonth(
  tests: GrandTest[],
  resolveMonthDate: (test: GrandTest) => Date,
): GrandTestMonthGroup[] {
  const groups = new Map<string, GrandTest[]>()

  for (const test of tests) {
    const monthKey = getGrandTestMonthKey(resolveMonthDate(test))
    const existing = groups.get(monthKey) ?? []
    groups.set(monthKey, [...existing, test])
  }

  return Array.from(groups.keys())
    .sort((left, right) => right.localeCompare(left))
    .map((monthKey) => ({
      monthKey,
      label: getMonthLabelFromKey(monthKey),
      tests: groups.get(monthKey) ?? [],
    }))
}

export async function fetchActiveGrandTests(): Promise<GrandTest[]> {
  const now = new Date()

  const q = query(grandTestsRef, orderBy('testStart', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map(mapGrandTestDoc)
    .filter((test) => test.testExpiry.getTime() >= now.getTime())
}

export async function fetchCompletedGrandTests(): Promise<GrandTest[]> {
  const now = Timestamp.now()

  const q = query(
    grandTestsRef,
    where('testExpiry', '<', now),
    orderBy('testExpiry', 'desc'),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapGrandTestDoc)
}

export function getCurrentMonthLabel(referenceDate: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: GRAND_TEST_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(referenceDate)
}
