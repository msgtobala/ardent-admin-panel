import {
  appendScheduleHelpText,
  getClinicalVignettesScheduleHelpText,
} from '@/config/nuggets-daily-scheduler'

const PAGE_DESCRIPTION = appendScheduleHelpText(
  "Manage today's clinical vignette question and review previous daily questions from the qbank.",
  getClinicalVignettesScheduleHelpText(),
)

export function ClinicalVignettesPageHeader() {
  return (
    <div className="flex max-w-[672px] flex-col gap-2">
      <h1 className="text-section-title text-on-surface">Clinical Vignettes</h1>
      <p className="text-body-md text-on-surface-variant">{PAGE_DESCRIPTION}</p>
    </div>
  )
}
