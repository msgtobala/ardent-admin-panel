import type { User } from 'firebase/auth'

export async function checkIsAdmin(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult(true)
  return tokenResult.claims.admin === true
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
}

export function mapAuthError(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? 'Sign in failed. Please try again.'
}
