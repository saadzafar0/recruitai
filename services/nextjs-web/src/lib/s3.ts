import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'recruitai-cvs'

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface FileUploadOptions {
  fileName: string
  fileType: string
  fileBuffer: Buffer
  folder?: string
}

/**
 * Upload a file to S3
 */
export async function uploadFile(options: FileUploadOptions): Promise<UploadResult> {
  const { fileName, fileType, fileBuffer, folder = 'cvs' } = options

  try {
    // Generate unique key with folder path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `${folder}/${timestamp}-${sanitizedFileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      // Make files private by default (access via signed URLs)
      ACL: 'private',
    })

    await s3Client.send(command)

    // Generate a presigned URL since objects are private
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })

    return {
      success: true,
      url,
      key,
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Generate a presigned URL for a private S3 object
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Get a file from S3
 */
export async function getFile(key: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)

    if (response.Body) {
      const stream = response.Body as NodeJS.ReadableStream
      const chunks: Buffer[] = []

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
      }

      return Buffer.concat(chunks)
    }

    return null
  } catch (error) {
    console.error('S3 get file error:', error)
    return null
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('S3 delete error:', error)
    return false
  }
}

/**
 * Validate file type for CV uploads
 */
export function isValidCVType(mimeType: string): boolean {
  const normalizedMimeType = mimeType.toLowerCase()
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/tif',
  ]
  return allowedTypes.includes(normalizedMimeType)
}

/**
 * Get file extension from mime type
 */
export function getFileExtension(mimeType: string): string {
  const normalizedMimeType = mimeType.toLowerCase()
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'image/tif': '.tif',
  }
  return extensions[normalizedMimeType] || ''
}

/**
 * Infer mime type from file extension when browser does not provide file.type.
 */
export function getMimeTypeFromFileName(fileName: string): string {
  const normalizedFileName = fileName.toLowerCase()

  const extensionToMimeType: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  }

  const matchingExtension = Object.keys(extensionToMimeType)
    .find((extension) => normalizedFileName.endsWith(extension))

  return matchingExtension ? extensionToMimeType[matchingExtension] : ''
}

export { s3Client, BUCKET_NAME }
