import Hero from "./components/Hero";
import ModelsSection from "./components/ModelsSection";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://laguaridaguitarshop.com'

export const metadata = {
  title: 'La Guarida Guitarshop - Guitarras, usados y clásicos',
  description: 'La Guarida Guitarshop — Guitarras nuevas y usadas. Compra y vende guitarras, accesorios y equipos de segunda mano en Argentina.',
  openGraph: {
    title: 'La Guarida Guitarshop',
    description: 'Guitarras nuevas y usadas. Compra y vende guitarras y accesorios en Argentina.',
    url: SITE_URL,
    images: [`${SITE_URL}/images/og-image.jpg`],
    siteName: 'La Guarida Guitarshop',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Guarida Guitarshop',
    description: 'Guitarras nuevas y usadas. Compra y vende guitarras y accesorios en Argentina.'
  }
}

export default function Home() {
  return (
    <main className="font-sans">
      <Hero />
      <ModelsSection />
    </main>
  );
}
