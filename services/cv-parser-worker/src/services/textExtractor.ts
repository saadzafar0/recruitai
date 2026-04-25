import { extname } from 'node:path'
import pdfParse from 'pdf-parse'
import Tesseract from 'tesseract.js'
import type { DownloadedCvFile } from './s3Downloader'

export class UnsupportedDocumentTypeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedDocumentTypeError'
  }
}

export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TextExtractionError'
  }
}

const supportedImageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif'])

function normalizeExtractedText(rawText: string): string {
  return rawText
    .replace(/\u0000/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  const parsed = await pdfParse(fileBuffer)
  return normalizeExtractedText(parsed.text || '')
}

async function extractTextFromImage(fileBuffer: Buffer): Promise<string> {
  const ocrResult = await Tesseract.recognize(fileBuffer, 'eng')
  return normalizeExtractedText(ocrResult.data?.text || '')
}

export async function extractRawCvText(file: DownloadedCvFile): Promise<string> {
  const contentType = (file.contentType || '').toLowerCase()
  const fileExt = extname(file.fileName || '').toLowerCase()

  let rawText = ''

  if (contentType.includes('pdf') || fileExt === '.pdf') {
    rawText = await extractTextFromPdf(file.buffer)
  } else if (contentType.startsWith('image/') || supportedImageExtensions.has(fileExt)) {
    rawText = await extractTextFromImage(file.buffer)
  } else {
    throw new UnsupportedDocumentTypeError(
      `Unsupported CV file type. Received contentType='${file.contentType || 'unknown'}' file='${file.fileName}'`,
    )
  }

  if (!rawText || rawText.length < 20) {
    throw new TextExtractionError('Extracted CV text is too short or empty')
  }

  return rawText
}
