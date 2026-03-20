import { useRouter } from 'next/router'
import { CandidateApplyForm } from '@/components/apply/CandidateApplyForm'

export default function ApplyPage() {
  const router = useRouter()
  const queryJobId = typeof router.query.job_id === 'string'
    ? router.query.job_id
    : typeof router.query.jobId === 'string'
      ? router.query.jobId
      : ''

  return <CandidateApplyForm initialJobId={queryJobId} />
}
