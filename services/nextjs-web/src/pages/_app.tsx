import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { ThemeProvider } from '@/context/ThemeContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
