import {
  isCorrectAnswerOption,
  resolveCorrectAnswerChoice,
  resolveCorrectAnswerDescription,
} from '@/lib/qbank-question-display'
import { resolveCustomCorrectAnswerImagePreviews } from '@/lib/grand-test-custom-question'
import { formatGrandTestReferenceSummary } from '@/lib/grand-test-question-references'
import type { GrandTestCustomQuestionDraft } from '@/types/grand-test'

interface GrandTestCustomQuestionDetailInlineProps {
  draft: GrandTestCustomQuestionDraft
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="whitespace-pre-wrap text-body-md !text-black">{value || '—'}</p>
    </div>
  )
}

function resolveQuestionImagePreview(draft: GrandTestCustomQuestionDraft): string | null {
  const persistedImage = draft.questionImage?.trim()
  if (persistedImage) return persistedImage

  const pendingPreview = draft.pendingQuestionImagePreviewUrl?.trim()
  if (pendingPreview) return pendingPreview

  return null
}

export function GrandTestCustomQuestionDetailInline({
  draft,
}: GrandTestCustomQuestionDetailInlineProps) {
  const correctOptionKey = draft.correctOptionKey
  const correctAnswerText = resolveCorrectAnswerChoice(
    draft.answerOptions,
    correctOptionKey,
  )
  const correctAnswerDescription = resolveCorrectAnswerDescription(
    draft.correctDescription,
    correctOptionKey,
    correctAnswerText,
  )
  const questionImagePreview = resolveQuestionImagePreview(draft)
  const correctAnswerImagePreviews = resolveCustomCorrectAnswerImagePreviews(draft)
  const referenceSummary = formatGrandTestReferenceSummary(draft.reference)

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
      {questionImagePreview ? (
        <div className="flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">Question Image</span>
          <img
            src={questionImagePreview}
            alt="Question illustration"
            className="max-h-48 w-auto max-w-full rounded-input border border-border-subtle object-contain"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-label-sm text-on-surface-variant">Answer Options</span>
        {draft.answerOptions.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {draft.answerOptions.map((answerOption, optionIndex) => {
              const isCorrect = isCorrectAnswerOption(
                answerOption,
                optionIndex,
                correctOptionKey,
              )

              return (
                <li
                  key={`${answerOption.option}-${optionIndex}`}
                  className={[
                    'rounded-input border px-3 py-2 text-body-md !text-black',
                    isCorrect
                      ? 'border-success-green bg-success-bg font-medium'
                      : 'border-border-subtle bg-surface-white',
                  ].join(' ')}
                >
                  <span className="font-semibold">{answerOption.option}. </span>
                  {answerOption.choice}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-body-md !text-black">—</p>
        )}
      </div>

      <DetailField label="Correct Answer" value={correctAnswerText} />
      <DetailField label="Correct Answer Description" value={correctAnswerDescription} />
      {referenceSummary ? (
        <DetailField label="Reference" value={referenceSummary} />
      ) : null}

      {correctAnswerImagePreviews.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-label-sm text-on-surface-variant">Correct Answer Images</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {correctAnswerImagePreviews.map((imageUrl, index) => (
              <img
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`Correct answer image ${index + 1}`}
                className="max-h-40 w-full rounded-input border border-border-subtle object-contain"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
