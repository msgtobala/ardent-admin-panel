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
import type { GrandTestQuestionWrite, SelectedGrandTestQuestion } from '@/types/grand-test'

function buildGrandTestQuestionMetadata(
  selected: SelectedGrandTestQuestion,
): Pick<GrandTestQuestionWrite, 'subject' | 'chapter' | 'module'> {
  return {
    subject: {
      id: selected.subjectRefId,
      name: selected.subjectName,
    },
    chapter: {
      id: selected.chapterRefId,
      name: selected.chapterName,
    },
    module: selected.moduleName,
  }
}

export async function writeGrandTestQuestionsToBatch(
  batch: WriteBatch,
  testRef: DocumentReference,
  selectedQuestions: SelectedGrandTestQuestion[],
): Promise<void> {
  const reservedQuestionIds = new Set<string>()

  for (let index = 0; index < selectedQuestions.length; index += 1) {
    const selected = selectedQuestions[index]
    const metadata = buildGrandTestQuestionMetadata(selected)

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
          moduleName: selected.moduleName,
          questionRefId: questionId,
        },
      )

      const transformed = transformCustomDraftToGrandTestQuestion(
        questionId,
        preparedDraft,
        index + 1,
      )

      batch.set(doc(testRef, 'questions', questionId), {
        ...transformed,
        ...metadata,
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
      ...metadata,
      ...(references ? { references } : {}),
      questionRefId: selected.questionRefId,
    })
  }
}
