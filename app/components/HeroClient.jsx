"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'

function pickBestVariant(entry, prefer = ['w1024', 'w640', 'w320']) {
  if (!entry) return null
  try {
    if (typeof entry === 'string') return entry
    if (typeof entry === 'object') {
      if (entry.variants && typeof entry.variants === 'object') {
        for (const k of prefer) {
          if (entry.variants[k]) {
            const s = String(entry.variants[k] || '').trim()
            if (s && s !== '[object Object]') return s
          }
        }
      }
      // fallback common keys
      if (entry.url && typeof entry.url === 'string') return entry.url
      if (entry.publicUrl && typeof entry.publicUrl === 'string') return entry.publicUrl
      if (entry.path && typeof entry.path === 'string') return entry.path
    }
  } catch { /* ignore */ }
  return null
}

export default function HeroClient(){
  const [entry, setEntry] = useState(null)

  useEffect(()=>{
    let mounted = true
    try {
      const bc = new BroadcastChannel('la-guarida-settings')
      bc.onmessage = (ev)=>{
        const data = ev.data || {}
        if (!mounted) return
        if (data.type === 'hero-updated' && data.url) setEntry(data.url)
      }
      return ()=> { mounted = false; bc.close() }
    } catch {
      // BroadcastChannel not supported or error - silently fail
      return () => {}
    }
  },[])

  const src = pickBestVariant(entry) || null
  if (!src) return null

  return (
    <div className="absolute inset-0 z-10 transition-opacity duration-500">
      <Image src={src} alt="Guitarra eléctrica premium" fill className="object-cover" sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw" loading="eager" />
    </div>
  )
}
