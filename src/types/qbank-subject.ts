export interface QbankSubject {
  id: string
  subjectName: string
  description: string
  facultyId: string
  imageUrl: string
  icon: string
  chaptersCount: number
  mcqMid: number | null
  sortOrder: number
  isActive: boolean
  studentsCompleted: number
  studentsProgressing: number
  createdAt: Date
  updatedAt?: Date
}

export interface QbankSubjectDocument {
  id?: string
  subjectName?: string
  description?: string
  facultyId?: string
  imageUrl?: string
  icon?: string
  chaptersCount?: number
  mcqMid?: number | null
  sortOrder?: number
  isActive?: boolean
  studentsCompleted?: number
  studentsProgressing?: number
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface UpdateQbankSubjectInput {
  icon: string
  subjectName: string
  description: string
}

export interface CreateQbankSubjectInput {
  subjectName: string
  description: string
  iconFile: File
}
