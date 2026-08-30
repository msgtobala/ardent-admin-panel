import { describe, expect, it } from 'vitest'

import {
  buildGrandTestAnswerKeyPdfTableData,
  buildGrandTestAnswerKeyRows,
  buildGrandTestQuestionsFilename,
} from '@/lib/export-grand-test-questions'
import type { GrandTestExportQuestion } from '@/lib/fetch-grand-test-questions'
import type { GrandTest } from '@/types/grand-test'

function createTest(overrides: Partial<GrandTest> = {}): GrandTest {
  return {
    id: 'test-abc123',
    title: 'Example Test',
    testStart: new Date('2026-06-01T09:00:00.000Z'),
    testExpiry: new Date('2026-06-11T23:59:00.000Z'),
    duration: 120,
    questions: 2,
    correctMark: 4,
    negativeMark: -1,
    isFree: false,
    isActive: true,
    isLeaderboardPublished: true,
    totalParticipants: 10,
    createdAt: new Date('2026-05-01T09:00:00.000Z'),
    ...overrides,
  }
}

function createQuestion(
  overrides: Partial<GrandTestExportQuestion> = {},
): GrandTestExportQuestion {
  return {
    order: 0,
    questionNumber: 1,
    question: 'What is the capital of India?',
    questionImageUrl: null,
    options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'],
    correctOptionIndex: 1,
    correctOptionLabel: 'B',
    correctDescription: 'Delhi is the capital of India.',
    correctAnswerImageUrls: [],
    ...overrides,
  }
}

describe('export grand test questions helpers', () => {
  it('builds answer key rows with explanations', () => {
    const rows = buildGrandTestAnswerKeyRows([
      createQuestion(),
      createQuestion({
        questionNumber: 2,
        correctOptionLabel: 'C',
        correctDescription: '',
      }),
    ])

    expect(rows).toEqual([
      {
        questionNumber: 1,
        answer: 'B',
        explanation: 'Delhi is the capital of India.',
      },
      {
        questionNumber: 2,
        answer: 'C',
        explanation: '—',
      },
    ])
  })

  it('builds pdf table data for the answer key', () => {
    const { head, body } = buildGrandTestAnswerKeyPdfTableData([
      {
        questionNumber: 1,
        answer: 'A',
        explanation: 'Because option A is correct.',
      },
    ])

    expect(head).toEqual([['Q#', 'Answer', 'Explanation']])
    expect(body).toEqual([['1', 'A', 'Because option A is correct.']])
  })

  it('builds a lowercase filename with underscores and no special characters', () => {
    expect(
      buildGrandTestQuestionsFilename(createTest({ title: 'Grand Test - 1' })),
    ).toBe('grand_test_1.pdf')

    expect(
      buildGrandTestQuestionsFilename(
        createTest({ title: 'Master Leader Board Test -12' }),
      ),
    ).toBe('master_leader_board_test_12.pdf')
  })

  it('falls back to untitled when the title is empty', () => {
    const filename = buildGrandTestQuestionsFilename(createTest({ title: '   ' }))

    expect(filename).toBe('untitled.pdf')
  })
})
