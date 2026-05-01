'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { CandidateApplyForm } from '@/components/apply/CandidateApplyForm'

export default function ApplyPageClient() {
  const searchParams = useSearchParams()

  const queryJobId = useMemo(() => {
    return searchParams?.get('job_id') || searchParams?.get('jobId') || ''
  }, [searchParams])

  return <CandidateApplyForm initialJobId={queryJobId} />
}
