import { describe, expect, it } from 'vitest'

import { parseFirebaseStoragePathFromUrl } from '@/lib/firebase-storage-url'

describe('parseFirebaseStoragePathFromUrl', () => {
  it('re-exports shared parser for pdf assets', () => {
    const path = parseFirebaseStoragePathFromUrl(
      'https://storage.googleapis.com/ardent-mds.firebasestorage.app/qbanks/sub/mod/chap/questions/q1_question.jpg',
    )

    expect(path).toBe('qbanks/sub/mod/chap/questions/q1_question.jpg')
  })
})
