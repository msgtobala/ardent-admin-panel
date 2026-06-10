export interface QbankChapter {
  id: string
  chapterName: string
  description: string
  imageUrl: string | null
  moduleName: string
  questionsCount: number
  sortOrder: number
  isActive: boolean
  isFree: boolean
  studentsCompleted: number
  studentsProgressing: number
  createdAt: Date
  updatedAt?: Date
}

export interface CreateQbankChapterInput {
  chapterName: string
  description: string
  moduleName: string
  sortOrder: number
  imageUrl: string | null
  isActive: boolean
  isFree: boolean
}

export interface UpdateQbankChapterInput {
  chapterName: string
  description: string
  moduleName: string
  sortOrder: number
  imageUrl: string | null
  isActive: boolean
  isFree: boolean
}

export type QbankChapterSortField = 'sortOrder' | 'isActive'

export type { SortDirection } from '@/types/table'

export interface QbankChapterDocument {
  id?: string
  chapterName?: string
  subjectName?: string
  moduleName?: string
  description?: string
  imageUrl?: string
  mcqSmChildId?: string
  questionsCount?: number
  microtopics?: unknown[]
  rating?: number
  sortOrder?: number
  isActive?: boolean
  isFree?: boolean
  studentsCompleted?: number
  studentsProgressing?: number
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

