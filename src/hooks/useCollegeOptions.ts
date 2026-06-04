import { useEffect, useMemo, useState } from 'react'
import {
  collegesToSelectOptions,
  fetchCollegesByStateCode,
} from '@/lib/colleges'
import type { SelectOption } from '@/components/ui/SelectField'

interface UseCollegeOptionsParams {
  stateCode: string
  selectedCollegeName?: string
}

export function useCollegeOptions({
  stateCode,
  selectedCollegeName = '',
}: UseCollegeOptionsParams) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()

  useEffect(() => {
    const normalizedStateCode = stateCode.trim()
    if (!normalizedStateCode) {
      setOptions([])
      setLoadError(undefined)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    async function loadColleges() {
      setIsLoading(true)
      setLoadError(undefined)

      try {
        const colleges = await fetchCollegesByStateCode(normalizedStateCode)
        if (isCancelled) return
        setOptions(collegesToSelectOptions(colleges))
      } catch {
        if (!isCancelled) {
          setOptions([])
          setLoadError('Failed to load colleges for the selected state.')
        }
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    loadColleges()

    return () => {
      isCancelled = true
    }
  }, [stateCode])

  const selectOptions = useMemo(() => {
    const trimmedSelectedName = selectedCollegeName.trim()
    if (!trimmedSelectedName) return options

    const hasSelectedOption = options.some(
      (option) => option.value === trimmedSelectedName,
    )
    if (hasSelectedOption) return options

    return [{ value: trimmedSelectedName, label: trimmedSelectedName }, ...options]
  }, [options, selectedCollegeName])

  return {
    collegeOptions: selectOptions,
    isCollegesLoading: isLoading,
    collegesLoadError: loadError,
  }
}
