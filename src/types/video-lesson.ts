export const MUX_ASSET_STATUS = {
  idle: 'idle',
  processing: 'processing',
  ready: 'ready',
  errored: 'errored',
} as const

export type MuxAssetStatus = (typeof MUX_ASSET_STATUS)[keyof typeof MUX_ASSET_STATUS]

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
  muxAssetStatus: MuxAssetStatus
  muxAssetError?: string
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
  muxAssetStatus?: MuxAssetStatus
  muxAssetError?: string
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
}

export type CreateVideoLessonInput = UpdateVideoLessonInput
