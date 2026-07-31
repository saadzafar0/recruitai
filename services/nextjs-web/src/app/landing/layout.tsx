import type { Metadata } from 'next'
import { Playfair_Display, Inter, Fira_Code } from 'next/font/google'
import './landing.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  style: ['italic', 'normal'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
})

const fira = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'RecruitAI — Objective Automated Candidate Evaluation',
  description: 'Screen, interview, and evaluate technical talent at scale using conversational voice AI, compiler-grade sandboxed code execution, and system design intelligence.',
}

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`${inter.variable} ${playfair.variable} ${fira.variable}`}>
      {children}
    </div>
  )
}
