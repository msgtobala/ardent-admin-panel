import type { QbankAnswerOption, QbankCorrectAnswer } from '@/types/qbank-question'

export interface QbankQuestionChapterRecord {
  documentId: string
  questionRefId: string
  questionText: string
  questionImage: string | null
  difficulty: string | null
  tags: string[]
  answerOptions: QbankAnswerOption[]
  answerOptionsCount: number
  correctAnswer: QbankCorrectAnswer | null
  correctAnswerImages: string[]
  correctAnswerSummary: string
  referenceSummary: string | null
  isActive: boolean
  sortOrder: number | null
}

export interface QbankQuestionListItem extends QbankQuestionChapterRecord {
  chapterId: string
  chapterName: string
}
