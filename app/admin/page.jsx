"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminIndex(){
  const router = useRouter()

  useEffect(()=>{
    // Redirect to the dashboard
    router.replace('/admin/dashboard')
  },[router])

  return (
    <div style={{padding:20}}>
      <h1>Redirigiendo al panel de administración…</h1>
      <p>Si no eres redirigido automáticamente, <a href="/admin/dashboard">haz click aquí</a>.</p>
    </div>
  )
}
