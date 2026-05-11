'use client'

import { Suspense } from 'react'
import { VapiInterviewRoom } from '@/components/mock-interview'

export default function MockInterviewPage() {
  return (
    <Suspense fallback={null}>
      <VapiInterviewRoom backPath="/candidate" badgeLabel="Mock Interview" />
    </Suspense>
  )
}
