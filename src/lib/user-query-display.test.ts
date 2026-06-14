import { describe, expect, it } from 'vitest'
import {
  formatUserQueryContextSummary,
  formatUserQueryType,
  getUserQueryQuestionRefs,
  getUserQueryVideoRefs,
  normalizeUserQueryStatus,
  normalizeUserQueryType,
} from '@/lib/user-query-display'
import { mapUserQueryDoc } from '@/lib/user-queries'
import type { UserQuery } from '@/types/user-query'

describe('user query display helpers', () => {
  it('formats known query types and defaults unknown values', () => {
    expect(formatUserQueryType('qbanks')).toBe('Qbanks')
    expect(formatUserQueryType('test_series')).toBe('Test series')
    expect(normalizeUserQueryType('unknown')).toBe('general')
    expect(normalizeUserQueryStatus(undefined)).toBe('opened')
    expect(normalizeUserQueryStatus('resolved')).toBe('resolved')
    expect(normalizeUserQueryStatus('rejected')).toBe('rejected')
  })

  it('formats qbanks and video context summaries', () => {
    const qbankQuery: UserQuery = {
      id: 'ticket-1',
      userId: 'user-1',
      type: 'qbanks',
      description: 'Issue',
      status: 'opened',
      createdAt: new Date('2026-05-12'),
      context: {
        subject: { id: 'anatomy', name: 'Anatomy' },
        chapter: { id: 'ch-1', name: 'Upper Limb' },
      },
    }

    const videoQuery: UserQuery = {
      id: 'ticket-2',
      userId: 'user-1',
      type: 'video',
      description: 'Issue',
      status: 'opened',
      createdAt: new Date('2026-05-12'),
      context: {
        subject: { id: 'phys', name: 'Physiology' },
        module: { name: 'Cardio' },
      },
    }

    expect(formatUserQueryContextSummary(qbankQuery)).toBe('Anatomy · Upper Limb')
    expect(formatUserQueryContextSummary(videoQuery)).toBe('Physiology · Cardio')
    expect(formatUserQueryContextSummary({ ...qbankQuery, context: undefined })).toBe(
      '—',
    )
  })

  it('extracts linked question and video refs from ticket context', () => {
    const qbankQuery: UserQuery = {
      id: 'ticket-1',
      userId: 'user-1',
      type: 'qbanks',
      description: 'Issue',
      status: 'opened',
      createdAt: new Date('2026-05-12'),
      context: {
        subject: { id: 'anatomy', name: 'Anatomy' },
        chapter: { id: 'ch-1', name: 'Upper Limb' },
        question: { id: 'AN-CH-001' },
      },
    }

    const videoQuery: UserQuery = {
      id: 'ticket-2',
      userId: 'user-1',
      type: 'video',
      description: 'Issue',
      status: 'opened',
      createdAt: new Date('2026-05-12'),
      context: {
        subject: { id: 'phys', name: 'Physiology' },
        module: { name: 'Cardio' },
        lesson: { id: 'lesson-9' },
      },
    }

    expect(getUserQueryQuestionRefs(qbankQuery)).toEqual({
      subjectRefId: 'anatomy',
      chapterRefId: 'ch-1',
      questionRefId: 'AN-CH-001',
    })
    expect(getUserQueryQuestionRefs(videoQuery)).toBeNull()
    expect(getUserQueryQuestionRefs({ ...qbankQuery, type: 'general' })).toBeNull()
    expect(
      getUserQueryQuestionRefs({
        ...qbankQuery,
        context: { ...qbankQuery.context, question: undefined },
      }),
    ).toBeNull()

    expect(getUserQueryVideoRefs(videoQuery)).toEqual({
      subjectRefId: 'phys',
      lessonRefId: 'lesson-9',
    })
    expect(getUserQueryVideoRefs(qbankQuery)).toBeNull()
    expect(
      getUserQueryVideoRefs({
        ...videoQuery,
        context: { subject: { id: 'phys' } },
      }),
    ).toBeNull()
  })
})

describe('mapUserQueryDoc', () => {
  it('maps firestore document fields with defaults', () => {
    const createdAt = {
      toDate: () => new Date('2026-06-14T10:00:00Z'),
    }

    const query = mapUserQueryDoc({
      id: 'doc-1',
      data: () => ({
        id: 'doc-1',
        userId: 'user-42',
        type: 'payment',
        description: 'Payment failed',
        status: 'opened',
        createdAt,
        context: {
          subject: { name: 'Ignored for payment' },
        },
      }),
    } as never)

    expect(query.id).toBe('doc-1')
    expect(query.userId).toBe('user-42')
    expect(query.type).toBe('payment')
    expect(query.description).toBe('Payment failed')
    expect(query.status).toBe('opened')
    expect(query.createdAt.toISOString()).toBe(
      new Date('2026-06-14T10:00:00Z').toISOString(),
    )
  })
})
