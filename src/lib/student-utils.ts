import type { Student } from '@/types/student'

export interface AuthenticationMethodDisplay {
  label: string
  icon: string
}

function normalizeAuthenticationMethodKey(authenticationMethod: string): string {
  return authenticationMethod.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

export function isPhoneAuthenticationMethod(authenticationMethod: string): boolean {
  return normalizeAuthenticationMethodKey(authenticationMethod) === 'phone'
}

export function isEmailAuthenticationMethod(authenticationMethod: string): boolean {
  const normalized = normalizeAuthenticationMethodKey(authenticationMethod)

  if (normalized === 'google' || normalized.includes('google')) return true

  return (
    normalized === 'emailpassword' ||
    normalized === 'email' ||
    normalized === 'password'
  )
}

export function canEditStudentEmail(authenticationMethod: string): boolean {
  return !isEmailAuthenticationMethod(authenticationMethod)
}

export function canEditStudentPhone(authenticationMethod: string): boolean {
  return !isPhoneAuthenticationMethod(authenticationMethod)
}

export function getAuthenticationMethodDisplay(
  authenticationMethod: string,
): AuthenticationMethodDisplay {
  const normalized = normalizeAuthenticationMethodKey(authenticationMethod)

  if (normalized === 'phone') {
    return { label: 'Phone', icon: 'phone' }
  }

  if (normalized === 'google' || normalized.includes('google')) {
    return { label: 'Google', icon: 'account_circle' }
  }

  if (
    normalized === 'emailpassword' ||
    normalized === 'email' ||
    normalized === 'password'
  ) {
    return { label: 'Email', icon: 'mail' }
  }

  if (!authenticationMethod.trim()) {
    return { label: 'Unknown', icon: 'help_outline' }
  }

  return { label: authenticationMethod.trim(), icon: 'help_outline' }
}

export function getStudentContactValue(student: Student): string {
  if (isPhoneAuthenticationMethod(student.authenticationMethod)) {
    return student.phone?.trim() || '—'
  }

  return student.email?.trim() || '—'
}

export function getStudentContactCopyValue(student: Student): string | null {
  if (isPhoneAuthenticationMethod(student.authenticationMethod)) {
    const phone = student.phone?.trim()
    return phone || null
  }

  const email = student.email?.trim()
  return email || null
}

export function getStudentDisplayName(student: Student): string {
  return student.name.trim() || '—'
}

export type StudentSearchField = 'name' | 'email' | 'phone' | 'uid'

export function resolveStudentSearchField(searchQuery: string): StudentSearchField {
  const trimmedQuery = searchQuery.trim()
  if (!trimmedQuery) return 'name'

  if (trimmedQuery.includes('@')) return 'email'

  const digitsOnly = trimmedQuery.replace(/\D/g, '')
  if (digitsOnly.length >= 6 && /^[\d\s+\-()]+$/.test(trimmedQuery)) {
    return 'phone'
  }

  if (/^[a-zA-Z0-9]{20,}$/.test(trimmedQuery) && !trimmedQuery.includes(' ')) {
    return 'uid'
  }

  return 'name'
}
