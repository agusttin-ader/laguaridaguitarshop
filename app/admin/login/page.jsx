"use client"

import { useState, useEffect, useRef } from 'react'
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
  const [urlError, setUrlError] = useState(null)
  const [urlErrorCode, setUrlErrorCode] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [newAdminId, setNewAdminId] = useState('')
  const [adminActionMsg, setAdminActionMsg] = useState('')
  const [showUserId, setShowUserId] = useState(false)
  const [pendingModalOpen, setPendingModalOpen] = useState(false)
  const pendingAutoSignoutRef = useRef(null)

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

  // Signup flow removed — authentication is via Google / magic links only.

  async function handleResendLink() {
    setMessage('')
    setLoading(true)
    try {
      const res = await supabase.auth.signInWithOtp({ email })
      console.debug('resend signInWithOtp', res)
      if (res.error) return setMessage(res.error.message)
      setMessage('Se reenvió un enlace a tu email para iniciar sesión.')
    } catch (err) {
      console.error('resend error', err)
      setMessage('Error al reenviar el enlace. Intentá nuevamente.')
    } finally { setLoading(false) }
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
          // detect supabase error fragments like #error=access_denied&error_code=otp_expired&error_description=...
          try {
            const fragParams = new URLSearchParams(hash.replace(/^#/, ''))
            const err = fragParams.get('error')
            const errCode = fragParams.get('error_code')
            const errDesc = fragParams.get('error_description')
            if (err) {
              setUrlError(errDesc || err)
              setUrlErrorCode(errCode || err)
              setMessage(errDesc ? decodeURIComponent(errDesc) : err)
            }
          } catch (e) {
            // ignore parsing errors
          }

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

  // fetch current session/user on mount
  useEffect(() => {
    let mounted2 = true
    ;(async () => {
      try {
        const { data: sessData } = await supabase.auth.getSession()
        const token = sessData?.session?.access_token
        const { data: userData } = await supabase.auth.getUser()
        if (!mounted2) return
        setAccessToken(token || null)
        setCurrentUser(userData?.user || null)
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
        setIsOwner((userData?.user?.email || '') === ownerEmail)
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted2 = false }
  }, [])

  // subscribe to auth changes to keep user updated
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const token = session?.access_token
        const { data: userData } = await supabase.auth.getUser()
        setAccessToken(token || null)
        setCurrentUser(userData?.user || null)
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
        setIsOwner((userData?.user?.email || '') === ownerEmail)
      } catch (e) {
        setCurrentUser(null)
        setAccessToken(null)
        setIsOwner(false)
      }
    })
    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  // After login, if user is not owner or admin, create a pending admin request and show modal then sign out
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!currentUser) return
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
        if ((currentUser.email || '') === ownerEmail) {
          try { router.replace('/admin/dashboard') } catch (_) {}
          return
        }

        // check admin via API using user's access token
        try {
          const res = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${accessToken}` } })
          if (res.ok) {
            // user is admin — redirect to dashboard
            try { router.replace('/admin/dashboard') } catch (_) {}
            return
          }
        } catch (e) {
          // ignore and proceed to create request
        }

        // create pending request (best-effort) so owner can see it
        try {
          await fetch('/api/admin/requests', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email }) })
        } catch (e) { /* ignore */ }

        // After creating the pending request, navigate to the dashboard and
        // let the dashboard UI show the pending-approval state. Do NOT
        // auto sign-out here (we want the user to see the dashboard page).
        if (!mounted) return
        try { router.replace('/admin/dashboard') } catch (_) { /* ignore */ }
      } catch (err) {
        console.error('post-login admin check error', err)
      }
    })()
    return () => { mounted = false; if (pendingAutoSignoutRef.current) { clearTimeout(pendingAutoSignoutRef.current); pendingAutoSignoutRef.current = null } }
  }, [currentUser, accessToken])

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

  async function signInWithGoogle() {
    setMessage('')
    try {
      const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')) + '/admin/login'
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
      if (error) setMessage(error.message)
    } catch (err) {
      console.error('google sign in error', err)
      setMessage('Error iniciando sesión con Google')
    }
  }

  async function handleSignOut() {
    setMessage('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('signOut error', error)
        setMessage('Error cerrando sesión: ' + (error.message || String(error)))
        return
      }
      // clear local UI state
      setCurrentUser(null)
      setAccessToken(null)
      setIsOwner(false)
      setShowUserId(false)
      setMessage('Sesión cerrada')
      // Force a full reload to ensure no user data remains in-memory
      if (typeof window !== 'undefined') {
        try {
          window.location.replace('/admin/login')
        } catch (_) {
          window.location.href = '/admin/login'
        }
      } else {
        try { router.replace('/admin/login') } catch (_) {}
      }
    } catch (err) {
      console.error('signOut unexpected', err)
      setMessage('Error cerrando sesión')
    }
  }

  async function handleAddAdmin(e) {
    e?.preventDefault()
    setAdminActionMsg('')
    if (!newAdminId) return setAdminActionMsg('Ingresá el id del usuario')
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ id: newAdminId })
      })
      const json = await res.json()
      if (!res.ok) return setAdminActionMsg(json?.error?.message || json?.error || 'Error agregando admin')
      setAdminActionMsg('Admin agregado correctamente')
      setNewAdminId('')
    } catch (err) {
      console.error('add admin error', err)
      setAdminActionMsg('Error agregando admin')
    }
  }

  return (
    <div className="admin-container admin-login" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <motion.div className="card" style={{maxWidth:420, width:'100%'}}
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
            {/* Signup removed — use Google or magic link */}
            <button type="button" className="btn btn-ghost" onClick={handleForgot} disabled={loading}>Recuperar</button>
          </div>
        </form>
        )}

        <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
          <button type="button" className="btn btn-ghost" onClick={signInWithGoogle}>Entrar con Google</button>

          {currentUser && (
            <div style={{border:'1px solid #eee', padding:12, borderRadius:6}}>
              <div style={{fontSize:13}}><strong>Conectado como:</strong> {currentUser.email}</div>
              <div style={{fontSize:12, color:'#666', marginTop:6, display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:'1 1 auto'}}>ID: <code style={{fontSize:12}}>{currentUser.id ? (showUserId ? currentUser.id : (String(currentUser.id).slice(0,6) + '...' + String(currentUser.id).slice(-4))) : ''}</code></div>
                <div style={{flex:'0 0 auto'}}>
                  <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:12}} onClick={() => setShowUserId(s => !s)}>{showUserId ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>
              <div style={{marginTop:8, display:'flex', gap:8}}>
                <button className="btn btn-ghost" onClick={handleSignOut}>Cerrar sesión</button>
                {isOwner && (
                  <button className="btn btn-primary" onClick={()=>router.push('/admin/dashboard')}>Ir a panel</button>
                )}
              </div>

              {/* The admin-grant control was removed from the login page on purpose.
                  Granting admin by user ID is available only in the admin dashboard
                  and only when the owner (NEXT_PUBLIC_OWNER_EMAIL) is signed in. */}
            </div>
          )}
        </div>

        {pendingModalOpen && (
          <div style={{position:'fixed',left:0,right:0,top:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
            <div style={{maxWidth:420, width:'100%', background:'#fff',padding:20,borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.2)'}}>
              <h3 style={{marginTop:0}}>Acceso en revisión</h3>
              <div style={{marginTop:8,fontSize:13,color:'#333'}}>Tu cuenta ha iniciado sesión pero necesita que el propietario <strong>agusttin.ader@gmail.com</strong> apruebe tu acceso. Se enviará una solicitud de acceso y, por seguridad, la sesión se cerrará automáticamente. Cuando el propietario te habilite, podrás iniciar sesión nuevamente y acceder al panel.</div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14}}>
                <button className="btn btn-ghost" onClick={() => {
                  // confirm, clear timer and sign out
                  if (pendingAutoSignoutRef.current) { clearTimeout(pendingAutoSignoutRef.current); pendingAutoSignoutRef.current = null }
                  setPendingModalOpen(false)
                  handleSignOut()
                }}>Entendido</button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{marginTop:12}} className="muted">
            {message}
            {urlErrorCode === 'otp_expired' && (
              <div style={{marginTop:8}}>
                <button className="btn btn-ghost" onClick={handleResendLink} disabled={loading} style={{marginRight:8}}>
                  Reenviar enlace
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Note about account creation removed — signup is disabled. */}
      </motion.div>
    </div>
  )
}
