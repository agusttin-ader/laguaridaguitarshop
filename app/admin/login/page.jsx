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
  const [urlErrorCode, setUrlErrorCode] = useState(null)
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) return setMessage(error.message)
      // If sign in returns a session, set local state immediately and navigate.
      const token = data?.session?.access_token || null
      const user = data?.user || null
      if (token) setAccessToken(token)
      if (user) setCurrentUser(user)
      // Wait briefly for Supabase client to persist the session (race-condition
      // where navigating immediately causes the dashboard to read no session)
      async function waitForSession(timeout = 1500) {
        const start = Date.now()
        while (Date.now() - start < timeout) {
          try {
            const { data: sessData } = await supabase.auth.getSession()
            if (sessData && sessData.session && sessData.session.access_token) return sessData.session
          } catch (_) {}
          // small delay
          await new Promise(r => setTimeout(r, 120))
        }
        return null
      }

      try {
        await waitForSession(1500)
      } catch (_) {}

      // Use replace to avoid leaving a back entry to the login page
      try { router.replace('/admin/dashboard') } catch (_) { router.push('/admin/dashboard') }
    } catch (err) {
      setLoading(false)
      console.error('login error', err)
      setMessage(err?.message || 'Error iniciando sesión')
    }
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

  // password reset via UI removed; rely on magic links via Supabase

  // Password recovery via in-app flow removed. Use magic links (supabase) for recovery.

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
  }, [currentUser, accessToken, router])

  // In-app recovery handler removed.

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

          <div style={{display:'flex',justifyContent:'center',gap:8,alignItems:'center',marginTop:8}}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading && (
                <svg className="spinner" width="16" height="16" viewBox="0 0 50 50" aria-hidden>
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
              )}
              <span style={{marginLeft: loading ? 8 : 0}}>{loading? 'Procesando...' : 'Entrar'}</span>
            </button>
          </div>
        </form>

        <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
          <button type="button" className="btn btn-ghost" onClick={signInWithGoogle}>Entrar con Google</button>

          {currentUser && (
            <div className="admin-user-card">
              <div className="admin-user-email"><strong>Conectado como:</strong> {currentUser.email}</div>

              <div className="admin-user-id-row">
                <div className="admin-user-id">ID: <code className="admin-user-id-code">{currentUser.id ? (showUserId ? currentUser.id : (String(currentUser.id).slice(0,6) + '...' + String(currentUser.id).slice(-4))) : ''}</code></div>
                <div className="admin-user-id-toggle">
                  <button className="btn btn-ghost admin-user-toggle-btn" onClick={() => setShowUserId(s => !s)}>{showUserId ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>

              <div className="admin-user-actions">
                <button className="btn btn-ghost admin-user-logout" onClick={handleSignOut}>Cerrar sesión</button>
                {isOwner && (
                  <button className="btn btn-primary admin-user-panel" onClick={()=>router.push('/admin/dashboard')}>Ir a panel</button>
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
