import { useEffect, useState } from 'react'
import { fetchVideoLesson } from '@/lib/video-lessons'
import type { UserQueryVideoRefs } from '@/lib/user-query-display'
import { VideoLessonPlayer } from '@/components/videos/VideoLessonPlayer'

interface UserQueryLinkedVideoSectionProps {
  refs: UserQueryVideoRefs
  fallbackLabel: string
}

export function UserQueryLinkedVideoSection({
  refs,
  fallbackLabel,
}: UserQueryLinkedVideoSectionProps) {
  const [lessonLabel, setLessonLabel] = useState(fallbackLabel)

  useEffect(() => {
    let isCancelled = false

    async function loadLessonLabel() {
      if (fallbackLabel !== refs.lessonRefId) {
        setLessonLabel(fallbackLabel)
        return
      }

      try {
        const lesson = await fetchVideoLesson(refs.subjectRefId, refs.lessonRefId)
        if (isCancelled) return

        const name = lesson?.lessonName.trim()
        setLessonLabel(name || refs.lessonRefId)
      } catch {
        if (isCancelled) return
        setLessonLabel(refs.lessonRefId)
      }
    }

    loadLessonLabel()

    return () => {
      isCancelled = true
    }
  }, [refs.subjectRefId, refs.lessonRefId, fallbackLabel])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-4">
      <h3 className="text-label-sm font-medium text-on-surface-variant">
        Linked video
      </h3>
      <p className="text-body-md text-on-surface">{lessonLabel}</p>
      <VideoLessonPlayer
        key={`${refs.subjectRefId}-${refs.lessonRefId}`}
        subjectId={refs.subjectRefId}
        lessonId={refs.lessonRefId}
        lessonLabel={lessonLabel}
        autoLoad
      />
    </div>
  )
}
