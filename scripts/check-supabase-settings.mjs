#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(2)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function testDb() {
  console.log('Testing DB upsert/select...')
  const payload = { featured: ['demo-1','demo-2'], heroImage: '/images/test-hero.jpg', ts: new Date().toISOString() }
  try {
    const { error: upsertErr } = await supabase.from('settings').upsert({ id: 'site', payload }, { returning: 'representation' })
    if (upsertErr) {
      console.error('DB upsert error:', upsertErr)
    } else {
      console.log('DB upsert OK')
    }

    const { data, error: selErr } = await supabase.from('settings').select('payload').eq('id', 'site').maybeSingle()
    if (selErr) {
      console.error('DB select error:', selErr)
    } else {
      console.log('DB select OK. payload:', JSON.stringify(data?.payload || null))
    }
  } catch (e) {
    console.error('DB test exception:', e)
  }
}

async function testStorage() {
  console.log('\nTesting Storage upload/download...')
  const keyPath = 'site-settings/settings.json'
  const content = JSON.stringify({ featured: ['s1'], heroImage: '/images/test.jpg', ts: new Date().toISOString() }, null, 2)
  try {
    const { data: uploadData, error: uploadErr } = await supabase.storage.from('product-images').upload(keyPath, Buffer.from(content, 'utf-8'), { upsert: true })
    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
    } else {
      console.log('Storage upload OK', uploadData?.path)
      const { data: down, error: downErr } = await supabase.storage.from('product-images').download(keyPath)
      if (downErr) {
        console.error('Storage download error:', downErr)
      } else {
        const text = await (await down.arrayBuffer()).toString()
        console.log('Storage download OK. content:', text)
      }
    }
  } catch (e) {
    console.error('Storage test exception:', e)
  }
}

async function main(){
  await testDb()
  await testStorage()
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1)})
