'use client'

import { useParams } from 'next/navigation'
import CodingAssessment from '@/components/CodeEditor/MonacoEditor'

export default function CodingRoundPage() {
  const params = useParams<{ applicationId: string }>()
  const applicationId = params?.applicationId || ''

  return <CodingAssessment applicationId={applicationId} />
}
