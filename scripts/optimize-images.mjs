#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { info, error } from './logger.mjs'

// Simple image optimizer: generates WebP variants at multiple widths
// Usage: `node ./scripts/optimize-images.mjs` or `npm run optimize:images`

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images')
const OUT_DIR = path.join(PUBLIC_DIR, '_optimized')
const SIZES = [320, 640, 1024]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function isImageFile(name) {
  return /\.(jpe?g|png|webp|avif)$/i.test(name)
}

async function processFile(file) {
  const input = path.join(IMAGES_DIR, file)
  const base = path.parse(file).name

  for (const w of SIZES) {
    // WebP output
    const outNameWebp = `${base}-w${w}.webp`
    const outPathWebp = path.join(OUT_DIR, outNameWebp)
    // AVIF output
    const outNameAvif = `${base}-w${w}.avif`
    const outPathAvif = path.join(OUT_DIR, outNameAvif)
    try {
      await sharp(input).resize({ width: w }).webp({ quality: 80 }).toFile(outPathWebp)
      info('Wrote', outPathWebp)
    } catch (err) {
      error('Failed to process webp', input, err)
    }
    try {
      await sharp(input).resize({ width: w }).avif({ quality: 60 }).toFile(outPathAvif)
      info('Wrote', outPathAvif)
    } catch (err) {
      error('Failed to process avif', input, err)
    }
  }
}

async function run() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('No images directory found at', IMAGES_DIR)
    process.exit(1)
  }
  ensureDir(OUT_DIR)

  const files = fs.readdirSync(IMAGES_DIR).filter(isImageFile)
  if (files.length === 0) {
    info('No image files to optimize in', IMAGES_DIR)
    return
  }

  for (const f of files) await processFile(f)
  info('Done — optimized images are in', OUT_DIR)
}

run().catch(err => { console.error(err); process.exit(1) })
