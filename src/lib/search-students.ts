import { httpsCallable } from 'firebase/functions'
import type { Student } from '@/types/student'
import { functions } from './functions'

export interface SearchStudentsParams {
  query: string
  page: number
  pageSize?: number
}

export interface SearchStudentsResponse {
  students: Student[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

const searchStudentsCallable = httpsCallable<
  SearchStudentsParams,
  SearchStudentsResponse
>(functions, 'searchStudents')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/invalid-argument': 'Invalid search request.',
  'functions/internal': 'Failed to search students. Please try again.',
}

function mapCallableError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    const mapped = CALLABLE_ERROR_MESSAGES[code]
    if (mapped) return mapped

    const message = error.message.trim()
    return message || 'Failed to search students. Please try again.'
  }

  return 'Failed to search students. Please try again.'
}

export async function searchStudents(
  params: SearchStudentsParams,
): Promise<SearchStudentsResponse> {
  try {
    const result = await searchStudentsCallable({
      query: params.query.trim(),
      page: params.page,
      pageSize: params.pageSize,
    })

    const data = result.data
    if (!data || !Array.isArray(data.students)) {
      throw new Error('Invalid response from server.')
    }

    return data
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
