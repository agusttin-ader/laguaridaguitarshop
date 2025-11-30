import fs from 'fs'
import path from 'path'
import HeroRender from './HeroRender'

export default function Hero() {
  // Determine whether runtime env overrides are enabled. By default this is
  // disabled so the admin panel remains authoritative. To enable, set
  // `ENABLE_ENV_OVERRIDES=true` in your Vercel env vars.
  let heroImage = '/images/homepage.jpeg'
  try {
    const enabled = String(process.env.ENABLE_ENV_OVERRIDES || 'false').toLowerCase() === 'true'
    if (enabled && process.env.HERO_IMAGE && String(process.env.HERO_IMAGE).trim() !== '') {
      heroImage = String(process.env.HERO_IMAGE).trim()
    } else {
      try {
        const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
        const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
        const json = JSON.parse(raw)
        if (json && json.heroImage) heroImage = json.heroImage
      } catch {
        // ignore and use fallback
      }
    }
  } catch (e) {
    // if env read/parsing fails, fall back to settings file
    try {
      const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      const json = JSON.parse(raw)
      if (json && json.heroImage) heroImage = json.heroImage
    } catch {}
  }

  return <HeroRender heroImage={heroImage} />
}
