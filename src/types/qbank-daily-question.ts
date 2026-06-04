export interface QbankDailyQuestionRef {
  id: string
  questionRefId: string
  subjectRefId: string
  chapterRefId: string
  createdAt: Date
  updatedAt?: Date
}

export interface ResolvedQbankDailyQuestion {
  id: string
  questionRefId: string
  subjectRefId: string
  chapterRefId: string
  subjectName: string
  chapterName: string
  questionText: string
  createdAt: Date
  updatedAt?: Date
}

export type QbankDailyPreviousSortField = 'subjectName' | 'questionText' | 'createdAt'

export type { SortDirection } from '@/types/table'
