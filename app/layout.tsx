import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Geist_Pixel } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Footer } from '@/components/brand';
import { Header } from '@/components/chrome';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

const geistPixel = Geist_Pixel({
  variable: '--font-geist-pixel',
  subsets: ['latin'],
  axes: ['ELSH']
});

export const metadata: Metadata = {
  title: 'Startup Scout',
  description: 'Finds UK startups running Next.js off Vercel and drafts the first message.'
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistPixel.variable} flex min-h-dvh flex-col antialiased`}
      >
        <Header />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
