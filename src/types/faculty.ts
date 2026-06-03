import type { Timestamp } from 'firebase/firestore'

export interface Faculty {
  id: string
  facultyId: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  phoneNo: string
  gender: string
  title: string
  bio: string
  languages: string
  specialities: string
  experienceYears: number
  createdAt: Date
  updatedAt?: Date
}

export interface FacultyDocument {
  facultyId?: string
  firstName?: string
  lastName?: string
  displayName?: string
  email?: string
  phoneNo?: string
  gender?: string
  title?: string
  bio?: string
  languages?: string
  specialities?: string
  experienceYears?: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type FacultySortField = 'displayName' | 'email'

export type { SortDirection } from '@/types/table'
