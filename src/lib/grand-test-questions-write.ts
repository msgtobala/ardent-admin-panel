import { doc, type DocumentReference, type WriteBatch } from 'firebase/firestore'
import { isCustomQbankQuestionId } from '@/lib/qbank-question-id'
import {
  isPendingCustomQuestionId,
  prepareCustomQuestionDraftImages,
  resolveCustomGrandTestQuestionId,
  shouldWriteCustomQuestionToTestOnly,
  transformCustomDraftToGrandTestQuestion,
} from '@/lib/grand-test-custom-question'
import { fetchQbankQuestionDocument } from '@/lib/qbank-references'
import { extractReferencesFromQbankDoc } from '@/lib/grand-test-question-references'
import { transformQbankToGrandTestQuestion } from '@/lib/grand-test-question-transform'
import type { SelectedGrandTestQuestion } from '@/types/grand-test'

export async function writeGrandTestQuestionsToBatch(
  batch: WriteBatch,
  testRef: DocumentReference,
  selectedQuestions: SelectedGrandTestQuestion[],
): Promise<void> {
  const reservedQuestionIds = new Set<string>()

  for (let index = 0; index < selectedQuestions.length; index += 1) {
    const selected = selectedQuestions[index]

    if (shouldWriteCustomQuestionToTestOnly(selected)) {
      let questionId = selected.documentId

      if (isPendingCustomQuestionId(questionId) || !isCustomQbankQuestionId(questionId)) {
        questionId = await resolveCustomGrandTestQuestionId({
          subjectId: selected.subjectRefId,
          chapterId: selected.chapterRefId,
          subjectName: selected.subjectName,
          chapterName: selected.chapterName,
          reservedIds: reservedQuestionIds,
        })
      }

      reservedQuestionIds.add(questionId)

      const preparedDraft = await prepareCustomQuestionDraftImages(
        selected.customDraft,
        {
          subjectId: selected.subjectRefId,
          chapterId: selected.chapterRefId,
          moduleName: selected.subjectName,
          questionRefId: questionId,
        },
      )

      const transformed = transformCustomDraftToGrandTestQuestion(
        questionId,
        preparedDraft,
        index + 1,
        selected.subjectName,
      )

      batch.set(doc(testRef, 'questions', questionId), {
        ...transformed,
        subjectRefId: selected.subjectRefId,
        chapterRefId: selected.chapterRefId,
        questionRefId: questionId,
      })
      continue
    }

    const questionDocument = await fetchQbankQuestionDocument(
      selected.subjectRefId,
      selected.chapterRefId,
      selected.questionRefId,
    )

    if (!questionDocument) {
      throw new Error(`Question ${selected.label} could not be found`)
    }

    reservedQuestionIds.add(questionDocument.documentId)

    const transformed = transformQbankToGrandTestQuestion(
      questionDocument.documentId,
      questionDocument.data,
      index + 1,
    )

    const references = extractReferencesFromQbankDoc(questionDocument.data)

    batch.set(doc(testRef, 'questions', questionDocument.documentId), {
      ...transformed,
      ...(references ? { references } : {}),
      subjectRefId: selected.subjectRefId,
      chapterRefId: selected.chapterRefId,
      questionRefId: selected.questionRefId,
    })
  }
}
