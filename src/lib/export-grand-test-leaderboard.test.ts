import { describe, expect, it } from 'vitest'

import {
  buildGrandTestLeaderboardExportRows,
  buildGrandTestLeaderboardFilename,
} from '@/lib/export-grand-test-leaderboard'
import type { GrandTest, GrandTestLeaderboardEntry } from '@/types/grand-test'

function createEntry(
  overrides: Partial<GrandTestLeaderboardEntry> = {},
): GrandTestLeaderboardEntry {
  return {
    userId: 'user-1',
    name: 'Jane Doe',
    profileImageUrl: '',
    rank: 1,
    score: 10,
    correctCount: 8,
    incorrectCount: 1,
    skippedCount: 1,
    timeTakenSecs: 71,
    totalParticipants: 1,
    submittedAt: new Date('2026-06-11T13:47:00.000Z'),
    ...overrides,
  }
}

function createTest(overrides: Partial<GrandTest> = {}): GrandTest {
  return {
    id: 'test-abc123',
    title: 'Example Test',
    testStart: new Date('2026-06-01T09:00:00.000Z'),
    testExpiry: new Date('2026-06-11T23:59:00.000Z'),
    duration: 120,
    questions: 50,
    correctMark: 1,
    negativeMark: -1,
    isFree: false,
    isActive: true,
    isLeaderboardPublished: true,
    totalParticipants: 1,
    createdAt: new Date('2026-05-01T09:00:00.000Z'),
    ...overrides,
  }
}

describe('export grand test leaderboard helpers', () => {
  it('maps leaderboard entries to export rows', () => {
    const rows = buildGrandTestLeaderboardExportRows([
      createEntry({ rank: 2, name: '  ', userId: 'user-2' }),
      createEntry({ rank: 1 }),
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      Rank: 1,
      Student: 'Jane Doe',
      'User ID': 'user-1',
      Score: 10,
      Correct: 8,
      Incorrect: 1,
      Skipped: 1,
      'Time Taken': '1m 11s',
    })
    expect(rows[0]['Submitted At']).not.toBe('—')
    expect(rows[1]).toMatchObject({
      Rank: 2,
      Student: 'user-2',
      'User ID': 'user-2',
    })
  })

  it('uses an em dash for missing submitted timestamps', () => {
    const rows = buildGrandTestLeaderboardExportRows([
      createEntry({ submittedAt: new Date(0) }),
    ])

    expect(rows[0]['Submitted At']).toBe('—')
  })

  it('sanitizes filenames from test titles', () => {
    const filename = buildGrandTestLeaderboardFilename(
      createTest({ title: 'Example Test / June 2026!' }),
    )

    expect(filename).toMatch(
      /^grand-test-leaderboard-example-test-june-2026-\d{4}-\d{2}-\d{2}\.xlsx$/,
    )
  })

  it('falls back to test id when title is empty', () => {
    const filename = buildGrandTestLeaderboardFilename(createTest({ title: '' }))

    expect(filename).toMatch(
      /^grand-test-leaderboard-test-abc123-\d{4}-\d{2}-\d{2}\.xlsx$/,
    )
  })
})
