import type { QbankAnswerOption, QbankQuestionReference } from '@/types/qbank-question'

export type GrandTestQuestionSource = 'qbanks' | 'custom'

export type GrandTestLifecycleStatus = 'upcoming' | 'live' | 'expired'

export interface GrandTestDocument {
  id: string
  title: string
  testStart: { toDate: () => Date }
  testExpiry: { toDate: () => Date }
  duration: number
  questions: number
  correctMark: number
  negativeMark: number
  isFree: boolean
  isActive: boolean
  isLeaderboardPublished: boolean
  totalParticipants: number
  leaderboardScheduleTaskId?: string
  createdAt: { toDate: () => Date }
}

export interface GrandTest {
  id: string
  title: string
  testStart: Date
  testExpiry: Date
  duration: number
  questions: number
  correctMark: number
  negativeMark: number
  isFree: boolean
  isActive: boolean
  isLeaderboardPublished: boolean
  totalParticipants: number
  leaderboardScheduleTaskId?: string
  createdAt: Date
}

export interface GrandTestMonthGroup {
  monthKey: string
  label: string
  tests: GrandTest[]
}

export interface GrandTestCustomQuestionPendingImage {
  id: string
  file: File
  previewUrl: string
}

export interface GrandTestCustomQuestionDraft {
  question: string
  answerOptions: QbankAnswerOption[]
  correctOptionKey: string
  correctDescription: string
  reference: QbankQuestionReference
  questionImage: string | null
  correctAnswerImages: string[]
  pendingQuestionImageFile?: File | null
  pendingQuestionImagePreviewUrl?: string | null
  pendingCorrectAnswerImages?: GrandTestCustomQuestionPendingImage[]
  /** Persisted image URLs to delete from storage after a custom question edit is saved. */
  removedStorageImageUrls?: string[]
  /** Original 0-based slot indices of removed correct-answer images (edit flow). */
  removedCorrectAnswerSlotIndices?: number[]
}

export interface SelectedGrandTestQuestion {
  documentId: string
  questionRefId: string
  label: string
  questionText: string
  subjectRefId: string
  chapterRefId: string
  subjectName: string
  chapterName: string
  source?: GrandTestQuestionSource
  isCustom?: boolean
  customDraft?: GrandTestCustomQuestionDraft
}

export interface GrandTestQuestionWrite {
  id: string
  order: number
  question: string
  questionImage: string | null
  subject: string
  options: string[]
  correctOption: {
    option: number
    description: string
    image: string[]
  }
  source: GrandTestQuestionSource
  references?: Array<Record<string, string>>
}

export interface CreateGrandTestInput {
  title: string
  testStart: Date
  testExpiry: Date
  duration: number
  questions: number
  correctMark: number
  negativeMark: number
  isFree: boolean
  isActive: boolean
  selectedQuestions: SelectedGrandTestQuestion[]
}

export interface GrandTestEditFormData {
  title: string
  testStartValue: string
  testExpiryValue: string
  isFree: boolean
  isActive: boolean
  correctMark: string
  negativeMark: string
  duration: string
  questions: string
  selectedQuestions: SelectedGrandTestQuestion[]
}

export const GRAND_TEST_FORM_STEPS = [
  { id: 1, label: 'Basic details' },
  { id: 2, label: 'Questions' },
  { id: 3, label: 'Preview' },
] as const

export type GrandTestFormStep = (typeof GRAND_TEST_FORM_STEPS)[number]['id']

export interface GrandTestLeaderboardEntry {
  userId: string
  name: string
  profileImageUrl: string
  rank: number
  score: number
  correctCount: number
  incorrectCount: number
  skippedCount: number
  timeTakenSecs: number
  totalParticipants: number
  submittedAt: Date
}
