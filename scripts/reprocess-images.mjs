#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import sharp from 'sharp'

// Usage: node scripts/reprocess-images.mjs [--bucket product-images] [--prefix <prefix>] [--limit 100]

const argv = process.argv.slice(2)
const getArg = (name, fallback) => {
  const idx = argv.indexOf(name)
  if (idx === -1) return fallback
  return argv[idx+1] || fallback
}
const bucket = getArg('--bucket', getArg('-b', 'product-images'))
const prefix = getArg('--prefix', getArg('-p', ''))
const limit = parseInt(getArg('--limit', getArg('-l', '100')), 10) || 100

async function main(){
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required to run this script')
    process.exit(1)
  }

  console.log('Listing files from bucket', bucket, 'prefix', prefix)
  const { data: list, error: listErr } = await supabaseAdmin.storage.from(bucket).list(prefix || '', { limit })
  if (listErr) {
    console.error('Failed to list objects', listErr)
    process.exit(1)
  }

  for (const item of list) {
    try {
      if (!item.name) continue
      const name = item.name
      // skip already-generated variants (we target originals without -w###)
      if (/\-w\d+\.webp$/.test(name)) {
        console.log('Skipping variant:', name)
        continue
      }

      console.log('Processing', name)
      const { data: down, error: downErr } = await supabaseAdmin.storage.from(bucket).download(name)
      if (downErr || !down) { console.warn('Download failed for', name, downErr); continue }
      const buf = await down.arrayBuffer().then(a=>Buffer.from(a))
      const normalized = await (async ()=>{
        try {
          const img = sharp(buf)
          return await img.rotate().jpeg({ quality: 90 }).toBuffer()
        } catch (e) { return buf }
      })()

      // generate variants
      const sizes = [320, 640, 1024, 2048]
      for (const w of sizes) {
        try {
          const h = Math.round(w * 4 / 3)
          const outBuffer = await sharp(normalized).resize({ width: w, height: h, fit: 'cover' }).webp({ quality: 85 }).toBuffer()
          const outName = `${Date.now()}_${name}-w${w}.webp`
          const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(outName, outBuffer, { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' })
          if (upErr) console.warn('Failed to upload variant', outName, upErr)
          else console.log('Uploaded', outName)
        } catch (e) { console.warn('Variant generation failed for', name, e) }
      }

    } catch (e) { console.error('Processing failed', e) }
  }
}

main().then(()=>console.log('Done')).catch(err=>{ console.error(err); process.exit(1) })
