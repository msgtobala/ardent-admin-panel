import { useMemo, useState } from 'react'
import { SelectField, type SelectOption } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'

const ADD_NEW_MODULE_VALUE = '__add_new_module__'

const addNewModuleOption: SelectOption = {
  value: ADD_NEW_MODULE_VALUE,
  label: 'Add new module…',
}

interface VideoLessonModuleFieldProps {
  id: string
  value: string
  options: SelectOption[]
  required?: boolean
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
}

function getInitialMode(
  value: string,
  options: SelectOption[],
): 'select' | 'new' {
  if (options.length === 0) return 'new'

  const trimmed = value.trim()
  if (!trimmed) return 'select'

  if (options.some((option) => option.value === trimmed)) return 'select'

  return 'new'
}

export function VideoLessonModuleField({
  id,
  value,
  options,
  required,
  error,
  disabled = false,
  onChange,
}: VideoLessonModuleFieldProps) {
  const [mode, setMode] = useState<'select' | 'new'>(() =>
    getInitialMode(value, options),
  )

  const selectOptions = useMemo(
    () => [...options, addNewModuleOption],
    [options],
  )

  const hasExistingModules = options.length > 0
  const selectValue =
    mode === 'select' && value && options.some((option) => option.value === value)
      ? value
      : ''

  function handleSelectChange(nextValue: string) {
    if (nextValue === ADD_NEW_MODULE_VALUE) {
      setMode('new')
      onChange('')
      return
    }

    setMode('select')
    onChange(nextValue)
  }

  function handleChooseExisting() {
    setMode('select')
    onChange('')
  }

  if (!hasExistingModules || mode === 'new') {
    return (
      <div className="flex w-full flex-col gap-1">
        <TextField
          id={id}
          label="Module Name"
          value={value}
          required={required}
          error={error}
          disabled={disabled}
          placeholder="Enter module name"
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {hasExistingModules ? (
          <button
            type="button"
            disabled={disabled}
            onClick={handleChooseExisting}
            className="self-start text-left text-body-md text-primary transition hover:text-primary-action hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            Choose existing module
          </button>
        ) : (
          <p className="text-caption text-on-surface-variant">
            No modules exist for this subject yet. Enter a module name for the first
            lesson.
          </p>
        )}
      </div>
    )
  }

  return (
    <SelectField
      id={id}
      label="Module Name"
      value={selectValue}
      options={selectOptions}
      required={required}
      error={error}
      disabled={disabled}
      placeholder="Select module"
      onChange={handleSelectChange}
    />
  )
}
