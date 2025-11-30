// Load environment variables, prefer .env.local (used by Next.js)
import dotenv from 'dotenv'
import fs from 'fs'
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
} else {
  dotenv.config()
}
import path from 'path'
import supabaseAdmin from '../lib/supabaseAdmin.js'
import { info, warn, error } from './logger.mjs'

async function main(){
  const dataPath = path.join(process.cwd(), 'app', 'data', 'products.json')
  if (!fs.existsSync(dataPath)){
    console.error('No products.json found at', dataPath)
    process.exit(1)
  }

  const raw = await fs.promises.readFile(dataPath, 'utf8')
  let products = []
  try { products = JSON.parse(raw || '[]') } catch (e){ console.error('Invalid JSON', e); process.exit(1) }

  if (!Array.isArray(products) || products.length === 0){
    info('No products to migrate.')
    process.exit(0)
  }
  info(`Found ${products.length} products to migrate.`)

  let inserted = 0, skipped = 0

  for (const p of products){
    const title = p.title || p.name || ''
    if (!title){ info('Skipping product without title', p); skipped++; continue }

    // Normalize price to number when possible
    let priceNum = null
    if (typeof p.price === 'number') priceNum = p.price
    else if (typeof p.price === 'string'){
      const num = parseFloat(p.price.replace(/[^[0-9].,]/g, '').replace(',', '.'))
      if (!Number.isNaN(num)) priceNum = num
    }

    try {
      // Check by title exact match first
      const { data: existing, error: selErr } = await supabaseAdmin.from('products').select('id,title').eq('title', title).limit(1).maybeSingle()
      if (selErr){ warn('Warning checking existing', selErr); }
      if (existing) { info('Skipping existing:', title); skipped++; continue }

      const row = { title, description: p.description || '', specs: p.specs || {}, price: priceNum, images: p.images || [] }
      const { data, error } = await supabaseAdmin.from('products').insert([row]).select().maybeSingle()
      if (error){ error('Insert error for', title, error); skipped++; continue }
      info('Inserted:', data.id, title)
      inserted++
    } catch (err){ error('Error migrating', title, err); skipped++; }
  }

  // Backup original JSON
  const bakPath = path.join(process.cwd(), 'app', 'data', `products.json.bak.${Date.now()}`)
  try {
    await fs.promises.rename(dataPath, bakPath)
    info('Backed up products.json to', bakPath)
  } catch (e){ console.warn('Failed to rename products.json', e) }

  info(`Migration finished. inserted=${inserted} skipped=${skipped}`)
}

main().catch((err)=>{ console.error(err); process.exit(1) })
