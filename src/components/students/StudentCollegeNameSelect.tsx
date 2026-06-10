import { useCollegeOptions } from '@/hooks/useCollegeOptions'
import { SelectField, type SelectMenuPlacement } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

interface StudentCollegeNameSelectProps {
  id: string
  stateCode: string
  value: string
  disabled?: boolean
  menuPlacement?: SelectMenuPlacement
  onChange: (value: string) => void
}

export function StudentCollegeNameSelect({
  id,
  stateCode,
  value,
  disabled = false,
  menuPlacement = 'bottom',
  onChange,
}: StudentCollegeNameSelectProps) {
  const { collegeOptions, isCollegesLoading, collegesLoadError } = useCollegeOptions({
    stateCode,
    selectedCollegeName: value,
  })

  const hasStateCode = stateCode.trim().length > 0
  const isDisabled = disabled || !hasStateCode || isCollegesLoading

  if (!hasStateCode) {
    return (
      <TextField
        id={id}
        label="College Name"
        value=""
        disabled
        placeholder="Select college state first"
      />
    )
  }

  if (collegesLoadError) {
    return (
      <div className="flex flex-col gap-1">
        <SelectField
          id={id}
          label="College Name"
          value={value}
          options={collegeOptions}
          placeholder="Select college"
          disabled={isDisabled}
          menuPlacement={menuPlacement}
          onChange={onChange}
        />
        <p className="text-label-sm text-error-red" role="alert">
          {collegesLoadError}
        </p>
      </div>
    )
  }

  return (
    <SelectField
      id={id}
      label="College Name"
      value={value}
      options={collegeOptions}
      placeholder={
        isCollegesLoading
          ? 'Loading colleges...'
          : collegeOptions.length > 0
            ? 'Select college'
            : 'No colleges found for this state'
      }
      disabled={isDisabled || collegeOptions.length === 0}
      menuPlacement={menuPlacement}
      onChange={onChange}
    />
  )
}
