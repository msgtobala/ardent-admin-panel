import { formatDisplayDate } from "@/lib/format-display-date";
import type { GrandTest } from "@/types/grand-test";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { GrandTestStatusBadge } from "./GrandTestStatusBadge";

interface GrandTestCardProps {
  test: GrandTest;
  showEdit?: boolean;
  onEdit?: (test: GrandTest) => void;
  showLeaderboard?: boolean;
  onViewLeaderboard?: (test: GrandTest) => void;
}

interface DetailFieldProps {
  label: string;
  value: string;
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <p className="text-body-md text-black!">{value || "—"}</p>
    </div>
  );
}

function FreeAccessBadge({ isFree }: { isFree: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-body-md font-normal",
        isFree
          ? "bg-success-bg text-success-green"
          : "bg-surface-container text-on-surface-variant",
      ].join(" ")}
    >
      {isFree ? "Free" : "Paid"}
    </span>
  );
}

const editButtonClassName =
  "cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function GrandTestCard({
  test,
  showEdit = false,
  onEdit,
  showLeaderboard = false,
  onViewLeaderboard,
}: GrandTestCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface-white shadow-tier-1">
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed"
          >
            <MaterialIcon
              name="assignment"
              size={18}
              className="text-primary"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-card-title text-on-surface">
              {test.title || "Untitled test"}
            </h3>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {test.questions} questions · {test.duration} min
            </p>
          </div>
        </div>
        {showEdit && onEdit ? (
          <button
            type="button"
            aria-label={`Edit test ${test.title || test.id}`}
            onClick={() => onEdit(test)}
            className={editButtonClassName}
          >
            <MaterialIcon
              name="edit"
              size={18}
              className="text-on-surface-variant"
            />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <DetailField
          label="Start Date"
          value={formatDisplayDate(test.testStart)}
        />
        <DetailField
          label="End Date"
          value={formatDisplayDate(test.testExpiry)}
        />
        <DetailField label="No. of Questions" value={String(test.questions)} />
        {showLeaderboard ? (
          <DetailField
            label="Participants"
            value={String(test.totalParticipants)}
          />
        ) : null}
        <div className="mt-auto flex flex-col gap-3">
          {showLeaderboard && onViewLeaderboard ? (
            <button
              type="button"
              onClick={() => onViewLeaderboard(test)}
              className="inline-flex h-[34px] w-full cursor-pointer items-center justify-center gap-2 rounded-button border border-border-subtle bg-surface-white px-4 py-2 text-body-md font-medium text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <MaterialIcon
                name="leaderboard"
                size={18}
                className="text-primary"
              />
              View Leaderboard
            </button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <FreeAccessBadge isFree={test.isFree} />
            <GrandTestStatusBadge
              testStart={test.testStart}
              testExpiry={test.testExpiry}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
