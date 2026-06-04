import { httpsCallable } from 'firebase/functions'
import type { CreateStudentInput, CreateStudentResult } from '@/types/student'
import { functions } from './functions'

const createStudentCallable = httpsCallable<CreateStudentInput, CreateStudentResult>(
  functions,
  'createStudent',
)

const CALLABLE_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'You must be signed in as an admin.',
  'functions/permission-denied': 'You do not have admin access.',
  'functions/invalid-argument': 'Invalid student details. Please check the form.',
  'functions/already-exists': 'A student with this email already exists.',
  'functions/internal': 'Failed to create student. Please try again.',
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
    if (message.toLowerCase().includes('email-already-exists')) {
      return 'A student with this email already exists.'
    }

    return message || 'Failed to create student. Please try again.'
  }

  return 'Failed to create student. Please try again.'
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<CreateStudentResult> {
  try {
    const result = await createStudentCallable({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      state: input.state?.trim() || undefined,
      academicDetails: input.academicDetails
        ? {
            collegeState: input.academicDetails.collegeState?.trim() ?? '',
            collegeName: input.academicDetails.collegeName?.trim() ?? '',
            academicYear: input.academicDetails.academicYear?.trim() ?? '',
          }
        : undefined,
      plans: input.plans,
    })

    const uid = result.data?.uid
    const passwordResetEmailSent = result.data?.passwordResetEmailSent

    if (!uid || typeof uid !== 'string') {
      throw new Error('Invalid response from server.')
    }

    return {
      uid,
      passwordResetEmailSent: passwordResetEmailSent === true,
    }
  } catch (error) {
    throw new Error(mapCallableError(error), { cause: error })
  }
}
