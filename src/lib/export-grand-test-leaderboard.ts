import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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

export type GrandTestLeaderboardExportExtension = 'xlsx' | 'pdf'

export const GRAND_TEST_LEADERBOARD_PDF_COLUMNS = [
  'Rank',
  'Student',
  'User ID',
  'Score',
  'Correct',
  'Incorrect',
  'Skipped',
  'Time Taken',
  'Submitted At',
] as const satisfies ReadonlyArray<keyof GrandTestLeaderboardExportRow>

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

export function buildGrandTestLeaderboardPdfTableData(
  rows: GrandTestLeaderboardExportRow[],
): { head: string[][]; body: string[][] } {
  return {
    head: [GRAND_TEST_LEADERBOARD_PDF_COLUMNS.map(String)],
    body: rows.map((row) =>
      GRAND_TEST_LEADERBOARD_PDF_COLUMNS.map((column) => String(row[column])),
    ),
  }
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

export function buildGrandTestLeaderboardFilename(
  test: GrandTest,
  extension: GrandTestLeaderboardExportExtension = 'xlsx',
): string {
  const titleSegment = sanitizeFilenameSegment(test.title || test.id)
  const dateSegment = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return `grand-test-leaderboard-${titleSegment}-${dateSegment}.${extension}`
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
  XLSX.writeFile(workbook, buildGrandTestLeaderboardFilename(test, 'xlsx'))
}

export function exportGrandTestLeaderboardPdf(
  test: GrandTest,
  entries: GrandTestLeaderboardEntry[],
): void {
  const rows = buildGrandTestLeaderboardExportRows(entries)
  const { head, body } = buildGrandTestLeaderboardPdfTableData(rows)
  const testLabel = test.title.trim() || test.id
  const exportedAt = formatDisplayDate(new Date())

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFontSize(16)
  doc.text('Grand Test Leaderboard', 40, 40)

  doc.setFontSize(10)
  doc.text(`Test: ${testLabel}`, 40, 58)
  doc.text(`Exported: ${exportedAt}`, 40, 72)
  doc.text(`Participants: ${rows.length}`, 40, 86)

  autoTable(doc, {
    head,
    body,
    startY: 100,
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [255, 73, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 242, 240],
    },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 110 },
      2: { cellWidth: 90 },
      8: { cellWidth: 100 },
    },
  })

  doc.save(buildGrandTestLeaderboardFilename(test, 'pdf'))
}
