'use client'

import { usePathname } from 'next/navigation'
import { RecruiterLayout } from '@/components/layout'

function getRecruiterTitle(pathname: string): string {
  if (pathname === '/recruiter') return 'Dashboard'
  if (pathname.startsWith('/recruiter/jobs')) return 'Job Postings'
  if (pathname.startsWith('/recruiter/organization')) return 'Organization'
  return 'Recruiter'
}

export default function RecruiterSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname() || '/recruiter'
  const title = getRecruiterTitle(pathname)

  return <RecruiterLayout title={title}>{children}</RecruiterLayout>
}
