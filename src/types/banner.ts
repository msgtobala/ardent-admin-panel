import type { Timestamp } from 'firebase/firestore'

export interface Banner {
  id: string
  link: string
  imageUrl: string
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface BannerDocument {
  id?: string
  link: string
  imageUrl: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export type BannerSortField = 'link' | 'isActive' | 'createdAt'

export type SortDirection = 'asc' | 'desc'
