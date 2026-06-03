import type { Timestamp } from 'firebase/firestore'

export interface Plan {
  id: string
  planId: string
  planName: string
  planType: string
  originalPrice: number
  sellingPrice: number
  durationMonths: number
  planModules: string[]
  description: string[]
  displayOrder: number
  badge: string
  validUntilDate: Date | null
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface PlanDocument {
  planId?: string
  planName?: string
  planType?: string
  originalPrice?: number
  sellingPrice?: number
  durationMonths?: number
  planModules?: string[]
  description?: string[]
  displayOrder?: number
  badge?: unknown
  validUntilDate?: Timestamp | null
  isActive?: boolean
  createdBy?: string
  updatedBy?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type PlanSortField = 'displayOrder' | 'planName' | 'sellingPrice' | 'isActive'

export type { SortDirection } from '@/types/table'
