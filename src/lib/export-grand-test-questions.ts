import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import ardentLogoUrl from '@/assets/ardent-logo.png'
import { formatDisplayDate } from '@/lib/format-display-date'
import type { GrandTestExportQuestion } from '@/lib/fetch-grand-test-questions'
import {
  loadPdfImageAssetFromUrl,
  preloadPdfImageAssets,
  registerPdfFonts,
  resolvePdfFontStyle,
  type PdfFontSet,
  type PdfFontWeight,
  type PdfImageAsset,
} from '@/lib/pdf-assets'
import type { GrandTest } from '@/types/grand-test'

export interface GrandTestAnswerKeyRow {
  questionNumber: number
  answer: string
  explanation: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 48
const HEADER_HEIGHT = 56
const FOOTER_HEIGHT = 36
const CONTENT_TOP = HEADER_HEIGHT + 28
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT - 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const BRAND = {
  primary: [255, 73, 0] as [number, number, number],
  primaryDark: [171, 46, 0] as [number, number, number],
  appBg: [253, 245, 237] as [number, number, number],
  surface: [255, 248, 246] as [number, number, number],
  onSurface: [30, 27, 26] as [number, number, number],
  onSurfaceVariant: [93, 64, 56] as [number, number, number],
  border: [230, 214, 207] as [number, number, number],
  rowAlt: [250, 242, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
} as const

interface PdfLayoutContext {
  doc: jsPDF
  fonts: PdfFontSet
  testLabel: string
  logoAsset: PdfImageAsset | null
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

export function buildGrandTestQuestionsFilename(test: GrandTest): string {
  const titleSegment = sanitizeFilenameSegment(test.title || test.id)
  const dateSegment = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return `grand-test-questions-${titleSegment}-${dateSegment}.pdf`
}

export function buildGrandTestAnswerKeyRows(
  questions: GrandTestExportQuestion[],
): GrandTestAnswerKeyRow[] {
  return questions.map((question) => ({
    questionNumber: question.questionNumber,
    answer: question.correctOptionLabel,
    explanation: question.correctDescription || '—',
  }))
}

export function buildGrandTestAnswerKeyPdfTableData(rows: GrandTestAnswerKeyRow[]): {
  head: string[][]
  body: string[][]
} {
  return {
    head: [['Q#', 'Answer', 'Explanation']],
    body: rows.map((row) => [
      String(row.questionNumber),
      row.answer,
      row.explanation,
    ]),
  }
}

function setFont(
  doc: jsPDF,
  fonts: PdfFontSet,
  weight: PdfFontWeight,
  size: number,
): void {
  const { fontName, fontStyle } = resolvePdfFontStyle(fonts, weight)
  doc.setFont(fontName, fontStyle)
  doc.setFontSize(size)
}

function drawPageChrome(context: PdfLayoutContext): void {
  const { doc, fonts, testLabel, logoAsset } = context
  const pageNumber = doc.getNumberOfPages()

  doc.setFillColor(...BRAND.appBg)
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F')

  doc.setFillColor(...BRAND.primary)
  doc.rect(0, HEADER_HEIGHT - 2, PAGE_WIDTH, 2, 'F')

  if (logoAsset) {
    const logoHeight = 28
    const logoWidth = (logoAsset.width / logoAsset.height) * logoHeight
    doc.addImage(
      logoAsset.dataUrl,
      logoAsset.format,
      MARGIN_X,
      14,
      logoWidth,
      logoHeight,
      undefined,
      'FAST',
    )
  }

  setFont(doc, fonts, 'semibold', 10)
  doc.setTextColor(...BRAND.onSurface)
  const truncatedTitle =
    testLabel.length > 52 ? `${testLabel.slice(0, 52)}…` : testLabel
  doc.text(truncatedTitle, PAGE_WIDTH - MARGIN_X, 28, { align: 'right' })

  setFont(doc, fonts, 'regular', 8)
  doc.setTextColor(...BRAND.onSurfaceVariant)
  doc.text('Ardent MDS · Grand Test', PAGE_WIDTH - MARGIN_X, 40, { align: 'right' })

  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.5)
  doc.line(MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT)

  setFont(doc, fonts, 'regular', 8)
  doc.setTextColor(...BRAND.onSurfaceVariant)
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 14, { align: 'center' })
}

function startNewPage(context: PdfLayoutContext): number {
  context.doc.addPage()
  drawPageChrome(context)
  return CONTENT_TOP
}

function ensureSpace(context: PdfLayoutContext, y: number, requiredHeight: number): number {
  if (y + requiredHeight <= CONTENT_BOTTOM) return y
  return startNewPage(context)
}

function scaleImageToFit(
  asset: PdfImageAsset,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const widthRatio = maxWidth / asset.width
  const heightRatio = maxHeight / asset.height
  const ratio = Math.min(widthRatio, heightRatio, 1)

  return {
    width: asset.width * ratio,
    height: asset.height * ratio,
  }
}

function drawCoverPage(
  context: PdfLayoutContext,
  test: GrandTest,
  questionCount: number,
): void {
  const { doc, fonts, logoAsset } = context

  doc.setFillColor(...BRAND.surface)
  doc.rect(0, HEADER_HEIGHT, PAGE_WIDTH, PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT, 'F')

  let y = 150

  if (logoAsset) {
    const logoHeight = 56
    const logoWidth = (logoAsset.width / logoAsset.height) * logoHeight
    doc.addImage(
      logoAsset.dataUrl,
      logoAsset.format,
      (PAGE_WIDTH - logoWidth) / 2,
      y,
      logoWidth,
      logoHeight,
      undefined,
      'FAST',
    )
    y += logoHeight + 28
  }

  setFont(doc, fonts, 'medium', 11)
  doc.setTextColor(...BRAND.primary)
  doc.text('GRAND TEST', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 24

  const title = test.title.trim() || test.id
  setFont(doc, fonts, 'bold', 24)
  doc.setTextColor(...BRAND.onSurface)
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH - 40) as string[]
  doc.text(titleLines, PAGE_WIDTH / 2, y, { align: 'center' })
  y += titleLines.length * 30 + 20

  const cardWidth = (CONTENT_WIDTH - 16) / 2
  const cardHeight = 68
  const cardStartX = MARGIN_X
  const cardStartY = y
  const cards: Array<{ label: string; value: string }> = [
    { label: 'Start Date', value: formatDisplayDate(test.testStart) },
    { label: 'End Date', value: formatDisplayDate(test.testExpiry) },
    { label: 'Duration', value: `${test.duration} minutes` },
    { label: 'Questions', value: String(questionCount) },
    { label: 'Correct Mark', value: `+${test.correctMark}` },
    { label: 'Negative Mark', value: String(test.negativeMark) },
  ]

  cards.forEach((card, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = cardStartX + column * (cardWidth + 16)
    const cardY = cardStartY + row * (cardHeight + 12)

    doc.setFillColor(...BRAND.white)
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.75)
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'FD')

    setFont(doc, fonts, 'regular', 9)
    doc.setTextColor(...BRAND.onSurfaceVariant)
    doc.text(card.label, x + 14, cardY + 22)

    setFont(doc, fonts, 'semibold', 12)
    doc.setTextColor(...BRAND.onSurface)
    doc.text(card.value, x + 14, cardY + 44)
  })

  y = cardStartY + 3 * (cardHeight + 12) + 24

  setFont(doc, fonts, 'regular', 10)
  doc.setTextColor(...BRAND.onSurfaceVariant)
  doc.text(
    `Exported on ${formatDisplayDate(new Date())}`,
    PAGE_WIDTH / 2,
    y,
    { align: 'center' },
  )

  doc.text(
    'Questions follow without answers. The answer key is provided at the end.',
    PAGE_WIDTH / 2,
    y + 18,
    { align: 'center' },
  )
}

