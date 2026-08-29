import { useEffect, useMemo, useState } from "react";
import {
  ensureSelectedQuestionHasDraft,
} from "@/lib/grand-test-custom-question";
import { getFirestoreErrorDetails } from "@/lib/firestore-error";
import {
  fetchQbankChapterOptions,
  fetchQbankQuestionOptions,
  type QbankChapterOption,
  type QbankQuestionOption,
} from "@/lib/qbank-references";
import { fetchQbankSubjects } from "@/lib/qbank-subjects";
import type { QbankSubject } from "@/types/qbank-subject";
import type { SelectedGrandTestQuestion } from "@/types/grand-test";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { SelectField, type SelectOption } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GrandTestChapterQuestionList } from "./GrandTestChapterQuestionList";
import { GrandTestCustomQuestionModal } from "./GrandTestCustomQuestionModal";
import { GrandTestQuestionDetailModal } from "./GrandTestQuestionDetailModal";
import { GrandTestTestConfigBar } from "./GrandTestTestConfigBar";
import { SelectedQuestionsList } from "./SelectedQuestionsList";

interface GrandTestQuestionPickerStepProps {
  duration: string;
  questions: string;
  selectedQuestions: SelectedGrandTestQuestion[];
  disabled?: boolean;
  durationError?: string;
  questionsError?: string;
  selectedQuestionsError?: string;
  formError?: string;
  onDurationChange: (value: string) => void;
  onQuestionsChange: (value: string) => void;
  onSelectedQuestionsChange: (questions: SelectedGrandTestQuestion[]) => void;
  onClearFormError?: () => void;
}

