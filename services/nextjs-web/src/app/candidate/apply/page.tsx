import { Suspense } from 'react'
import ApplyPageClient from './ApplyPageClient'

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyPageClient />
    </Suspense>
  )
}
