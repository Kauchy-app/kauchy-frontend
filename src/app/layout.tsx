import { Providers } from './providers';
import { ToastProvider } from '@/context/ToastContext';
import PageLayout from '@/components/PageLayout';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://kauchy.com'),
  title: {
    default: "Kauchy",
    template: "%s | Kauchy"
  },
  description: "Your business deserves more than 'DM to order.' Welcome to Kauchy. Scroll the feed, chat with friends, and trade securely.",
  keywords: ["student marketplace", "campus buy and sell", "kauchy", "student commerce", "buy locally on campus"],
  openGraph: {
    title: "Kauchy",
    description: "Your business deserves more than 'DM to order.' Welcome to Kauchy. Scroll the feed, chat with friends, and trade securely.",
    url: "https://kauchy.com",
    siteName: "Kauchy",
    images: [
      {
        url: "/lightmodelogo.png",
        width: 800,
        height: 600,
        alt: "Kauchy Logo"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kauchy",
    description: "Your business deserves more than 'DM to order.' Welcome to Kauchy. Scroll the feed, chat with friends, and trade securely.",
    images: ["/lightmodelogo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://kauchy.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/lightmodelogo.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ToastProvider>
          <Providers>
            <PageLayout>
              {children}
            </PageLayout>
          </Providers>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
