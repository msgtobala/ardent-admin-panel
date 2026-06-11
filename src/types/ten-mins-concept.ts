export interface TenMinsConceptDocument {
  id?: string
  subjectRefId?: string
  lessonRefId?: string
  isActive?: boolean
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface TenMinsConcept {
  id: string
  subjectRefId: string
  lessonRefId: string
  isActive: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

export interface ResolvedTenMinsConcept extends TenMinsConcept {
  subjectName: string
  lessonName: string
  thumbnailImage: string
}