function drawQuestionSectionTitle(context: PdfLayoutContext, y: number): number {
  const { doc, fonts } = context

  setFont(doc, fonts, 'bold', 16)
  doc.setTextColor(...BRAND.onSurface)
  doc.text('Question Paper', MARGIN_X, y)

  doc.setFillColor(...BRAND.primary)
  doc.rect(MARGIN_X, y + 8, 48, 3, 'F')

  return y + 28
}

function drawQuestionBlock(
  context: PdfLayoutContext,
  question: GrandTestExportQuestion,
  imageAssets: Map<string, PdfImageAsset>,
  y: number,
): number {
  const { doc, fonts } = context
  const badgeSize = 22
  const badgeGap = 10
  const questionFontSize = 11
  const questionLineHeight = 15
  const optionIndent = 34
  const optionFontSize = 10
  const optionLineHeight = 14
  const optionPadding = 10
  const blockSpacing = 22
  const questionToOptionsGap = 18

  const badgeCenterX = MARGIN_X + badgeSize / 2
  const questionTextX = MARGIN_X + badgeSize + badgeGap
  const questionTextWidth = PAGE_WIDTH - MARGIN_X - questionTextX

  setFont(doc, fonts, 'medium', questionFontSize)
  const questionLines = doc.splitTextToSize(question.question, questionTextWidth) as string[]
  const questionTextHeight = questionLines.length * questionLineHeight

  let questionImageHeight = 0
  const questionImageAsset = question.questionImageUrl
    ? imageAssets.get(question.questionImageUrl)
    : null

  if (questionImageAsset) {
    questionImageHeight = scaleImageToFit(questionImageAsset, questionTextWidth, 180).height + 12
  }

  const resolvedOptionBlocks = question.options.map((optionText, index) => {
    setFont(doc, fonts, 'semibold', optionFontSize)
    const optionPrefix = `${String.fromCharCode(65 + index)}. `
    const prefixWidth = doc.getTextWidth(optionPrefix)
    const wrappedLines = doc.splitTextToSize(
      optionText,
      questionTextWidth - optionIndent - prefixWidth,
    ) as string[]
    const textContentHeight = wrappedLines.length * optionLineHeight
    return {
      optionPrefix,
      prefixWidth,
      wrappedLines,
      textContentHeight,
      height: textContentHeight + optionPadding * 2,
    }
  })

  const optionsHeight = resolvedOptionBlocks.reduce((total, block) => total + block.height + 4, 0)
  const headerHeight = Math.max(badgeSize, questionTextHeight)
  const totalBlockHeight =
    headerHeight + questionToOptionsGap + questionImageHeight + optionsHeight + blockSpacing

  y = ensureSpace(context, y, Math.min(totalBlockHeight, CONTENT_BOTTOM - CONTENT_TOP))

  const blockTop = y
  const questionTextBlockHeight = questionLines.length * questionLineHeight
  const badgeCenterY = blockTop + questionTextBlockHeight / 2
  const firstLineBaseline = blockTop + questionFontSize

  doc.setFillColor(...BRAND.primary)
  doc.circle(badgeCenterX, badgeCenterY, badgeSize / 2, 'F')

  setFont(doc, fonts, 'bold', 10)
  doc.setTextColor(...BRAND.white)
  const numberLabel = String(question.questionNumber)
  const numberWidth = doc.getTextWidth(numberLabel)
  doc.text(numberLabel, badgeCenterX - numberWidth / 2, badgeCenterY + 3.5)

  setFont(doc, fonts, 'medium', questionFontSize)
  doc.setTextColor(...BRAND.onSurface)
  doc.text(questionLines, questionTextX, firstLineBaseline)

  y = blockTop + questionTextHeight + 8

  if (questionImageAsset) {
    const { width, height } = scaleImageToFit(questionImageAsset, questionTextWidth, 180)
    doc.addImage(
      questionImageAsset.dataUrl,
      questionImageAsset.format,
      questionTextX,
      y,
      width,
      height,
      undefined,
      'FAST',
    )
    y += height + 8
  }

  y += questionToOptionsGap

  resolvedOptionBlocks.forEach((optionBlock) => {
    y = ensureSpace(context, y, optionBlock.height)

    const boxTop = y
    const boxHeight = optionBlock.height

    doc.setFillColor(...BRAND.white)
    doc.setDrawColor(...BRAND.border)
    doc.roundedRect(
      MARGIN_X + 8,
      boxTop,
      CONTENT_WIDTH - 8,
      boxHeight,
      6,
      6,
      'FD',
    )

    const textBlockTop = boxTop + (boxHeight - optionBlock.textContentHeight) / 2
    const optionTextY = textBlockTop + optionFontSize

    setFont(doc, fonts, 'semibold', optionFontSize)
    doc.setTextColor(...BRAND.primaryDark)
    doc.text(optionBlock.optionPrefix, MARGIN_X + optionIndent, optionTextY)

    setFont(doc, fonts, 'regular', optionFontSize)
    doc.setTextColor(...BRAND.onSurface)
    doc.text(
      optionBlock.wrappedLines,
      MARGIN_X + optionIndent + optionBlock.prefixWidth,
      optionTextY,
    )

    y = boxTop + boxHeight + 4
  })

  return y + blockSpacing
}

