import {
  appendScheduleHelpText,
  getMcqOfTheDayScheduleHelpText,
} from '@/config/nuggets-daily-scheduler'

const PAGE_DESCRIPTION = appendScheduleHelpText(
  "Manage today's daily MCQ question and review previous daily questions from the qbank.",
  getMcqOfTheDayScheduleHelpText(),
)

export function McqOfTheDayPageHeader() {
  return (
    <div className="flex max-w-[672px] flex-col gap-2">
      <h1 className="text-section-title text-on-surface">MCQ of the Day</h1>
      <p className="text-body-md text-on-surface-variant">{PAGE_DESCRIPTION}</p>
    </div>
  )
}
