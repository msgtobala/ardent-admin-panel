import {
  collection,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { GrandTestLeaderboardEntry } from '@/types/grand-test'
import { GRAND_TESTS_COLLECTION } from './grand-tests'
import { db } from './firebase'

export const GRAND_TEST_LEADERBOARD_SUBCOLLECTION = 'leaderboard'

interface GrandTestLeaderboardDocument extends DocumentData {
  userId?: string
  name?: string
  profileImageUrl?: string
  rank?: number
  score?: number
  correctCount?: number
  incorrectCount?: number
  skippedCount?: number
  timeTakenSecs?: number
  totalParticipants?: number
  submittedAt?: { toDate: () => Date }
}

export function formatDurationSeconds(totalSecs: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSecs))
  const minutes = Math.floor(safeSecs / 60)
  const seconds = safeSecs % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

export function mapGrandTestLeaderboardDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): GrandTestLeaderboardEntry {
  const data = snapshot.data() as GrandTestLeaderboardDocument

  return {
    userId: data.userId ?? snapshot.id,
    name: typeof data.name === 'string' ? data.name.trim() : '',
    profileImageUrl:
      typeof data.profileImageUrl === 'string' ? data.profileImageUrl.trim() : '',
    rank: typeof data.rank === 'number' ? data.rank : 0,
    score: typeof data.score === 'number' ? data.score : 0,
    correctCount: typeof data.correctCount === 'number' ? data.correctCount : 0,
    incorrectCount: typeof data.incorrectCount === 'number' ? data.incorrectCount : 0,
    skippedCount: typeof data.skippedCount === 'number' ? data.skippedCount : 0,
    timeTakenSecs: typeof data.timeTakenSecs === 'number' ? data.timeTakenSecs : 0,
    totalParticipants:
      typeof data.totalParticipants === 'number' ? data.totalParticipants : 0,
    submittedAt: data.submittedAt?.toDate() ?? new Date(0),
  }
}

export function getPublishedLeaderboardEntries(
  entries: GrandTestLeaderboardEntry[],
): GrandTestLeaderboardEntry[] {
  return entries
    .filter((entry) => entry.rank > 0)
    .sort((left, right) => left.rank - right.rank)
}

export function sortGrandTestLeaderboardEntries(
  entries: GrandTestLeaderboardEntry[],
): GrandTestLeaderboardEntry[] {
  return [...entries].sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank
    if (right.score !== left.score) return right.score - left.score
    return left.timeTakenSecs - right.timeTakenSecs
  })
}

export async function fetchGrandTestLeaderboard(
  testId: string,
): Promise<GrandTestLeaderboardEntry[]> {
  const leaderboardRef = collection(
    db,
    GRAND_TESTS_COLLECTION,
    testId,
    GRAND_TEST_LEADERBOARD_SUBCOLLECTION,
  )
  const snapshot = await getDocs(leaderboardRef)

  return snapshot.docs.map(mapGrandTestLeaderboardDoc)
}
