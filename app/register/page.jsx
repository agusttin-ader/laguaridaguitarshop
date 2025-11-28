"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function RegisterPage(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e?.preventDefault()
    setMessage('')
    setError(null)
    if (!email) return setError('Ingresá un email válido')
    if (!username) return setError('Ingresá un nombre de usuario')
    if (!password) return setError('Ingresá una contraseña')
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setLoading(true)
    try {
      // Note: Supabase will send a confirmation email if email confirmations are enabled
      // We include `options.data` to store `username` as user metadata.
      const res = await supabase.auth.signUp({ email, password }, { options: { data: { username } } })
      if (res.error) {
        setError(res.error.message)
      } else {
        setMessage('Cuenta creada. Revisá tu email y confirmá la dirección para activar la cuenta.')
        // Optionally redirect to a 'check your inbox' page or clear form
        setEmail(''); setPassword(''); setConfirm(''); setUsername('')
      }
    } catch (err) {
      console.error('signup error', err)
      setError('Ocurrió un error creando la cuenta')
    } finally { setLoading(false) }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold text-white mb-4">Crear una cuenta</h1>
      <p className="text-sm text-white/70 mb-6">Completá los datos para crear tu cuenta. Te enviaremos un email para confirmar la dirección.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#0b0b0b] p-6 rounded-2xl shadow-md">
        <div>
          <label className="block text-sm text-white/80">Nombre de usuario</label>
          <input className="form-input mt-1 w-full" value={username} onChange={e=>setUsername(e.target.value)} placeholder="ej: agustin" required />
        </div>

        <div>
          <label className="block text-sm text-white/80">Email</label>
          <input className="form-input mt-1 w-full" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" required />
        </div>

        <div>
          <label className="block text-sm text-white/80">Contraseña</label>
          <input className="form-input mt-1 w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" required />
        </div>

        <div>
          <label className="block text-sm text-white/80">Confirmar contraseña</label>
          <input className="form-input mt-1 w-full" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repetí la contraseña" required />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
          <button type="button" className="btn btn-ghost" onClick={()=>router.push('/admin/login')}>Volver al login</button>
        </div>

        {message && <div className="text-sm text-green-400 mt-2">{message}</div>}
        {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
      </form>

      <div className="mt-6 text-xs text-white/60">
        <p>Nota: si no recibís el email de confirmación revisá spam o contactá al administrador.</p>
      </div>
    </main>
  )
}
