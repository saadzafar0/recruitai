import type { Metadata } from 'next'
import '@/styles/globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'RecruitAI',
  description: 'RecruitAI Web',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
