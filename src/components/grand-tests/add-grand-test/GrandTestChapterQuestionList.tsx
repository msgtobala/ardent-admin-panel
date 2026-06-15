import type { QbankQuestionOption } from "@/lib/qbank-references";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface GrandTestChapterQuestionListProps {
  questions: QbankQuestionOption[];
  alreadyAddedIds: Set<string>;
  disabled?: boolean;
  listMaxHeightClass?: string;
  onAdd: (documentId: string) => void;
  onView: (documentId: string) => void;
}

const iconButtonClassName =
  "cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

export function GrandTestChapterQuestionList({
  questions,
  alreadyAddedIds,
  disabled = false,
  listMaxHeightClass = "max-h-[min(28rem,55vh)]",
  onAdd,
  onView,
}: GrandTestChapterQuestionListProps) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
        No questions match your search in this chapter.
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
      {questions.map((question) => {
        const isAlreadyAdded = alreadyAddedIds.has(question.documentId);

        return (
          <li
            key={question.documentId}
            className={[
              "rounded-lg border border-border-subtle bg-surface-white px-3 py-2.5",
              isAlreadyAdded ? "opacity-70" : "",
            ].join(" ")}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-label-sm font-semibold text-primary">
                    {question.questionRefId}
                  </p>
                  {isAlreadyAdded ? (
                    <span className="inline-flex rounded-full bg-success-bg px-2 py-0.5 text-caption font-medium text-success-green">
                      Added
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-body-md text-on-surface">
                  {question.questionText}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`View details for ${question.questionRefId}`}
                  disabled={disabled}
                  onClick={() => onView(question.documentId)}
                  className={iconButtonClassName}
                >
                  <MaterialIcon
                    name="visibility"
                    size={18}
                    className="text-on-surface-variant"
                  />
                </button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || isAlreadyAdded}
                  onClick={() => onAdd(question.documentId)}
                  className="gap-1 px-3 py-1.5 text-label-sm"
                >
                  <MaterialIcon name="add" size={16} />
                  Add
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
