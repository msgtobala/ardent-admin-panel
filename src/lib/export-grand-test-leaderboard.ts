import * as XLSX from 'xlsx'

import { formatDisplayDate } from '@/lib/format-display-date'
import {
  formatDurationSeconds,
  sortGrandTestLeaderboardEntries,
} from '@/lib/grand-test-leaderboard'
import type { GrandTest, GrandTestLeaderboardEntry } from '@/types/grand-test'

export interface GrandTestLeaderboardExportRow {
  Rank: number
  Student: string
  'User ID': string
  Score: number
  Correct: number
  Incorrect: number
  Skipped: number
  'Time Taken': string
  'Submitted At': string
}

function formatSubmittedAt(submittedAt: Date): string {
  return submittedAt.getTime() > 0 ? formatDisplayDate(submittedAt) : '—'
}

export function buildGrandTestLeaderboardExportRows(
  entries: GrandTestLeaderboardEntry[],
): GrandTestLeaderboardExportRow[] {
  return sortGrandTestLeaderboardEntries(entries).map((entry) => ({
    Rank: entry.rank,
    Student: entry.name.trim() || entry.userId,
    'User ID': entry.userId,
    Score: entry.score,
    Correct: entry.correctCount,
    Incorrect: entry.incorrectCount,
    Skipped: entry.skippedCount,
    'Time Taken': formatDurationSeconds(entry.timeTakenSecs),
    'Submitted At': formatSubmittedAt(entry.submittedAt),
  }))
}

function sanitizeFilenameSegment(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'untitled'

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function buildGrandTestLeaderboardFilename(test: GrandTest): string {
  const titleSegment = sanitizeFilenameSegment(test.title || test.id)
  const dateSegment = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return `grand-test-leaderboard-${titleSegment}-${dateSegment}.xlsx`
}

export function exportGrandTestLeaderboardExcel(
  test: GrandTest,
  entries: GrandTestLeaderboardEntry[],
): void {
  const rows = buildGrandTestLeaderboardExportRows(entries)
  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 28 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard')
  XLSX.writeFile(workbook, buildGrandTestLeaderboardFilename(test))
}
