import type { SelectedGrandTestQuestion } from "@/types/grand-test";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface SelectedQuestionsListProps {
  questions: SelectedGrandTestQuestion[];
  disabled?: boolean;
  listMaxHeightClass?: string;
  onRemove: (documentId: string) => void;
  onView: (documentId: string) => void;
  onEditQuestion?: (documentId: string) => void;
}

const iconButtonClassName =
  "cursor-pointer rounded-lg p-1.5 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

function isCustomQuestion(question: SelectedGrandTestQuestion): boolean {
  return question.source === "custom" || question.isCustom === true;
}

function isTestOnlyOverride(question: SelectedGrandTestQuestion): boolean {
  return (
    !isCustomQuestion(question) &&
    question.source === "qbanks" &&
    question.syncWithQbank === false
  );
}

export function SelectedQuestionsList({
  questions,
  disabled = false,
  listMaxHeightClass = "max-h-[min(28rem,55vh)]",
  onRemove,
  onView,
  onEditQuestion,
}: SelectedQuestionsListProps) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-body-md text-on-surface-variant">
        No questions yet. Browse a chapter and click Add, or create a custom
        question.
      </p>
    );
  }

  return (
    <ul
      className={[
        "flex flex-col gap-2 overflow-y-auto rounded-xl border border-border-subtle bg-surface-container-low p-3",
        listMaxHeightClass,
      ].join(" ")}
    >
      {questions.map((question, index) => (
        <li
          key={question.documentId}
          className="rounded-lg border border-border-subtle bg-surface-white px-3 py-2.5"
        >
          <div className="flex items-start gap-2">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-caption font-semibold text-primary"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-label-sm font-semibold text-primary">
                  {question.questionRefId}
                </p>
                {isCustomQuestion(question) ? (
                  <span className="inline-flex rounded-full bg-info-bg px-2 py-0.5 text-caption font-medium text-on-secondary-fixed">
                    Custom
                  </span>
                ) : null}
                {isTestOnlyOverride(question) ? (
                  <span className="inline-flex rounded-full bg-warning-bg px-2 py-0.5 text-caption font-medium text-tertiary">
                    Test only
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-1 text-body-md text-on-surface">
                {question.questionText}
              </p>
              <p className="mt-1 text-caption text-on-surface-variant">
                {question.subjectName} · {question.chapterName}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                aria-label={`View details for ${question.questionRefId}`}
                disabled={disabled}
                onClick={() => onView(question.documentId)}
                className={iconButtonClassName}
              >
                <MaterialIcon
                  name="visibility"
                  size={16}
                  className="text-on-surface-variant"
                />
              </button>
              {onEditQuestion ? (
                <button
                  type="button"
                  aria-label={`Edit ${question.questionRefId}`}
                  disabled={disabled}
                  onClick={() => onEditQuestion(question.documentId)}
                  className={iconButtonClassName}
                >
                  <MaterialIcon
                    name="edit"
                    size={16}
                    className="text-on-surface-variant"
                  />
                </button>
              ) : null}
              <button
                type="button"
                aria-label={`Remove question ${question.questionRefId}`}
                onClick={() => onRemove(question.documentId)}
                disabled={disabled}
                className={iconButtonClassName}
              >
                <MaterialIcon
                  name="close"
                  size={16}
                  className="text-on-surface-variant"
                />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
