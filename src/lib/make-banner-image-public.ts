import { httpsCallable } from 'firebase/functions'
import { functions } from './functions'

interface MakeBannerImagePublicInput {
  storagePath: string
}

interface MakeBannerImagePublicResult {
  publicUrl: string
}

const makeBannerImagePublicCallable = httpsCallable<
  MakeBannerImagePublicInput,
  MakeBannerImagePublicResult
>(functions, 'makeBannerImagePublic')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/not-found': 'Banner image was not found in storage. Try uploading again.',
  'functions/invalid-argument': 'Invalid banner image path.',
}

function mapCallableError(error: unknown): string {
  if (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: string }).code === 'string'
  ) {
    const code = (error as { code: string }).code
    return CALLABLE_ERROR_MESSAGES[code] ?? error.message
  }

  return 'Failed to publish banner image. Please try again.'
}

export async function makeBannerImagePublic(storagePath: string): Promise<string> {
  try {
    const result = await makeBannerImagePublicCallable({ storagePath })
    const publicUrl = result.data?.publicUrl

    if (!publicUrl || typeof publicUrl !== 'string') {
      throw new Error('Invalid response from server.')
    }

    return publicUrl
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