function filterChapterQuestions(
  questions: QbankQuestionOption[],
  searchQuery: string,
): QbankQuestionOption[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return questions;

  return questions.filter((question) => {
    const haystack = [
      question.questionRefId,
      question.questionText,
      question.label,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function GrandTestQuestionPickerStep({
  duration,
  questions,
  selectedQuestions,
  disabled = false,
  durationError,
  questionsError,
  selectedQuestionsError,
  formError,
  onDurationChange,
  onQuestionsChange,
  onSelectedQuestionsChange,
  onClearFormError,
}: GrandTestQuestionPickerStepProps) {
  const [subjectRefId, setSubjectRefId] = useState("");
  const [chapterRefId, setChapterRefId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailQuestion, setDetailQuestion] =
    useState<SelectedGrandTestQuestion | null>(null);
  const [subjects, setSubjects] = useState<QbankSubject[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([]);
  const [isCustomQuestionModalOpen, setIsCustomQuestionModalOpen] =
    useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<SelectedGrandTestQuestion | null>(null);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [chapterOptions, setChapterOptions] = useState<SelectOption[]>([]);
  const [chapterRecords, setChapterRecords] = useState<QbankChapterOption[]>([]);
  const [chapterQuestions, setChapterQuestions] = useState<
    QbankQuestionOption[]
  >([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();

  const isFormDisabled = disabled || isLoadingSubjects;

  const alreadyAddedIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.documentId)),
    [selectedQuestions],
  );

  const filteredChapterQuestions = useMemo(
    () => filterChapterQuestions(chapterQuestions, searchQuery),
    [chapterQuestions, searchQuery],
  );

  const addableFilteredQuestions = useMemo(
    () =>
      filteredChapterQuestions.filter(
        (question) => !alreadyAddedIds.has(question.documentId),
      ),
    [filteredChapterQuestions, alreadyAddedIds],
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadSubjects() {
      setIsLoadingSubjects(true);
      setLoadError(undefined);

      try {
        const loadedSubjects = await fetchQbankSubjects();
        if (isCancelled) return;

        setSubjects(loadedSubjects);
        setSubjectOptions(
          loadedSubjects.map((subject) => ({
            value: subject.id,
            label: subject.subjectName || subject.id,
          })),
        );
      } catch {
        if (!isCancelled) {
          setLoadError("Failed to load qbank subjects. Please try again.");
        }
      } finally {
        if (!isCancelled) setIsLoadingSubjects(false);
      }
    }

    loadSubjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!subjectRefId) {
      return;
    }

    let isCancelled = false;

    async function loadChapters() {
      setIsLoadingChapters(true);
      setLoadError(undefined);

      try {
        const chapters = await fetchQbankChapterOptions(subjectRefId);
        if (isCancelled) return;

        setChapterRecords(chapters);
        setChapterOptions(
          chapters.map((chapter) => ({
            value: chapter.id,
            label: chapter.chapterName,
          })),
        );
      } catch {
        if (!isCancelled) {
          setLoadError("Failed to load chapters for the selected subject.");
        }
      } finally {
        if (!isCancelled) setIsLoadingChapters(false);
      }
    }

    loadChapters();

    return () => {
      isCancelled = true;
    };
  }, [subjectRefId]);

  useEffect(() => {
    if (!subjectRefId || !chapterRefId) {
      return;
    }

    let isCancelled = false;

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      setLoadError(undefined);

      try {
        const loadedQuestions = await fetchQbankQuestionOptions(
          subjectRefId,
          chapterRefId,
        );
        if (isCancelled) return;

        setChapterQuestions(loadedQuestions);
        setSearchQuery("");
      } catch {
        if (!isCancelled) {
          setLoadError("Failed to load questions for the selected chapter.");
        }
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false);
      }
    }

    loadQuestions();

    return () => {
      isCancelled = true;
    };
  }, [subjectRefId, chapterRefId]);

  const chapterSelectDisabled = useMemo(
    () => isFormDisabled || isLoadingChapters || !subjectRefId,
    [isFormDisabled, isLoadingChapters, subjectRefId],
  );

  const selectedSubject =
    subjects.find((subject) => subject.id === subjectRefId) ?? null;
  const selectedSubjectLabel = selectedSubject?.subjectName || subjectRefId;
  const selectedChapterLabel =
    chapterOptions.find((option) => option.value === chapterRefId)?.label ?? "";
  const selectedChapterModuleName =
    chapterRecords.find((chapter) => chapter.id === chapterRefId)?.moduleName ??
    "";

  const parsedTarget = Number(questions);
  const targetCount =
    Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : 0;

  function handleOpenCustomQuestionModal() {
    if (!subjectRefId || !chapterRefId) return;
    setEditingQuestion(null);
    setIsCustomQuestionModalOpen(true);
    onClearFormError?.();
  }

  function handleCloseCustomQuestionModal() {
    setIsCustomQuestionModalOpen(false);
    setEditingQuestion(null);
  }

  function handleAddCustomQuestion(question: SelectedGrandTestQuestion) {
    onSelectedQuestionsChange([...selectedQuestions, question]);
    onClearFormError?.();
  }

  async function handleEditQuestion(documentId: string) {
    const question = selectedQuestions.find(
      (item) => item.documentId === documentId,
    );
    if (!question || isPreparingEdit) return;

    setIsPreparingEdit(true);
    setLoadError(undefined);
    onClearFormError?.();

    try {
      const questionWithDraft = await ensureSelectedQuestionHasDraft(question);
      onSelectedQuestionsChange(
        selectedQuestions.map((item) =>
          item.documentId === questionWithDraft.documentId
            ? questionWithDraft
            : item,
        ),
      );
      setEditingQuestion(questionWithDraft);
      setIsCustomQuestionModalOpen(true);
    } catch (error) {
      const details = getFirestoreErrorDetails(
        error,
        "Failed to open question for editing. Please try again.",
      );
      setLoadError(details.message);
    } finally {
      setIsPreparingEdit(false);
    }
  }

  function handleSaveQuestion(question: SelectedGrandTestQuestion) {
    onSelectedQuestionsChange(
      selectedQuestions.map((item) =>
        item.documentId === question.documentId ? question : item,
      ),
    );
    onClearFormError?.();
  }

  function buildSelectedQuestion(
    question: QbankQuestionOption,
  ): SelectedGrandTestQuestion {
    return {
      documentId: question.documentId,
      questionRefId: question.questionRefId,
      label: question.label,
      questionText: question.questionText,
      subjectRefId,
      chapterRefId,
      subjectName: selectedSubjectLabel || subjectRefId,
      chapterName: selectedChapterLabel || chapterRefId,
      moduleName: selectedChapterModuleName,
      source: "qbanks",
      syncWithQbank: true,
    };
  }

  function handleAddQuestion(documentId: string) {
    if (alreadyAddedIds.has(documentId)) return;

    const question = chapterQuestions.find(
      (item) => item.documentId === documentId,
    );
    if (!question) return;

    onSelectedQuestionsChange([
      ...selectedQuestions,
      buildSelectedQuestion(question),
    ]);
    onClearFormError?.();
  }

  function handleAddAllFromChapter() {
    if (addableFilteredQuestions.length === 0) return;

    const existingIds = new Set(
      selectedQuestions.map((question) => question.documentId),
    );
    const nextQuestions = [...selectedQuestions];

    for (const question of addableFilteredQuestions) {
      if (existingIds.has(question.documentId)) continue;
      nextQuestions.push(buildSelectedQuestion(question));
      existingIds.add(question.documentId);
    }

    onSelectedQuestionsChange(nextQuestions);
    onClearFormError?.();
  }

  function handleRemoveQuestion(documentId: string) {
    onSelectedQuestionsChange(
      selectedQuestions.filter(
        (question) => question.documentId !== documentId,
      ),
    );
    onClearFormError?.();
  }

  function handleClearAll() {
    onSelectedQuestionsChange([]);
    onClearFormError?.();
  }

  function handleViewChapterQuestion(documentId: string) {
    const question = chapterQuestions.find(
      (item) => item.documentId === documentId,
    );
    if (!question) return;

    setDetailQuestion(buildSelectedQuestion(question));
  }

  function handleViewSelectedQuestion(documentId: string) {
    const question = selectedQuestions.find(
      (item) => item.documentId === documentId,
    );
    if (!question) return;

    setDetailQuestion(question);
  }

  return (
    <div className="flex flex-col gap-gutter">
      <GrandTestTestConfigBar
        duration={duration}
        questions={questions}
        selectedCount={selectedQuestions.length}
        disabled={disabled}
        durationError={durationError}
        questionsError={questionsError}
        onDurationChange={onDurationChange}
        onQuestionsChange={onQuestionsChange}
      />

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="flex flex-col gap-gutter rounded-xl border border-border-subtle bg-surface-white p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-card-title text-on-surface">
              Browse questions
            </h3>
            <p className="text-body-md text-on-surface-variant">
              Pick a subject and chapter, then add questions one at a time or in
              bulk.
            </p>
          </div>

          <div className="grid gap-gutter sm:grid-cols-2">
            <SelectField
              id="grand-test-subject"
              label="Subject"
              value={subjectRefId}
              options={subjectOptions}
              disabled={isFormDisabled}
              placeholder={
                isLoadingSubjects ? "Loading subjects..." : "Select a subject"
              }
              onChange={(value) => {
                setSubjectRefId(value);
                setChapterRefId("");
                setChapterOptions([]);
                setChapterRecords([]);
                setChapterQuestions([]);
                setSearchQuery("");
                onClearFormError?.();
              }}
            />

            <SelectField
              id="grand-test-chapter"
              label="Chapter"
              value={chapterRefId}
              options={chapterOptions}
              disabled={chapterSelectDisabled}
              placeholder={
                !subjectRefId
                  ? "Select a subject first"
                  : isLoadingChapters
                    ? "Loading chapters..."
                    : "Select a chapter"
              }
              onChange={(value) => {
                setChapterRefId(value);
                setChapterQuestions([]);
                setSearchQuery("");
                onClearFormError?.();
              }}
            />
          </div>

          {chapterRefId ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <TextField
                    id="grand-test-question-search"
                    label="Search questions"
                    type="search"
                    value={searchQuery}
                    disabled={disabled || isLoadingQuestions}
                    placeholder="Search by ID or question text"
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    disabled ||
                    isLoadingQuestions ||
                    addableFilteredQuestions.length === 0
                  }
                  onClick={handleAddAllFromChapter}
                  className="shrink-0 gap-2"
                >
                  <MaterialIcon name="playlist_add" size={16} />
                  Add all ({addableFilteredQuestions.length})
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-label-sm text-on-surface-variant">
                  {isLoadingQuestions
                    ? "Loading questions..."
                    : `${filteredChapterQuestions.length} shown · ${addableFilteredQuestions.length} available to add`}
                </span>
              </div>

              {isLoadingQuestions ? (
                <p className="rounded-xl border border-border-subtle px-4 py-6 text-center text-body-md text-on-surface-variant">
                  Loading questions...
                </p>
              ) : (
                <GrandTestChapterQuestionList
                  questions={filteredChapterQuestions}
                  alreadyAddedIds={alreadyAddedIds}
                  disabled={disabled}
                  onAdd={handleAddQuestion}
                  onView={handleViewChapterQuestion}
                />
              )}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-body-md text-on-surface-variant">
              Select a subject and chapter to browse questions.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-card-title text-on-surface">Test basket</h3>
                <p className="text-body-md text-on-surface-variant">
                  {targetCount > 0
                    ? `${selectedQuestions.length} of ${targetCount} questions selected`
                    : `${selectedQuestions.length} questions selected`}
                </p>
              </div>
              {selectedQuestions.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={handleClearAll}
                  className="shrink-0 gap-1 px-3 py-1.5 text-label-sm"
                >
                  Clear all
                </Button>
              ) : null}
            </div>

            <SelectedQuestionsList
              questions={selectedQuestions}
              disabled={disabled || isPreparingEdit}
              onRemove={handleRemoveQuestion}
              onView={handleViewSelectedQuestion}
              onEditQuestion={handleEditQuestion}
            />

            {selectedQuestionsError ? (
              <p className="text-label-sm text-error-red" role="alert">
                {selectedQuestionsError}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={disabled || !subjectRefId || !chapterRefId}
              onClick={handleOpenCustomQuestionModal}
              className="gap-2"
            >
              <MaterialIcon name="edit_note" size={16} />
              Add custom question
            </Button>
          </div>
        </section>
      </div>

      {loadError || formError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {loadError ?? formError}
        </p>
      ) : null}

      <GrandTestQuestionDetailModal
        isOpen={detailQuestion !== null}
        question={detailQuestion}
        onClose={() => setDetailQuestion(null)}
      />

      {isCustomQuestionModalOpen &&
      (editingQuestion || (subjectRefId && chapterRefId)) ? (
        <GrandTestCustomQuestionModal
          isOpen={isCustomQuestionModalOpen}
          subjectRefId={editingQuestion?.subjectRefId ?? subjectRefId}
          chapterRefId={editingQuestion?.chapterRefId ?? chapterRefId}
          subjectName={
            editingQuestion?.subjectName ?? selectedSubjectLabel
          }
          chapterName={
            editingQuestion?.chapterName ?? selectedChapterLabel
          }
          moduleName={
            editingQuestion?.moduleName ?? selectedChapterModuleName
          }
          mcqMid={selectedSubject?.mcqMid ?? null}
          disabled={disabled}
          editingQuestion={editingQuestion}
          onClose={handleCloseCustomQuestionModal}
          onAdd={handleAddCustomQuestion}
          onSave={handleSaveQuestion}
        />
      ) : null}
    </div>
  );
}
