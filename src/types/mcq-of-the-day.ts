import type { QbankDailyQuestionRef, ResolvedQbankDailyQuestion } from '@/types/qbank-daily-question'

export type McqOfTheDayQuestionRef = QbankDailyQuestionRef

export interface McqOfTheDayQuestionDocument {
  id?: string
  questionRefId?: string
  subjectRefId?: string
  chapterRefId?: string
  correctAnswerCount?: number
  wrongAnswerCount?: number
  studentsAttendedCount?: number
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface ResolvedMcqOfTheDayQuestion extends ResolvedQbankDailyQuestion {
  correctAnswerCount: number
  wrongAnswerCount: number
  studentsAttendedCount: number
}

export type McqOfTheDayPreviousSortField =
  | 'subjectName'
  | 'questionText'
  | 'createdAt'

export type { SortDirection } from '@/types/table'
