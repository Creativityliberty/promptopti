import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nümtema Intent Studio',
  description: 'Transformez une intention brute en Prompt Pack, Skill ou workflow exécutable.',
  applicationName: 'Nümtema Intent Studio',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <>
      {children}
      {process.env.VERCEL ? <Analytics /> : null}
    </>
  )

  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider>{content}</ClerkProvider>
        ) : content}
      </body>
    </html>
  )
}
