"use client"

import { useState } from 'react'

export default function DallePanel(){
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function generate(){
    setLoading(true); setError(null); setResult(null)
    try{
      const res = await fetch('/api/dalle', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error')
      setResult(json.data)
    }catch(e){ setError(String(e)) }
    setLoading(false)
  }

  return (
    <div className="p-4 rounded-lg bg-[#0b0b0b]">
      <h3 className="text-lg font-semibold text-white">Generar imagen (DALL·E)</h3>
      <p className="text-sm text-white/70 mt-2">Escribí un prompt simple y rápido — esto requiere configurar `OPENAI_API_KEY` en el servidor.</p>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={3} className="w-full mt-3 p-3 rounded-md bg-black/20 text-white" placeholder="Guitarra eléctrica roja con fondo retro" />
      <div className="flex gap-2 mt-3">
        <button onClick={generate} disabled={loading || !prompt.trim()} className="btn btn-primary" aria-disabled={loading}>{loading ? 'Generando...' : 'Generar'}</button>
      </div>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      {result && (
        <div className="mt-4">
          <h4 className="text-sm text-white/70">Resultado</h4>
          <pre className="text-xs text-white/60 max-h-40 overflow-auto mt-2 bg-black/20 p-2 rounded">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
