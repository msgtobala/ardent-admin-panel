import { describe, expect, it } from 'vitest'
import { EMPTY_QBANK_QUESTION_REFERENCE } from '@/lib/grand-test-question-references'
import { areGrandTestQuestionsUnchanged } from '@/lib/grand-test-question-sync'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'

function buildQbankQuestion(
  documentId: string,
  overrides: Partial<SelectedGrandTestQuestion> = {},
): SelectedGrandTestQuestion {
  return {
    documentId,
    questionRefId: documentId,
    label: `${documentId} — Sample question`,
    questionText: 'Sample question',
    subjectRefId: 'subject-1',
    chapterRefId: 'chapter-1',
    subjectName: 'Subject 1',
    chapterName: 'Chapter 1',
    moduleName: 'Module 1',
    source: 'qbanks',
    ...overrides,
  }
}

describe('areGrandTestQuestionsUnchanged', () => {
  it('returns true when qbank questions are identical in order', () => {
    const questions = [
      buildQbankQuestion('q-1'),
      buildQbankQuestion('q-2'),
      buildQbankQuestion('q-3'),
    ]

    expect(areGrandTestQuestionsUnchanged(questions, [...questions])).toBe(true)
  })

  it('returns false when question order changes', () => {
    const before = [buildQbankQuestion('q-1'), buildQbankQuestion('q-2')]
    const after = [buildQbankQuestion('q-2'), buildQbankQuestion('q-1')]

    expect(areGrandTestQuestionsUnchanged(before, after)).toBe(false)
  })

  it('returns false when a question is added or removed', () => {
    const before = [buildQbankQuestion('q-1')]
    const after = [buildQbankQuestion('q-1'), buildQbankQuestion('q-2')]

    expect(areGrandTestQuestionsUnchanged(before, after)).toBe(false)
  })

  it('returns false when custom question text changes', () => {
    const customDraft = {
      question: 'Original question',
      answerOptions: [
        { option: 'A', choice: 'One', sortOrder: 0 },
        { option: 'B', choice: 'Two', sortOrder: 1 },
      ],
      correctOptionKey: 'A',
      correctDescription: 'Because',
      reference: EMPTY_QBANK_QUESTION_REFERENCE,
      questionImage: null,
      correctAnswerImages: [],
    }

    const before = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft,
      }),
    ]
    const after = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft: {
          ...customDraft,
          question: 'Updated question',
        },
      }),
    ]

    expect(areGrandTestQuestionsUnchanged(before, after)).toBe(false)
  })

  it('returns false when custom question has pending image edits', () => {
    const customDraft = {
      question: 'Original question',
      answerOptions: [
        { option: 'A', choice: 'One', sortOrder: 0 },
        { option: 'B', choice: 'Two', sortOrder: 1 },
      ],
      correctOptionKey: 'A',
      correctDescription: 'Because',
      reference: EMPTY_QBANK_QUESTION_REFERENCE,
      questionImage: null,
      correctAnswerImages: [],
    }

    const before = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft,
      }),
    ]
    const after = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft: {
          ...customDraft,
          pendingQuestionImageFile: new File(['image'], 'question.png', {
            type: 'image/png',
          }),
        },
      }),
    ]

    expect(areGrandTestQuestionsUnchanged(before, after)).toBe(false)
  })

  it('returns true when unchanged custom question drafts match', () => {
    const customDraft = {
      question: 'Original question',
      answerOptions: [
        { option: 'A', choice: 'One', sortOrder: 0 },
        { option: 'B', choice: 'Two', sortOrder: 1 },
      ],
      correctOptionKey: 'A',
      correctDescription: 'Because',
      reference: EMPTY_QBANK_QUESTION_REFERENCE,
      questionImage: null,
      correctAnswerImages: [],
    }

    const before = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft,
      }),
    ]
    const after = [
      buildQbankQuestion('mcq-sub-ch-001-cus', {
        isCustom: true,
        source: 'custom',
        customDraft: { ...customDraft },
      }),
    ]

    expect(areGrandTestQuestionsUnchanged(before, after)).toBe(true)
  })
})
