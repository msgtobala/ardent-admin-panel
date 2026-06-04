import { httpsCallable } from 'firebase/functions'
import { functions } from './functions'

interface MakeStorageAssetPublicInput {
  storagePath: string
}

interface MakeStorageAssetPublicResult {
  publicUrl: string
}

const makeStorageAssetPublicCallable = httpsCallable<
  MakeStorageAssetPublicInput,
  MakeStorageAssetPublicResult
>(functions, 'makeStorageAssetPublic')

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/not-found': 'File was not found in storage. Try uploading again.',
  'functions/invalid-argument': 'Invalid storage path.',
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

  return 'Failed to publish file. Please try again.'
}

export async function makeStorageAssetPublic(storagePath: string): Promise<string> {
  try {
    const result = await makeStorageAssetPublicCallable({ storagePath })
    const publicUrl = result.data?.publicUrl

    if (!publicUrl || typeof publicUrl !== 'string') {
      throw new Error('Invalid response from server.')
    }

    return publicUrl
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
