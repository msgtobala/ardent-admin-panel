export const SUGGESTED_VIDEOS_SLOT_COUNT = 3

export interface SuggestedVideoDocument {
  id?: string
  subjectRefId?: string
  lessonRefId?: string
  noOfStudentsWatched?: number
  sortOrder?: number
  isActive?: boolean
  createdAt?: { toDate?: () => Date }
  updatedAt?: { toDate?: () => Date }
}

export interface SuggestedVideo {
  id: string
  subjectRefId: string
  lessonRefId: string
  noOfStudentsWatched: number
  sortOrder: number
  isActive: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

export interface ResolvedSuggestedVideo extends SuggestedVideo {
  subjectName: string
  lessonName: string
  thumbnailImage: string
}
