"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HeroClient(){
  const [src, setSrc] = useState(null)

  useEffect(()=>{
    let mounted = true
    try {
      const bc = new BroadcastChannel('la-guarida-settings')
      bc.onmessage = (ev)=>{
        const data = ev.data || {}
        if (!mounted) return
        if (data.type === 'hero-updated' && data.url) setSrc(data.url)
      }
      return ()=> { mounted = false; bc.close() }
    } catch (err) {
      // BroadcastChannel not supported or error - silently fail
      return () => {}
    }
  },[])

  if (!src) return null

  return (
    <div className="absolute inset-0 z-10 transition-opacity duration-500">
      <Image src={src} alt="Guitarra eléctrica premium" fill className="object-cover" sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw" />
    </div>
  )
}
