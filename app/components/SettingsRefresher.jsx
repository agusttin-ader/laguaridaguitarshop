"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRefresher() {
  const router = useRouter()
  const lastSettingsRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let bc = null
    let polling = null

    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) return null
        const json = await res.json().catch(()=>null)
        return json
      } catch (_) { return null }
    }

    async function checkOnceAndStore() {
      const s = await fetchSettings()
      if (s) lastSettingsRef.current = JSON.stringify({ featured: s.featured || [], heroImage: s.heroImage || '' })
    }

    // initial store
    checkOnceAndStore()

    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('la-guarida-settings')
        bc.addEventListener('message', async (ev) => {
          try {
            const msg = ev.data || {}
            if (msg && (msg.type === 'featured-updated' || msg.type === 'hero-updated')) {
              try { router.refresh() } catch (_) { window.location.reload() }
            }
          } catch (_) {}
        })
      }
    } catch (e) {
      // ignore
    }

    // Poll every 5s as a robust fallback in case BroadcastChannel is unavailable
    polling = setInterval(async () => {
      try {
        const s = await fetchSettings()
        if (!s) return
        const key = JSON.stringify({ featured: s.featured || [], heroImage: s.heroImage || '' })
        if (lastSettingsRef.current && lastSettingsRef.current !== key) {
          lastSettingsRef.current = key
          try { router.refresh() } catch (_) { window.location.reload() }
        } else {
          lastSettingsRef.current = key
        }
      } catch (_) {}
    }, 5000)

    return () => {
      try { bc && bc.close() } catch (_) {}
      try { if (polling) clearInterval(polling) } catch (_) {}
    }
  }, [router])

  return null
}
