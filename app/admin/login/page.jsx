"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabaseClient'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleShowPassword = () => setShowPassword((s) => !s)

  async function handleLogin(e) {
    e?.preventDefault()
    setMessage('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    else router.push('/admin/dashboard')
  }

  async function handleSignup(e) {
    e?.preventDefault()
    setMessage('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setMessage(error.message)
    setMessage('Revisa tu email para confirmar la cuenta')

    // Create admin request (best-effort)
    try {
      const userId = data?.user?.id
      await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email })
      })
    } catch (err) {
      // ignore
    }
  }

  async function handleForgot(e) {
    e?.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/login' })
      setLoading(false)
      if (error) setMessage(error.message)
      else setMessage('Revisa tu email para restablecer la contraseña')
    } catch (err) {
      setLoading(false)
      setMessage('Error al solicitar recuperación de contraseña')
    }
  }

  return (
    <div className="admin-container admin-login" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <motion.div className="card" style={{width:420}}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div style={{textAlign:'left'}}>
            <div className="brand-title">La Guarida Guitarshop</div>
            <div className="muted" style={{fontSize:12}}>Acceso administradores</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-row">
            <label>Email</label>
            <input placeholder="tu@correo.com" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>

          <div className="form-row">
            <label>Contraseña</label>
            <div className="input-wrap" style={{position:'relative'}}>
              <input className={`password-input ${showPassword ? 'revealed' : ''}`} placeholder="••••••••" type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required />
              <button type="button" aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="eye-btn eye-right" onClick={toggleShowPassword}>
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <EyeIcon className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading && (
                <svg className="spinner" width="16" height="16" viewBox="0 0 50 50" aria-hidden>
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
              )}
              <span style={{marginLeft: loading ? 8 : 0}}>{loading? 'Procesando...' : 'Entrar'}</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleSignup} disabled={loading}>Crear cuenta</button>
            <button type="button" className="btn btn-ghost" onClick={handleForgot} disabled={loading}>Recuperar</button>
          </div>
        </form>

        {message && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{marginTop:12}} className="muted">
            {message}
          </motion.div>
        )}

        <div style={{marginTop:14,fontSize:13}} className="muted">
          <p>Nota: después de crear una cuenta se enviará una solicitud de acceso al propietario. El propietario deberá aprobarte para obtener permisos de administración.</p>
        </div>
      </motion.div>
    </div>
  )
}