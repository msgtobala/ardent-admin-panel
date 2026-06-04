/** Display time for the daily Cloud Scheduler job (align with backend cron). */
export const MCQ_OF_THE_DAY_SCHEDULE_TIME = '12:00 AM IST'

export const CLINICAL_VIGNETTES_SCHEDULE_TIME = '12:00 AM IST'

export function getMcqOfTheDayScheduleHelpText(): string {
  return `This runs every day at ${MCQ_OF_THE_DAY_SCHEDULE_TIME}.`
}

export function getClinicalVignettesScheduleHelpText(): string {
  return `This runs every day at ${CLINICAL_VIGNETTES_SCHEDULE_TIME}.`
}

export function appendScheduleHelpText(description: string, scheduleHelpText: string): string {
  return `${description} ${scheduleHelpText}`
}
