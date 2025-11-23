import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import fs from 'fs'
import path from 'path'
import HeroRender from './HeroRender'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Hero() {
  // Server-side read of settings to avoid client flash of default image.
  let heroImage = '/images/homepage.jpeg'
  try {
    const SETTINGS_PATH = path.resolve(process.cwd(), 'data', 'settings.json')
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const json = JSON.parse(raw)
    if (json && json.heroImage) heroImage = json.heroImage
  } catch (err) {
    // ignore and use fallback
  }
  return <HeroRender heroImage={heroImage} />
}
