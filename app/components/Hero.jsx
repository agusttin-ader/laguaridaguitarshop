import fs from 'fs'
import path from 'path'
import HeroRender from './HeroRender'

export default function Hero() {
  // Server-side read of settings to avoid client flash of default image.
  let heroImage = '/images/homepage.jpeg'
  try {
    const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const json = JSON.parse(raw)
    if (json && json.heroImage) heroImage = json.heroImage
  } catch {
    // ignore and use fallback
  }
  return <HeroRender heroImage={heroImage} />
}
