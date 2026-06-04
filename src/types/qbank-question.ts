export interface QbankAnswerOption {
  option: string
  choice: string
  sortOrder: number
}

export interface QbankCorrectAnswer {
  option: string
  description: string
}

export interface FullQbankQuestionDetails {
  documentId: string
  questionRefId: string
  questionText: string
  questionImage: string | null
  difficulty: string | null
  tags: string[]
  answerOptions: QbankAnswerOption[]
  correctAnswer: QbankCorrectAnswer | null
  referenceSummary: string | null
}
