import type { Timestamp } from 'firebase/firestore'

export type UserQueryStatus = 'opened' | 'resolved' | 'rejected'

export type UserQueryType =
  | 'qbanks'
  | 'quiz'
  | 'video'
  | 'payment'
  | 'test_series'
  | 'general'

export interface UserQueryNamedRef {
  id?: string
  name?: string
}

export interface UserQueryChapterRef {
  id?: string
  name?: string
  moduleName?: string
}

export interface UserQueryModuleRef {
  name?: string
}

export interface UserQueryIdRef {
  id?: string
}

export interface UserQueryContext {
  subject?: UserQueryNamedRef
  chapter?: UserQueryChapterRef
  module?: UserQueryModuleRef
  question?: UserQueryIdRef
  lesson?: UserQueryIdRef
}

export interface UserQuery {
  id: string
  userId: string
  type: UserQueryType
  description: string
  status: UserQueryStatus
  createdAt: Date
  updatedAt?: Date
  context?: UserQueryContext
}

export interface UserQueryDocument {
  id?: string
  userId?: string
  type?: string
  description?: string
  status?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
  context?: UserQueryContext
}

export type UserQuerySortField = 'createdAt' | 'status' | 'type'

export type UserQueryStatusFilter = 'all' | UserQueryStatus

export type { SortDirection } from '@/types/table'
