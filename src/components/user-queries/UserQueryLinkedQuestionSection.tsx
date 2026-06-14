import { useEffect, useState } from "react";
import { fetchFullQbankQuestionDetails } from "@/lib/qbank-references";
import {
  isCorrectAnswerOption,
  resolveCorrectAnswerChoice,
  resolveCorrectAnswerDescription,
} from "@/lib/qbank-question-display";
import type { UserQueryQuestionRefs } from "@/lib/user-query-display";
import type { FullQbankQuestionDetails } from "@/types/qbank-question";
import { CircularLoader } from "@/components/ui/CircularLoader";

interface UserQueryLinkedQuestionSectionProps {
  refs: UserQueryQuestionRefs;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-on-surface-variant">
        {label}
      </span>
      <span className="whitespace-pre-wrap wrap-break-word text-body-md text-on-surface">
        {value || "—"}
      </span>
    </div>
  );
}

function QuestionDetailsLoadingSkeleton() {
  return (
    <div
      className="relative flex flex-col gap-4"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-5 w-full max-w-md animate-pulse rounded bg-surface-container" />
      <div className="flex flex-col gap-2">
        {["a", "b", "c", "d"].map((key) => (
          <div
            key={key}
            className="h-12 animate-pulse rounded-input bg-surface-container"
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface-white/50"
        aria-hidden
      >
        <CircularLoader size="md" label="Loading question details" />
      </div>
    </div>
  );
}

export function UserQueryLinkedQuestionSection({
  refs,
}: UserQueryLinkedQuestionSectionProps) {
  const [details, setDetails] = useState<FullQbankQuestionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isCancelled = false;

    async function loadDetails() {
      setIsLoading(true);
      setError(undefined);
      setDetails(null);

      try {
        const fullDetails = await fetchFullQbankQuestionDetails(
          refs.subjectRefId,
          refs.chapterRefId,
          refs.questionRefId,
        );

        if (isCancelled) return;

        if (!fullDetails) {
          setError("Question details could not be found in the qbank.");
          return;
        }

        setDetails(fullDetails);
      } catch {
        if (isCancelled) return;
        setError("Failed to load question details. Please try again.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [refs.subjectRefId, refs.chapterRefId, refs.questionRefId]);

  const correctOptionKey = details?.correctAnswer?.option ?? "";
  const rawCorrectDescription = details?.correctAnswer?.description ?? "";
  const answerOptions = details?.answerOptions ?? [];
  const correctAnswerText = resolveCorrectAnswerChoice(
    answerOptions,
    correctOptionKey,
  );
  const correctAnswerDescription = resolveCorrectAnswerDescription(
    rawCorrectDescription,
    correctOptionKey,
    correctAnswerText,
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface px-4 py-4">
      <h3 className="text-label-sm font-medium text-on-surface-variant">
        Linked question
      </h3>

      {isLoading ? <QuestionDetailsLoadingSkeleton /> : null}

      {!isLoading && error ? (
        <p className="text-body-md text-error-red" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && details ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Question ID" value={details.questionRefId} />
          <DetailField label="Question" value={details.questionText} />
          {details.questionImage ? (
            <div className="flex flex-col gap-1">
              <span className="text-label-sm font-medium text-on-surface-variant">
                Question image
              </span>
              <img
                src={details.questionImage}
                alt="Question illustration"
                className="max-h-64 w-auto max-w-full rounded-input border border-border-subtle object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-medium text-on-surface-variant">
              Answer options
            </span>
            {answerOptions.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {answerOptions.map((answerOption, optionIndex) => {
                  const isCorrect = isCorrectAnswerOption(
                    answerOption,
                    optionIndex,
                    correctOptionKey,
                  );

                  return (
                    <li
                      key={`${answerOption.option}-${answerOption.choice}`}
                      className={[
                        "rounded-input border px-3 py-2 text-body-md text-on-surface",
                        isCorrect
                          ? "border-success-green bg-success-bg font-medium"
                          : "border-border-subtle bg-surface-white",
                      ].join(" ")}
                    >
                      <span className="font-semibold">
                        {answerOption.option}.{" "}
                      </span>
                      {answerOption.choice}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <span className="text-body-md text-on-surface">—</span>
            )}
          </div>
          <DetailField label="Correct answer" value={correctAnswerText} />
          <DetailField
            label="Correct answer description"
            value={correctAnswerDescription}
          />
        </div>
      ) : null}
    </div>
  );
}
