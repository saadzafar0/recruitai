import type { NextApiRequest, NextApiResponse } from 'next'
import { uploadFile, isValidCVType, getFileExtension } from '../../../../lib/s3'

type UploadResponse = {
  success: boolean
  data?: {
    url: string
    key: string
    fileName: string
  }
  error?: string
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Limit file size to 10MB
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  try {
    const { file, fileName, fileType } = req.body

    // Validate required fields
    if (!file || !fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: file, fileName, fileType',
      })
    }

    // Validate file type
    if (!isValidCVType(fileType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG, JPEG',
      })
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file, 'base64')

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (fileBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB',
      })
    }

    // Ensure proper file extension
    const extension = getFileExtension(fileType)
    const finalFileName = fileName.endsWith(extension)
      ? fileName
      : `${fileName}${extension}`

    // Upload to S3
    const result = await uploadFile({
      fileName: finalFileName,
      fileType,
      fileBuffer,
      folder: 'cvs',
    })

    if (!result.success || !result.url) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Upload failed',
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        url: result.url,
        key: result.key || '',
        fileName: finalFileName,
      },
    })

  } catch (error) {
    console.error('CV upload error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
