"use client"

import { useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'

export default function ToasterProvider(){
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') toast.dismiss() }
    if (typeof window !== 'undefined') window.addEventListener('keydown', onKey)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        // sensible defaults and per-type overrides (shorter durations)
          duration: 2500,
          success: { duration: 2000 },
          error: { duration: 3500 },
        style: {
          borderRadius: 8,
          background: '#0b0b0b',
          color: '#fff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }
      }}
    />
  )
}