function drawAnswerKeySection(
  context: PdfLayoutContext,
  rows: GrandTestAnswerKeyRow[],
): void {
  const { doc, fonts } = context

  let y = startNewPage(context)

  setFont(doc, fonts, 'bold', 16)
  doc.setTextColor(...BRAND.onSurface)
  doc.text('Answer Key', MARGIN_X, y)
  doc.setFillColor(...BRAND.primary)
  doc.rect(MARGIN_X, y + 8, 36, 3, 'F')
  y += 24

  const { head, body } = buildGrandTestAnswerKeyPdfTableData(rows)

  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: { left: MARGIN_X, right: MARGIN_X, bottom: FOOTER_HEIGHT + 12 },
    styles: {
      font: fonts.regular,
      fontSize: 9,
      cellPadding: 6,
      textColor: BRAND.onSurface,
      lineColor: BRAND.border,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: BRAND.white,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: BRAND.rowAlt,
    },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center' },
      1: { cellWidth: 52, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    didDrawPage: () => {
      drawPageChrome(context)
    },
  })
}

export async function exportGrandTestQuestionsPdf(
  test: GrandTest,
  questions: GrandTestExportQuestion[],
): Promise<void> {
  if (questions.length === 0) {
    throw new Error('This test has no questions to export')
  }

  const testLabel = test.title.trim() || test.id
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const fonts = await registerPdfFonts(doc)
  const logoAsset = await loadPdfImageAssetFromUrl(ardentLogoUrl)

  const imageUrls = questions.flatMap((question) => {
    const urls: string[] = []
    if (question.questionImageUrl) urls.push(question.questionImageUrl)
    return urls
  })
  const imageAssets = await preloadPdfImageAssets(imageUrls)

  const context: PdfLayoutContext = {
    doc,
    fonts,
    testLabel,
    logoAsset,
  }

  drawPageChrome(context)
  drawCoverPage(context, test, questions.length)

  doc.addPage()
  drawPageChrome(context)

  let y = drawQuestionSectionTitle(context, CONTENT_TOP)

  for (const question of questions) {
    y = drawQuestionBlock(context, question, imageAssets, y)
  }

  drawAnswerKeySection(context, buildGrandTestAnswerKeyRows(questions))

  doc.save(buildGrandTestQuestionsFilename(test))
}
