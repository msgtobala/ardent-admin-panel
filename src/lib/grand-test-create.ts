import {
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import type { CreateGrandTestInput } from '@/types/grand-test'
import { writeGrandTestQuestionsToBatch } from './grand-test-questions-write'
import { GRAND_TESTS_COLLECTION } from './grand-tests'
import { db } from './firebase'

export async function createGrandTest(input: CreateGrandTestInput): Promise<string> {
  if (input.selectedQuestions.length === 0) {
    throw new Error('At least one question is required')
  }

  const testRef = doc(collection(db, GRAND_TESTS_COLLECTION))
  const testId = testRef.id
  const batch = writeBatch(db)

  batch.set(testRef, {
    id: testId,
    title: input.title.trim(),
    testStart: Timestamp.fromDate(input.testStart),
    testExpiry: Timestamp.fromDate(input.testExpiry),
    duration: input.duration,
    questions: input.selectedQuestions.length,
    correctMark: input.correctMark,
    negativeMark: input.negativeMark,
    isFree: input.isFree,
    isActive: input.isActive,
    isLeaderboardPublished: false,
    totalParticipants: 0,
    createdAt: serverTimestamp(),
  })

  await writeGrandTestQuestionsToBatch(batch, testRef, input.selectedQuestions)
  await batch.commit()
  return testId
}
