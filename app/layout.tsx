import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'PeakGG — Reach Your Competitive Peak',
  description: 'Competizioni, ranking verificati e scouting per la nuova generazione di player.',
  openGraph: {
    title: 'PeakGG — Reach Your Competitive Peak',
    description: 'Competizioni, ranking verificati e scouting per la nuova generazione di player.',
    images: [{ url: '/og.png', width: 1732, height: 908, alt: 'PeakGG — Il tuo gioco. Il tuo picco.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PeakGG — Reach Your Competitive Peak',
    description: 'Competizioni, ranking verificati e scouting per la nuova generazione di player.',
    images: ['/og.png'],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="it"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>; }
