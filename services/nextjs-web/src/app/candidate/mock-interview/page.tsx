import { Suspense } from 'react'
import MockInterviewClient from './MockInterviewClient'

export default function MockInterviewPage() {
  return (
    <Suspense fallback={null}>
      <MockInterviewClient />
    </Suspense>
  )
}
