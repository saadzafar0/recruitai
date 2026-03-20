import { isValidCVType } from './s3'

interface UploadCVResult {
  success: boolean
  url?: string
  key?: string
  fileName?: string
  error?: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }

      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Upload a CV file to S3 via the API
 * Use this function from frontend components
 */
export async function uploadCV(file: File): Promise<UploadCVResult> {
  try {
    // Validate file type
    if (!isValidCVType(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Allowed: PDF, DOC, DOCX',
      }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 10MB',
      }
    }

    // Convert file to base64
    const base64 = await fileToBase64(file)

    // Call upload API
    const response = await fetch('/api/v1/uploads/cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        fileName: file.name,
        fileType: file.type,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Upload failed',
      }
    }

    return {
      success: true,
      url: data.data.url,
      key: data.data.key,
      fileName: data.data.fileName,
    }
  } catch (error) {
    console.error('CV upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}
