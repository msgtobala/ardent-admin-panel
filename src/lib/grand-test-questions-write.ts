import { doc, type DocumentReference, type WriteBatch } from 'firebase/firestore'
import { fetchQbankQuestionDocument } from '@/lib/qbank-references'
import { transformQbankToGrandTestQuestion } from '@/lib/grand-test-question-transform'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'

export async function writeGrandTestQuestionsToBatch(
  batch: WriteBatch,
  testRef: DocumentReference,
  selectedQuestions: SelectedGrandTestQuestion[],
): Promise<void> {
  for (let index = 0; index < selectedQuestions.length; index += 1) {
    const selected = selectedQuestions[index]
    const questionDocument = await fetchQbankQuestionDocument(
      selected.subjectRefId,
      selected.chapterRefId,
      selected.questionRefId,
    )

    if (!questionDocument) {
      throw new Error(`Question ${selected.label} could not be found`)
    }

    const transformed = transformQbankToGrandTestQuestion(
      questionDocument.documentId,
      questionDocument.data,
      index + 1,
    )

    const questionRef = doc(testRef, 'questions', questionDocument.documentId)
    batch.set(questionRef, {
      ...transformed,
      subjectRefId: selected.subjectRefId,
      chapterRefId: selected.chapterRefId,
      questionRefId: selected.questionRefId,
    })
  }
}
