export interface StudentAcademicDetails {
  collegeState: string
  collegeName: string
  academicYear: string
}

export interface StudentPlansSnapshot {
  planId?: string
  planName?: string
  planModules?: unknown
  planPurchaseDate?: unknown
  planExpiryDate?: unknown
  purchaseId?: unknown
}

export interface Student {
  id: string
  uid: string
  name: string
  email: string
  phone: string | null
  authenticationMethod: string
  planName: string
  isActiveUser: boolean
}

export interface StudentDetail extends Student {
  state: string
  academicDetails: StudentAcademicDetails
  plans: StudentPlansSnapshot | null
}

export interface StudentDocument {
  uid?: string
  email?: string
  phone?: string | null
  name?: string | null
  authenticationMethod?: string
  isActiveUser?: boolean
  state?: unknown
  academicDetails?: {
    collegeState?: string
    collegeName?: string
    academicYear?: string
  }
  plans?: StudentPlansSnapshot
}

export type StudentSortField = 'name' | 'planName'

export type { SortDirection } from '@/types/table'

export interface UpdateStudentInput {
  name: string
  email?: string
  phone?: string | null
  state: string
  academicDetails: StudentAcademicDetails
  plans: StudentPlansSnapshot | null
}

export interface CreateStudentInput {
  name: string
  email: string
  state?: string
  academicDetails?: Partial<StudentAcademicDetails>
  plans: CreateStudentPlanInput
}

export interface CreateStudentPlanInput {
  planId: string
  planName: string
  planModules: string[]
  planExpiryDate: string | null
  planPurchaseDate: null
  purchaseId: null
}

export interface CreateStudentResult {
  uid: string
  passwordResetEmailSent: boolean
}
