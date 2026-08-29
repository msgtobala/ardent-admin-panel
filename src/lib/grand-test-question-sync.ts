import { isPendingCustomQuestionId } from '@/lib/grand-test-custom-question'
import type {
  GrandTestCustomQuestionDraft,
  SelectedGrandTestQuestion,
} from '@/types/grand-test'

function areAnswerOptionsEqual(
  left: GrandTestCustomQuestionDraft['answerOptions'],
  right: GrandTestCustomQuestionDraft['answerOptions'],
): boolean {
  if (left.length !== right.length) return false

  return left.every((option, index) => {
    const other = right[index]
    return (
      option.option === other.option &&
      option.choice === other.choice &&
      option.sortOrder === other.sortOrder
    )
  })
}

function areCustomQuestionReferencesEqual(
  left: GrandTestCustomQuestionDraft['reference'],
  right: GrandTestCustomQuestionDraft['reference'],
): boolean {
  return (
    left.bookName === right.bookName &&
    left.pageNo === right.pageNo &&
    left.chapter === right.chapter
  )
}

function isCustomQuestionDraftDirty(
  before: SelectedGrandTestQuestion,
  after: SelectedGrandTestQuestion,
): boolean {
  if (isPendingCustomQuestionId(after.documentId)) return true

  const afterDraft = after.customDraft
  if (!afterDraft) return true

  if (afterDraft.pendingQuestionImageFile) return true
  if (afterDraft.pendingCorrectAnswerImages?.length) return true
  if (afterDraft.removedStorageImageUrls?.length) return true
  if (afterDraft.removedCorrectAnswerSlotIndices?.length) return true

  const beforeDraft = before.customDraft
  if (!beforeDraft) return true

  if (afterDraft.question !== beforeDraft.question) return true
  if (afterDraft.correctOptionKey !== beforeDraft.correctOptionKey) return true
  if (afterDraft.correctDescription !== beforeDraft.correctDescription) return true
  if (afterDraft.questionImage !== beforeDraft.questionImage) return true
  if (
    JSON.stringify(afterDraft.correctAnswerImages) !==
    JSON.stringify(beforeDraft.correctAnswerImages)
  ) {
    return true
  }
  if (!areAnswerOptionsEqual(afterDraft.answerOptions, beforeDraft.answerOptions)) {
    return true
  }
  if (!areCustomQuestionReferencesEqual(afterDraft.reference, beforeDraft.reference)) {
    return true
  }

  return false
}

function isSameGrandTestQuestionSelection(
  before: SelectedGrandTestQuestion,
  after: SelectedGrandTestQuestion,
): boolean {
  if (before.documentId !== after.documentId) return false
  if (before.subjectRefId !== after.subjectRefId) return false
  if (before.chapterRefId !== after.chapterRefId) return false
  if (before.questionRefId !== after.questionRefId) return false

  if (after.isCustom && after.customDraft) {
    return !isCustomQuestionDraftDirty(before, after)
  }

  return true
}

export function areGrandTestQuestionsUnchanged(
  before: SelectedGrandTestQuestion[],
  after: SelectedGrandTestQuestion[],
): boolean {
  if (before.length !== after.length) return false

  for (let index = 0; index < before.length; index += 1) {
    if (!isSameGrandTestQuestionSelection(before[index], after[index])) {
      return false
    }
  }

  return true
}
