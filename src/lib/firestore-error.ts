export interface FirestoreErrorDetails {
  message: string
  indexUrl?: string
}

const INDEX_URL_PATTERN =
  /https:\/\/console\.firebase\.google\.com[^\s)]+/i

export function getFirestoreErrorDetails(
  error: unknown,
  fallbackMessage = 'Failed to load plans. Please try again.',
): FirestoreErrorDetails {
  if (!error || typeof error !== 'object') {
    return { message: fallbackMessage }
  }

  const firebaseError = error as { code?: string; message?: string }
  const rawMessage = firebaseError.message ?? ''
  const errorText =
    rawMessage +
    (error instanceof Error && error.stack ? ` ${error.stack}` : '') +
    (typeof error === 'object' ? ` ${JSON.stringify(error)}` : '')
  const indexUrl = errorText.match(INDEX_URL_PATTERN)?.[0]

  if (indexUrl) {
    return {
      message:
        'This query requires a Firestore composite index. Create the index in Firebase Console, then retry.',
      indexUrl,
    }
  }

  if (firebaseError.code === 'failed-precondition' && rawMessage.trim()) {
    return { message: rawMessage }
  }

  if (rawMessage.trim()) {
    return { message: rawMessage }
  }

  return { message: fallbackMessage }
}
