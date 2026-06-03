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

export interface StudentDocument {
  uid?: string
  email?: string
  phone?: string | null
  name?: string | null
  authenticationMethod?: string
  isActiveUser?: boolean
  plans?: StudentPlansSnapshot
}

export type StudentSortField = 'name' | 'planName'

export type { SortDirection } from '@/types/table'
