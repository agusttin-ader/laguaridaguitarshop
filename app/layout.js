import { Inter, Geist_Mono, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import "./revamp.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToasterProvider from './components/ToasterProvider'
import WhatsAppFloating from './components/WhatsAppFloating'
import ImageOrientationNormalizer from './components/ImageOrientationNormalizer'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300","400","500","600","700"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const SITE_NAME = 'laguaridaguitarshop'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://laguaridaguitarshop.com'
const DEFAULT_DESCRIPTION = 'La Guarida Guitarshop — Guitarras, usados y clásicos. Compra y vende guitarras en Argentina.'

export const metadata = {
  title: {
    default: 'La Guarida Guitarshop',
    template: `%s | ${SITE_NAME}`
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ]
  },
  openGraph: {
    title: 'La Guarida Guitarshop',
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [`${SITE_URL}/images/og-image.jpg`],
    locale: 'es_AR',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Guarida Guitarshop',
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/images/og-image.jpg`]
  }
}

export default function RootLayout({ children }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "La Guarida Guitarshop",
    "url": SITE_URL,
    "logo": `${SITE_URL}/images/logo.png`,
    "sameAs": [
      "https://www.facebook.com/",
      "https://www.instagram.com/"
    ]
  }

  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": SITE_URL,
    "name": "La Guarida Guitarshop",
    "description": DEFAULT_DESCRIPTION,
    "publisher": { "@type": "Organization", "name": "La Guarida Guitarshop" }
  }

  return (
    <html lang="es">
      <head>
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
        <script type="application/ld+json">{JSON.stringify(siteLd)}</script>
        <link rel="canonical" href={SITE_URL} />
        {/* Preconnect to Supabase image host for faster image fetch when needed */}
        <link rel="preconnect" href="https://nlxihuohlbzxfsumnfxk.supabase.co" crossOrigin="" />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} ${libreBaskerville.variable} antialiased`}
      >
        <Header />
        <ToasterProvider />
        <ImageOrientationNormalizer />
        {children}
        <Footer />
        <WhatsAppFloating />
      </body>
    </html>
  );
}
