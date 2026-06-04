export interface VideoLessonTimeline {
  id?: string
  label?: string
  startTime?: number
  endTime?: number
}

export interface VideoLesson {
  id: string
  subjectId: string
  lessonName: string
  moduleName: string
  description: string
  thumbnailImage: string
  duration: number
  muxAssetId: string
  muxPlaybackId: string
  timelines: VideoLessonTimeline[]
  facultyId: string
  sortOrder: number
  rating: number
  isActive: boolean
  isFree: boolean
  studentsCompleted: number
  studentsProgressing: number
  createdAt: Date
  updatedAt?: Date
}

export interface VideoLessonDocument {
  id?: string
  lessonName?: string
  moduleName?: string
  description?: string
  thumbnailImage?: string
  duration?: number
  muxAssetId?: string
  muxPlaybackId?: string
  timelines?: VideoLessonTimeline[]
  facultyId?: string
  sortOrder?: number
  rating?: number
  isActive?: boolean
  isFree?: boolean
  studentsCompleted?: number
  studentsProgressing?: number
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface UpdateVideoLessonInput {
  lessonName: string
  moduleName: string
  description: string
  isActive: boolean
  isFree: boolean
  sortOrder: number
}

export interface CreateVideoLessonInput extends UpdateVideoLessonInput {
  muxAssetId: string
  muxPlaybackId: string
  facultyId: string
  thumbnailImage: string
  duration: number
}
