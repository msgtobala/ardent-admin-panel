import { useState } from 'react'
import { SuggestedVideosPageHeader } from '@/components/suggested-videos/SuggestedVideosPageHeader'
import { SuggestedVideosTable } from '@/components/suggested-videos/SuggestedVideosTable'
import { ViewVideoLessonModal } from '@/components/videos/ViewVideoLessonModal'
import { useSuggestedVideos } from '@/hooks/useSuggestedVideos'
import type { ResolvedSuggestedVideo } from '@/types/suggested-video'

export default function SuggestedVideosPage() {
  const { videos, isLoading, isGenerating, error, handleRetry, handleGenerate } =
    useSuggestedVideos()
  const [viewingVideo, setViewingVideo] = useState<ResolvedSuggestedVideo | null>(null)

  function handleViewVideo(video: ResolvedSuggestedVideo) {
    setViewingVideo(video)
  }

  function handleCloseView() {
    setViewingVideo(null)
  }

  return (
    <div className="flex flex-col gap-gutter">
      <SuggestedVideosPageHeader
        onGenerate={() => {
          void handleGenerate()
        }}
        isGenerating={isGenerating}
      />
      <SuggestedVideosTable
        videos={videos}
        isLoading={isLoading}
        isGenerating={isGenerating}
        error={error}
        onRetry={handleRetry}
        onView={handleViewVideo}
      />
      <ViewVideoLessonModal
        isOpen={viewingVideo !== null}
        lesson={viewingVideo}
        subtitle="Suggested video preview"
        onClose={handleCloseView}
      />
    </div>
  )
}
