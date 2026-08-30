import { describe, expect, it } from 'vitest'

import {
  parseFirebaseStoragePathFromUrl,
  storageBucketsMatch,
} from '@/lib/firebase-storage-url'

describe('storageBucketsMatch', () => {
  it('matches legacy appspot and firebasestorage bucket names for same project', () => {
    expect(
      storageBucketsMatch(
        'ardent-mds.firebasestorage.app',
        'ardent-mds.appspot.com',
      ),
    ).toBe(true)
  })
})

describe('parseFirebaseStoragePathFromUrl', () => {
  it('parses storage.googleapis.com URLs for firebasestorage bucket', () => {
    const path = parseFirebaseStoragePathFromUrl(
      'https://storage.googleapis.com/ardent-mds.firebasestorage.app/grand_tests/sub/mod/chap/questions/q1_question.png',
    )

    expect(path).toBe('grand_tests/sub/mod/chap/questions/q1_question.png')
  })

  it('parses firebasestorage.googleapis.com download URLs', () => {
    const path = parseFirebaseStoragePathFromUrl(
      'https://firebasestorage.googleapis.com/v0/b/ardent-mds.firebasestorage.app/o/grand_tests%2Fsub%2Fmod%2Fchap%2Fquestions%2Fq1_question.png?alt=media',
    )

    expect(path).toBe('grand_tests/sub/mod/chap/questions/q1_question.png')
  })

  it('parses legacy appspot URLs when configured bucket uses firebasestorage.app', () => {
    const path = parseFirebaseStoragePathFromUrl(
      'https://storage.googleapis.com/ardent-mds.appspot.com/qbanks/sub/mod/chap/questions/q1_question.jpg',
    )

    expect(path).toBe('qbanks/sub/mod/chap/questions/q1_question.jpg')
  })

  it('returns null for empty urls', () => {
    expect(parseFirebaseStoragePathFromUrl('')).toBeNull()
    expect(parseFirebaseStoragePathFromUrl('   ')).toBeNull()
  })
})
