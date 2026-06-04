export interface ClinicalVignetteQuestionRef {
  id: string
  questionRefId: string
  subjectRefId: string
  chapterRefId: string
  createdAt: Date
  updatedAt?: Date
}

export interface ClinicalVignetteQuestionDocument {
  id?: string
  questionRefId?: string
  subjectRefId?: string
  chapterRefId?: string
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface ResolvedClinicalVignetteQuestion {
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

export interface UpsertClinicalVignetteQuestionInput {
  questionRefId: string
  subjectRefId: string
  chapterRefId: string
}

export type ClinicalVignettePreviousSortField =
  | 'subjectName'
  | 'questionText'
  | 'createdAt'

export type { SortDirection } from '@/types/table'
