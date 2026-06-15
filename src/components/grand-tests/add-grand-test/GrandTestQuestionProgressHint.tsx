import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface GrandTestQuestionProgressHintProps {
  selectedCount: number
  targetCount: number
  duration: string
}

function resolveDurationValid(duration: string): boolean {
  const parsed = Number(duration)
  return duration.trim().length > 0 && Number.isFinite(parsed) && parsed > 0
}

export function GrandTestQuestionProgressHint({
  selectedCount,
  targetCount,
  duration,
}: GrandTestQuestionProgressHintProps) {
  const durationValid = resolveDurationValid(duration)
  const targetValid = targetCount > 0

  if (!durationValid) {
    return (
      <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
        <MaterialIcon name="info" size={16} aria-hidden />
        Enter a valid duration to continue.
      </p>
    )
  }

  if (!targetValid) {
    return (
      <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
        <MaterialIcon name="info" size={16} aria-hidden />
        Enter the number of questions for this test.
      </p>
    )
  }

  if (selectedCount === targetCount) {
    return (
      <p className="flex items-center gap-1.5 text-label-sm text-success-green">
        <MaterialIcon name="check_circle" size={16} aria-hidden />
        Question count matches your target of {targetCount}.
      </p>
    )
  }

  if (selectedCount > targetCount) {
    return (
      <p className="flex items-center gap-1.5 text-label-sm text-tertiary">
        <MaterialIcon name="warning" size={16} aria-hidden />
        Remove {selectedCount - targetCount} question
        {selectedCount - targetCount === 1 ? '' : 's'} to match your target of {targetCount}.
      </p>
    )
  }

  return (
    <p className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
      <MaterialIcon name="playlist_add" size={16} aria-hidden />
      Add {targetCount - selectedCount} more question
      {targetCount - selectedCount === 1 ? '' : 's'} to reach your target of {targetCount}.
    </p>
  )
}
