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

export interface GrandTestNamedRef {
  id: string
  name: string
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
  moduleName: string
  source?: GrandTestQuestionSource
  isCustom?: boolean
  /** Editable content for custom questions and in-test edits of qbank copies. */
  customDraft?: GrandTestCustomQuestionDraft
  /**
   * When source is `qbanks`, whether saving should also update the master qbank
   * question. Defaults to true when omitted.
   */
  syncWithQbank?: boolean
  /** True after the admin edits this question in the modal during this session. */
  hasLocalEdits?: boolean
}

export interface GrandTestQuestionContentWrite {
  id: string
  order: number
  question: string
  questionImage: string | null
  options: string[]
  correctOption: {
    option: number
    description: string
    image: string[]
  }
  source: GrandTestQuestionSource
  references?: Array<Record<string, string>>
  /** Persisted for qbank-sourced questions; omitted for custom. */
  syncedWithQbank?: boolean
}

export interface GrandTestQuestionWrite extends GrandTestQuestionContentWrite {
  subject: GrandTestNamedRef
  chapter: GrandTestNamedRef
  module: string
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
  { id: 1, label: 'Basic details', description: 'Name, schedule, and scoring' },
  { id: 2, label: 'Questions', description: 'Build your question set' },
  { id: 3, label: 'Preview', description: 'Review before saving' },
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
