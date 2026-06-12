import { httpsCallable } from 'firebase/functions'
import type { UserEngagementData } from '@/types/user-engagement'
import { functions } from './functions'

const getUserLoginEngagementCallable = httpsCallable<
  { year: number },
  UserEngagementData
>(functions, 'getUserLoginEngagement')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/invalid-argument': 'A valid year is required.',
  'functions/internal': 'Failed to load user engagement. Please try again.',
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
    if (message) return message
  }

  return 'Failed to load user engagement. Please try again.'
}

export async function fetchUserLoginEngagement(year: number): Promise<UserEngagementData> {
  try {
    const result = await getUserLoginEngagementCallable({ year })
    const data = result.data

    if (!data || !Array.isArray(data.months)) {
      throw new Error('Invalid response from server.')
    }

    return data
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
