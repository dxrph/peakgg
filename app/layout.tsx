import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import './brand.css';
import './product.css';
import './internal-pages.css';
import SiteHeader from '../components/shared/SiteHeader';
import SiteFooter from '../components/shared/SiteFooter';
import {getSessionUser} from '../lib/auth/session';

const display = Big_Shoulders({ variable: '--font-display', subsets: ['latin'], weight: ['700','800'] });
const ui = Instrument_Sans({ variable: '--font-ui', subsets: ['latin'], weight: ['400','500','600','700'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400','600','700'] });

export const metadata: Metadata = {
  title: 'PeakGG — Enter the Competitive',
  description: 'Find your five, enter structured Valorant competition, and climb the PeakGG ranking system.',
  openGraph: { title: 'PeakGG — Enter the Competitive', description: 'The competitive network for Valorant players in Europe.', images: [{ url: '/og.png', width: 1731, height: 909, alt: 'PeakGG competitive network' }] },
  twitter: { card: 'summary_large_image', title: 'PeakGG — Enter the Competitive', description: 'The competitive network for Valorant players in Europe.', images: ['/og.png'] },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050506',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user=await getSessionUser();
  return <html lang="en"><body className={`${display.variable} ${ui.variable} ${mono.variable}`}><SiteHeader user={user?{username:user.email?.split('@')[0]||'PLAYER'}:null}/>{children}<SiteFooter/></body></html>;
}
