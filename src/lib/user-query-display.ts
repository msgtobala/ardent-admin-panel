import type {
  UserQuery,
  UserQueryContext,
  UserQueryStatus,
  UserQueryType,
} from '@/types/user-query'

const USER_QUERY_TYPE_LABELS: Record<UserQueryType, string> = {
  qbanks: 'Qbanks',
  quiz: 'Quiz',
  video: 'Video',
  payment: 'Payment',
  test_series: 'Test series',
  general: 'General',
}

const USER_QUERY_STATUS_LABELS: Record<UserQueryStatus, string> = {
  opened: 'Opened',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

const KNOWN_USER_QUERY_TYPES = new Set<string>(Object.keys(USER_QUERY_TYPE_LABELS))

const KNOWN_USER_QUERY_STATUSES = new Set<string>(
  Object.keys(USER_QUERY_STATUS_LABELS),
)

export function normalizeUserQueryType(value: string | undefined): UserQueryType {
  if (value && KNOWN_USER_QUERY_TYPES.has(value)) {
    return value as UserQueryType
  }

  return 'general'
}

export function normalizeUserQueryStatus(
  value: string | undefined,
): UserQueryStatus {
  if (value && KNOWN_USER_QUERY_STATUSES.has(value)) {
    return value as UserQueryStatus
  }

  return 'opened'
}

export function formatUserQueryType(type: UserQueryType): string {
  return USER_QUERY_TYPE_LABELS[type]
}

export function formatUserQueryStatus(status: UserQueryStatus): string {
  return USER_QUERY_STATUS_LABELS[status]
}

function joinNonEmpty(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ')
}

export function formatUserQueryContextSummary(query: UserQuery): string {
  const context = query.context
  if (!context) return '—'

  return (
    joinNonEmpty([
      context.subject?.name,
      query.type === 'qbanks' ? context.chapter?.name : context.module?.name,
    ]) || '—'
  )
}

export interface UserQueryContextDetail {
  label: string
  value: string
}

export function getUserQueryContextDetails(
  query: UserQuery,
): UserQueryContextDetail[] {
  const context = query.context
  if (!context) return []

  const details: UserQueryContextDetail[] = []

  if (context.subject?.name || context.subject?.id) {
    details.push({
      label: 'Subject',
      value: joinNonEmpty([context.subject.name, context.subject.id]),
    })
  }

  if (query.type === 'qbanks') {
    if (context.chapter?.name || context.chapter?.id) {
      details.push({
        label: 'Chapter',
        value: joinNonEmpty([
          context.chapter.name,
          context.chapter.id,
          context.chapter.moduleName,
        ]),
      })
    }

    if (context.question?.id) {
      details.push({
        label: 'Question ID',
        value: context.question.id,
      })
    }
  }

  if (query.type === 'video') {
    if (context.module?.name) {
      details.push({
        label: 'Module',
        value: context.module.name,
      })
    }

    if (context.lesson?.id) {
      details.push({
        label: 'Lesson ID',
        value: context.lesson.id,
      })
    }
  }

  return details
}

export function parseUserQueryContext(
  value: unknown,
): UserQueryContext | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as UserQueryContext
}

export interface UserQueryQuestionRefs {
  subjectRefId: string
  chapterRefId: string
  questionRefId: string
}

export interface UserQueryVideoRefs {
  subjectRefId: string
  lessonRefId: string
}

export function getUserQueryQuestionRefs(
  query: UserQuery,
): UserQueryQuestionRefs | null {
  if (query.type !== 'qbanks') return null

  const subjectRefId = query.context?.subject?.id?.trim()
  const chapterRefId = query.context?.chapter?.id?.trim()
  const questionRefId = query.context?.question?.id?.trim()

  if (!subjectRefId || !chapterRefId || !questionRefId) return null

  return { subjectRefId, chapterRefId, questionRefId }
}

export function getUserQueryVideoRefs(query: UserQuery): UserQueryVideoRefs | null {
  if (query.type !== 'video') return null

  const subjectRefId = query.context?.subject?.id?.trim()
  const lessonRefId = query.context?.lesson?.id?.trim()

  if (!subjectRefId || !lessonRefId) return null

  return { subjectRefId, lessonRefId }
}
