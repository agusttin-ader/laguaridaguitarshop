#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function isValidSrc(s) {
  if (!s || typeof s !== 'string') return false
  const t = s.trim()
  if (t === '') return false
  if (t === '[object Object]') return false
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/') || t.startsWith('data:') || t.startsWith('blob:')) return true
  return false
}

async function run() {
  const cwd = process.cwd()
  const settingsPath = path.join(cwd, 'data', 'settings.json')
  const productsPath = path.join(cwd, 'app', 'data', 'products.json')

  if (!fs.existsSync(settingsPath)) {
    console.error('settings.json not found at', settingsPath)
    process.exit(1)
  }
  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at', productsPath)
    process.exit(1)
  }

  const rawSettings = fs.readFileSync(settingsPath, 'utf8')
  const rawProducts = fs.readFileSync(productsPath, 'utf8')

  let settings
  let products
  try { settings = JSON.parse(rawSettings || '{}') } catch (e) { console.error('Invalid settings.json', e); process.exit(1) }
  try { products = JSON.parse(rawProducts || '[]') } catch (e) { console.error('Invalid products.json', e); process.exit(1) }

  const backupPath = settingsPath + '.bak.' + Date.now()
  fs.copyFileSync(settingsPath, backupPath)
  console.log('Backup created at', backupPath)

  settings.featuredMain = settings.featuredMain || {}
  let changed = false

  for (const key of Object.keys(settings.featuredMain)) {
    const val = settings.featuredMain[key]
    if (isValidSrc(val)) continue
    // try to find product by id or slug
    const prod = products.find(p => (p.id === key) || (p.slug === key) || (p.title === key))
    const firstImg = prod && Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : null
    if (isValidSrc(firstImg)) {
      settings.featuredMain[key] = firstImg
      changed = true
      console.log('Replaced invalid featuredMain for', key, '->', firstImg)
    } else {
      settings.featuredMain[key] = null
      changed = true
      console.log('Cleared invalid featuredMain for', key)
    }
  }

  // Also ensure featured is array of strings
  if (!Array.isArray(settings.featured)) settings.featured = []

  if (changed) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    console.log('settings.json updated')
  } else {
    console.log('No changes needed')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
