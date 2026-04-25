import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
})

export class InvalidS3LocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidS3LocationError'
  }
}

export interface DownloadCvInput {
  cvFileUrl: string
  s3Key?: string
  bucketName?: string
}

export interface DownloadedCvFile {
  buffer: Buffer
  contentType?: string
  key: string
  bucket: string
  fileName: string
}

function normalizeS3Key(rawKey: string): string {
  return decodeURIComponent(rawKey.replace(/^\/+/, ''))
}

function parseS3LocationFromUrl(cvFileUrl: string): { bucket: string; key: string } {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(cvFileUrl)
  } catch {
    throw new InvalidS3LocationError('Invalid CV file URL format')
  }

  const pathname = parsedUrl.pathname.replace(/^\/+/, '')
  if (!pathname) {
    throw new InvalidS3LocationError('CV file URL does not include an S3 object key')
  }

  const virtualHostedMatch = parsedUrl.hostname.match(/^(.+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i)
  if (virtualHostedMatch) {
    return {
      bucket: virtualHostedMatch[1],
      key: normalizeS3Key(pathname),
    }
  }

  const isPathStyleHost = /^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(parsedUrl.hostname)
  if (isPathStyleHost) {
    const [bucket, ...keyParts] = pathname.split('/')
    if (!bucket || keyParts.length === 0) {
      throw new InvalidS3LocationError('Path-style S3 URL is missing bucket or object key')
    }

    return {
      bucket,
      key: normalizeS3Key(keyParts.join('/')),
    }
  }

  const fallbackBucket = process.env.S3_BUCKET_NAME
  if (fallbackBucket) {
    return {
      bucket: fallbackBucket,
      key: normalizeS3Key(pathname),
    }
  }

  throw new InvalidS3LocationError('Unable to infer S3 bucket from CV file URL')
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    throw new Error('S3 returned an empty object body')
  }

  const typedBody = body as {
    transformToByteArray?: () => Promise<Uint8Array>
  }

  if (typeof typedBody.transformToByteArray === 'function') {
    const bytes = await typedBody.transformToByteArray()
    return Buffer.from(bytes)
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }

  if (typeof body === 'string') {
    return Buffer.from(body)
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body)
  }

  throw new Error('Unsupported S3 body type returned by AWS SDK')
}

export async function downloadCvFromS3(input: DownloadCvInput): Promise<DownloadedCvFile> {
  const fallbackBucket = input.bucketName || process.env.S3_BUCKET_NAME

  const location = input.s3Key
    ? {
        bucket: fallbackBucket,
        key: normalizeS3Key(input.s3Key),
      }
    : parseS3LocationFromUrl(input.cvFileUrl)

  if (!location.bucket) {
    throw new InvalidS3LocationError(
      'S3 bucket is required. Provide S3_BUCKET_NAME or include bucket in CV URL.',
    )
  }

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: location.bucket,
      Key: location.key,
    }),
  )

  const buffer = await bodyToBuffer(response.Body)
  if (buffer.length === 0) {
    throw new Error('Downloaded CV file is empty')
  }

  const fileName = location.key.split('/').pop() || location.key

  return {
    buffer,
    contentType: response.ContentType,
    key: location.key,
    bucket: location.bucket,
    fileName,
  }
}
