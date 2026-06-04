import type { VideoLesson } from '@/types/video-lesson'
import type { SelectOption } from '@/components/ui/SelectField'

export function collectVideoLessonModuleNames(lessons: VideoLesson[]): string[] {
  const names = new Set<string>()

  for (const lesson of lessons) {
    const trimmed = lesson.moduleName.trim()
    if (trimmed) names.add(trimmed)
  }

  return [...names].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' }),
  )
}

export function buildVideoLessonModuleOptions(
  lessons: VideoLesson[],
  currentModuleName?: string,
): SelectOption[] {
  const names = collectVideoLessonModuleNames(lessons)
  const current = currentModuleName?.trim() ?? ''

  if (current && !names.includes(current)) {
    names.unshift(current)
  }

  return names.map((name) => ({
    value: name,
    label: name,
  }))
}
