import { ActiveToggle } from '@/components/banners/ActiveToggle'
import { DateTimeFieldGroup } from '@/components/ui/DateTimeFieldGroup'
import { TextField } from '@/components/ui/TextField'
import { GrandTestFormSection } from './GrandTestFormSection'

interface GrandTestBasicDetailsStepProps {
  title: string
  testStartValue: string
  testExpiryValue: string
  isFree: boolean
  isActive: boolean
  correctMark: string
  negativeMark: string
  disabled?: boolean
  titleError?: string
  testStartError?: string
  testExpiryError?: string
  correctMarkError?: string
  negativeMarkError?: string
  onTitleChange: (value: string) => void
  onTestStartChange: (value: string) => void
  onTestExpiryChange: (value: string) => void
  onIsFreeChange: (value: boolean) => void
  onIsActiveChange: (value: boolean) => void
  onCorrectMarkChange: (value: string) => void
  onNegativeMarkChange: (value: string) => void
}

export function GrandTestBasicDetailsStep({
  title,
  testStartValue,
  testExpiryValue,
  isFree,
  isActive,
  correctMark,
  negativeMark,
  disabled = false,
  titleError,
  testStartError,
  testExpiryError,
  correctMarkError,
  negativeMarkError,
  onTitleChange,
  onTestStartChange,
  onTestExpiryChange,
  onIsFreeChange,
  onIsActiveChange,
  onCorrectMarkChange,
  onNegativeMarkChange,
}: GrandTestBasicDetailsStepProps) {
  return (
    <div className="flex flex-col gap-gutter">
      <GrandTestFormSection
        title="Test information"
        description="Give the grand test a clear name that students will recognize."
      >
        <TextField
          id="grand-test-title"
          label="Test Name"
          required
          value={title}
          disabled={disabled}
          error={titleError}
          placeholder="e.g. June Grand Test"
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </GrandTestFormSection>

      <GrandTestFormSection
        title="Schedule"
        description="Students can attempt the test only between these dates."
      >
        <div className="grid gap-gutter lg:grid-cols-2">
          <DateTimeFieldGroup
            id="grand-test-start"
            label="Start Date & Time"
            required
            value={testStartValue}
            disabled={disabled}
            error={testStartError}
            defaultTime="09:00"
            onChange={onTestStartChange}
          />

          <DateTimeFieldGroup
            id="grand-test-expiry"
            label="End Date & Time"
            required
            value={testExpiryValue}
            disabled={disabled}
            error={testExpiryError}
            defaultTime="23:59"
            onChange={onTestExpiryChange}
          />
        </div>
      </GrandTestFormSection>

      <GrandTestFormSection
        title="Scoring"
        description="Marks applied for each correct and incorrect answer."
      >
        <div className="grid gap-gutter sm:grid-cols-2">
          <TextField
            id="grand-test-correct-mark"
            label="Correct Mark"
            type="number"
            required
            value={correctMark}
            disabled={disabled}
            error={correctMarkError}
            onChange={(event) => onCorrectMarkChange(event.target.value)}
          />
          <TextField
            id="grand-test-negative-mark"
            label="Negative Mark"
            type="number"
            required
            value={negativeMark}
            disabled={disabled}
            error={negativeMarkError}
            onChange={(event) => onNegativeMarkChange(event.target.value)}
          />
        </div>
      </GrandTestFormSection>

      <GrandTestFormSection
        title="Access & visibility"
        description="Control who can take the test and whether it appears as active."
      >
        <div className="flex flex-col gap-gutter">
          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-semibold text-on-surface">Free Access</span>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isFree}
                disabled={disabled}
                ariaLabel="Grand test free access"
                onChange={onIsFreeChange}
              />
              <span className="text-body-md text-on-surface">
                {isFree ? 'Free for all students' : 'Paid access only'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-sm font-semibold text-on-surface">Status</span>
            <div className="flex items-center gap-3">
              <ActiveToggle
                isActive={isActive}
                disabled={disabled}
                ariaLabel="Grand test active status"
                onChange={onIsActiveChange}
              />
              <span className="text-body-md text-on-surface">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </GrandTestFormSection>
    </div>
  )
}
