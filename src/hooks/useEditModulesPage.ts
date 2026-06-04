import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFirestoreErrorDetails } from '@/lib/firestore-error'
import { buildVideoModuleListItems } from '@/lib/video-lesson-modules'
import { fetchVideoLessons } from '@/lib/video-lessons'
import { fetchVideoSubjects } from '@/lib/video-subjects'
import type { VideoModuleListItem } from '@/types/video-module'
import type { VideoSubject } from '@/types/video-subject'

export function useEditModulesPage(refreshKey = 0) {
  const [subjects, setSubjects] = useState<VideoSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [modules, setModules] = useState<VideoModuleListItem[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingModules, setIsLoadingModules] = useState(false)
  const [subjectsError, setSubjectsError] = useState<string | undefined>()
  const [modulesError, setModulesError] = useState<string | undefined>()
  const [modulesIndexUrl, setModulesIndexUrl] = useState<string | undefined>()

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  )

  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true)
    setSubjectsError(undefined)

    try {
      const nextSubjects = await fetchVideoSubjects()
      setSubjects(nextSubjects)
      setSelectedSubjectId((prev) => {
        if (prev && nextSubjects.some((subject) => subject.id === prev)) {
          return prev
        }
        return nextSubjects[0]?.id ?? ''
      })
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setSubjectsError(details.message)
      setSubjects([])
      setSelectedSubjectId('')
    } finally {
      setIsLoadingSubjects(false)
    }
  }, [])

  const loadModules = useCallback(async (subjectId: string) => {
    if (!subjectId) {
      setModules([])
      setModulesError(undefined)
      setModulesIndexUrl(undefined)
      return
    }

    setIsLoadingModules(true)
    setModulesError(undefined)
    setModulesIndexUrl(undefined)

    try {
      const lessons = await fetchVideoLessons(subjectId)
      setModules(buildVideoModuleListItems(lessons))
    } catch (loadError) {
      const details = getFirestoreErrorDetails(loadError)
      setModulesError(details.message)
      setModulesIndexUrl(details.indexUrl)
      setModules([])
    } finally {
      setIsLoadingModules(false)
    }
  }, [])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects, refreshKey])

  useEffect(() => {
    loadModules(selectedSubjectId)
  }, [loadModules, selectedSubjectId, refreshKey])

  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId)
  }, [])

  const handleRetrySubjects = useCallback(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleRetryModules = useCallback(() => {
    if (!selectedSubjectId) return
    loadModules(selectedSubjectId)
  }, [loadModules, selectedSubjectId])

  const handleModulesSaved = useCallback(async () => {
    if (!selectedSubjectId) return
    await loadModules(selectedSubjectId)
  }, [loadModules, selectedSubjectId])

  const isModulesInitialLoading =
    Boolean(selectedSubjectId) &&
    isLoadingModules &&
    modules.length === 0 &&
    !modulesError

  return {
    subjects,
    selectedSubjectId,
    selectedSubject,
    modules,
    isLoadingSubjects,
    isLoadingModules,
    subjectsError,
    modulesError,
    modulesIndexUrl,
    handleSubjectChange,
    handleRetrySubjects,
    handleRetryModules,
    handleModulesSaved,
    isModulesInitialLoading,
  }
}
