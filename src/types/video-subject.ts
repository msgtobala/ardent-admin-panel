export interface VideoSubject {
  id: string
  subjectName: string
  description: string
  imageUrl: string
  icon: string
  mvid: number | null
  totalLessons: number
  totalModules: number
  sortOrder: number
  isActive: boolean
  studentsCompleted: number
  studentsProgressing: number
  createdAt: Date
  updatedAt?: Date
}

export interface VideoSubjectDocument {
  id?: string
  subjectName?: string
  description?: string
  imageUrl?: string
  icon?: string
  mvid?: number | null
  totalLessons?: number
  totalModules?: number
  sortOrder?: number
  isActive?: boolean
  studentsCompleted?: number
  studentsProgressing?: number
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface UpdateVideoSubjectInput {
  icon: string
  subjectName: string
  description: string
}

export interface CreateVideoSubjectInput {
  subjectName: string
  description: string
  icon: string
}
