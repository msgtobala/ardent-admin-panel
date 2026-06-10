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

export interface QbankQuestionReference {
  bookName: string
  pageNo: string
  chapter: string
}

export interface QbankQuestionEditPayload {
  documentId: string
  questionRefId: string
  questionText: string
  questionImage: string | null
  difficulty: string | null
  tags: string[]
  answerOptions: QbankAnswerOption[]
  correctAnswer: QbankCorrectAnswer | null
  correctAnswerImages: string[]
  reference: QbankQuestionReference
  isActive: boolean
  sortOrder: number | null
}

export interface UpdateQbankQuestionInput {
  question: string
  questionImage: string | null
  difficulty?: string | null
  tags?: string[]
  answerOptions: QbankAnswerOption[]
  correctAnswer: QbankCorrectAnswer | null
  correctAnswerImages?: string[]
  reference: QbankQuestionReference
  isActive: boolean
  sortOrder: number
}

export interface CreateQbankQuestionInput extends UpdateQbankQuestionInput {
  documentId: string
}
