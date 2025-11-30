import fs from 'fs'
import path from 'path'
import HeroRender from './HeroRender'

export default function Hero() {
  // Allow runtime override from environment (useful on Vercel dashboard)
  // Use process.env.HERO_IMAGE if present, otherwise fall back to data/settings.json
  let heroImage = (process.env.HERO_IMAGE && String(process.env.HERO_IMAGE).trim()) || '/images/homepage.jpeg'
  if (!process.env.HERO_IMAGE) {
    try {
      const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      const json = JSON.parse(raw)
      if (json && json.heroImage) heroImage = json.heroImage
    } catch {
      // ignore and use fallback
    }
  }

  return <HeroRender heroImage={heroImage} />
}
