"use client"

import { useState, useEffect } from 'react'
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
  const [debugInfo, setDebugInfo] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/reset-password' })
      setLoading(false)
      if (error) setMessage(error.message)
      else setMessage('Revisa tu email para restablecer la contraseña')
    } catch (err) {
      setLoading(false)
      setMessage('Error al solicitar recuperación de contraseña')
    }
  }

  // Handle Supabase password recovery redirect callback
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // First try: let Supabase parse the URL fragment and store session
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        if (!mounted) return
        const session = data?.session ?? null
        if (error) {
          console.debug('getSessionFromUrl error', error)
          setMessage('Error procesando el enlace de recuperación: ' + (error?.message || JSON.stringify(error)))
          setDebugInfo((d)=> ({...d, getSessionFromUrlError: error?.message || JSON.stringify(error)}))
        }
        if (session) {
          // We're in a recovery callback — show UI to set a new password
          setRecoveryMode(true)
          setMessage('Establecé una nueva contraseña')
          return
        }

        // Fallback: sometimes the fragment isn't parsed (or app origin mismatch).
        // Parse location.hash or search for access_token and type=recovery and set session manually.
        if (typeof window !== 'undefined') {
          const hash = window.location.hash || ''
          const search = window.location.search || ''
          console.debug('Login page fallback hash:', hash)
          console.debug('Login page fallback search:', search)

          let params = new URLSearchParams(hash.replace(/^#/, ''))
          let access_token = params.get('access_token')
          let refresh_token = params.get('refresh_token')
          let type = params.get('type')

          if (!access_token) {
            params = new URLSearchParams(search.replace(/^\?/, ''))
            access_token = params.get('access_token')
            refresh_token = params.get('refresh_token')
            type = params.get('type')
          }

          // store debug info
          const mask = (t)=> t ? (t.slice(0,6) + '...' + t.slice(-4)) : null
          setDebugInfo({ hash, search, access_token_present: !!access_token, access_token_masked: mask(access_token), type })

          if (access_token) {
            console.debug('Attempting to set session from tokens (login fallback)')
            const setRes = await supabase.auth.setSession({ access_token, refresh_token })
            console.debug('setSession result', setRes)
            if (setRes?.error) {
              setMessage('No se pudo establecer la sesión: ' + (setRes.error?.message || JSON.stringify(setRes.error)))
              setDebugInfo((d)=> ({...d, setSessionError: setRes.error?.message || JSON.stringify(setRes.error)}))
            }
            if (setRes?.data?.session) {
              if (!mounted) return
              setRecoveryMode(true)
              setMessage('Establecé una nueva contraseña')
              try { history.replaceState(null, '', window.location.pathname + window.location.search) } catch (_) {}
              return
            }
          }
        }
      } catch (err) {
        console.debug('login getSession fallback error', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function handleCompleteRecovery(e) {
    e?.preventDefault()
    setMessage('')
    if (!newPassword) return setMessage('Ingresá una contraseña')
    if (newPassword !== confirmPassword) return setMessage('Las contraseñas no coinciden')
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      setLoading(false)
      if (error) {
        const extra = ' Si el problema persiste, solicitá un nuevo enlace desde el login.'
        return setMessage((error.message || 'Error actualizando contraseña') + extra)
      }
      // After successfully updating password, sign out and redirect to login for fresh auth
      try { await supabase.auth.signOut() } catch (_) {}
      setMessage('Contraseña actualizada. Podés iniciar sesión con tu nueva contraseña.')
      setRecoveryMode(false)
      router.replace('/admin/login')
    } catch (err) {
      setLoading(false)
      setMessage('Error durante la recuperación. Intentá solicitar un nuevo enlace desde el login.')
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

        {recoveryMode ? (
          <form onSubmit={handleCompleteRecovery}>
            <div className="form-row">
              <label>Nueva contraseña</label>
              <input placeholder="Nueva contraseña" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Confirmar contraseña</label>
              <input placeholder="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required />
            </div>

            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Procesando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        ) : (
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
        )}

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