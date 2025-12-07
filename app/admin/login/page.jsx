"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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
  const [urlErrorCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  
  const [showUserId, setShowUserId] = useState(false)
  const [pendingModalOpen, setPendingModalOpen] = useState(false)
  const pendingAutoSignoutRef = useRef(null)

  const toggleShowPassword = () => setShowPassword((s) => !s)

  async function handleLogin(e) {
    e?.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      // Diagnostic: quick reachability checks to help debug remote timeouts
      try {
        // Check our own server-side health endpoint to see if envs are present
        try {
          const hctl = new AbortController()
          const ht = setTimeout(() => hctl.abort(), 3000)
          const hres = await fetch('/api/admin/health', { method: 'GET', signal: hctl.signal })
          if (hres.ok) {
            // health OK — nothing to log in production
            await hres.json()
          }
          clearTimeout(ht)
          } catch {
            // ignore health check network errors in production
        }
      } catch {
        // diagnostics failed; ignore silently
      }

      // Attempt signInWithPassword with a timeout and one retry to handle
      // transient network or deploy/storage readiness issues on some clients.
      const timeoutMs = 10000 // 10s per attempt
      async function attemptSignInWithRetry(attempts = 2) {
        let lastErr = null
        for (let i = 0; i < attempts; i++) {
          const signInPromise = supabase.auth.signInWithPassword({ email, password })
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
          try {
            const res = await Promise.race([signInPromise, timeoutPromise])
            return res
            } catch (err) {
            lastErr = err
            // retry once with small backoff
            if (i === 0) await new Promise(r => setTimeout(r, 1500))
          }
        }
        throw lastErr
      }

      let res
      try {
        res = await attemptSignInWithRetry(2)
      } catch (err) {
        console.error('signInWithPassword network/timeout error after retries', err)
        // The signIn call timed out or failed transiently. It's possible the
        // session was still created on the server but the promise didn't
        // resolve in time (some deploys/storage combos show this behavior).
        // Attempt a short, aggressive session check before bailing out so
        // users who actually signed in aren't left with an error message.
        try {
          const start = Date.now()
          const timeout = 4000
          let foundSession = null
          while (Date.now() - start < timeout) {
            try {
              const { data: sessData } = await supabase.auth.getSession()
              if (sessData && sessData.session && sessData.session.access_token) {
                foundSession = sessData.session
                break
              }
            } catch (_) {
              // ignore transient errors
            }
            await new Promise(r => setTimeout(r, 200))
          }
          if (foundSession) {
            try {
              const { data: userData } = await supabase.auth.getUser()
              const token = foundSession.access_token
              if (token) setAccessToken(token)
              if (userData?.user) setCurrentUser(userData.user)
            } catch (_) {
              // ignore getUser failures
            }
            try { router.replace('/admin/dashboard') } catch { router.push('/admin/dashboard') }
            setLoading(false)
            return
          }
        } catch (_) {
          // ignore
        }

        setLoading(false)
        return setMessage('Error de red o el servidor no respondió. Verificá conexión y variables de entorno en el deploy.')
      }
      const data = res?.data || res
      const error = res?.error || null
      if (error) {
        setLoading(false)
        return setMessage(error.message || 'Error iniciando sesión')
      }

      // If sign in returns a session/user, set local state immediately.
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
          } catch {}
          // small delay
          await new Promise(r => setTimeout(r, 120))
        }
        return null
      }

      try {
        // Increase wait slightly to handle slower clients/networks
        await waitForSession(3000)
          } catch {
            // ignore waitForSession failures
          }

      // If we got here and a user object exists, navigate to dashboard.
      // Some deploy environments delay session persistence; as a safety
      // net we redirect if either a user OR an access token exists. This
      // covers cases where the SDK returns a session token but the user
      // object may not be populated immediately on slower clients.
      if (user || token) {
        try { router.replace('/admin/dashboard') } catch { router.push('/admin/dashboard') }
        // Short navigation fallback: if client navigation doesn't take effect
        // (some deploys delay storage persistence) perform a hard redirect
        // after a short timeout. This is conservative and only triggers
        // when the page remains on /admin/login.
        try {
          setTimeout(() => {
            try {
              if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname.startsWith('/admin/login')) {
                // prefer replace to avoid leaving a stale history entry
                window.location.replace('/admin/dashboard')
              }
            } catch (_) {}
          }, 600)
        } catch (_) {}
        return
      }

      // Fallback: if no user and no error, inform the user
      setMessage('No se pudo iniciar sesión automáticamente. Intentá recargar la página o contactá al soporte.')
    } catch (err) {
      console.error('login unexpected error', err)
      setMessage(err?.message || 'Error iniciando sesión')
    } finally {
      setLoading(false)
    }
  }

  // Signup flow removed — authentication is via Google / magic links only.

  async function handleResendLink() {
    setMessage('')
    setLoading(true)
    try {
      const res = await supabase.auth.signInWithOtp({ email })
      if (res.error) return setMessage(res.error.message)
      setMessage('Se reenvió un enlace a tu email para iniciar sesión.')
    } catch (err) {
      console.error('resend error', err)
      setMessage('Error al reenviar el enlace. Intentá nuevamente.')
    } finally { setLoading(false) }
  }

  // password reset via UI removed; rely on magic links via Supabase

  // Password recovery via in-app flow removed. Use magic links (supabase) for recovery.

  // fetch current session/user on mount — perform a short, aggressive
  // check (retries) so on initial visit we can decide whether to render
  // the login UI or redirect immediately. This reduces race conditions
  // observed in some deploy environments (client storage readiness).
  useEffect(() => {
    let mounted2 = true
    ;(async () => {
      try {
        const deadline = Date.now() + 2000 // 2s max
        let found = false
        while (Date.now() < deadline && mounted2) {
          try {
            const { data: sessData } = await supabase.auth.getSession()
            const token = sessData?.session?.access_token
            if (token) {
              const { data: userData } = await supabase.auth.getUser()
              if (!mounted2) break
              setAccessToken(token || null)
              setCurrentUser(userData?.user || null)
              const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
              setIsOwner((userData?.user?.email || '') === ownerEmail)
              found = true
              break
            }
          } catch {
            // ignore transient errors
          }
          // small backoff
          await new Promise(r => setTimeout(r, 120))
        }

        if (!found && mounted2) {
          try {
            const { data: userData } = await supabase.auth.getUser()
            if (mounted2) {
              setCurrentUser(userData?.user || null)
              const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
              setIsOwner((userData?.user?.email || '') === ownerEmail)
            }
          } catch {
            // ignore
          }
        }
          } catch {
        // ignore
      } finally {
        if (mounted2) setCheckedAuth(true)
      }
    })()
    return () => { mounted2 = false }
  }, [])

  // Only redirect once we've completed the initial auth check. This avoids
  // redirecting prematurely before we know whether a session exists.
  useEffect(() => {
    if (!checkedAuth) return
    if (!currentUser) return
    try {
      router.replace('/admin/dashboard')
    } catch {
      router.push('/admin/dashboard')
    }
  }, [checkedAuth, currentUser, router])

  // subscribe to auth changes to keep user updated
  useEffect(() => {
    // Subscribe to auth state changes and redirect immediately on sign-in.
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const token = session?.access_token
        const { data: userData } = await supabase.auth.getUser()
        setAccessToken(token || null)
        setCurrentUser(userData?.user || null)
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
        setIsOwner((userData?.user?.email || '') === ownerEmail)

        // On sign in, try router navigation first, then fall back to hard
        // navigation to ensure the client ends up on the dashboard.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          try { router.replace('/admin/dashboard') } catch { router.push('/admin/dashboard') }
          try {
            // If router didn't navigate for some reason, force a full reload
            // to the dashboard after a short grace period.
            setTimeout(() => {
              try {
                if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname.startsWith('/admin/login')) {
                  window.location.replace('/admin/dashboard')
                }
              } catch (_) {}
            }, 400)
          } catch (_) {}
        }
      } catch (err) {
        setCurrentUser(null)
        setAccessToken(null)
        setIsOwner(false)
      }
    })
    return () => data?.subscription?.unsubscribe?.()
  }, [router])

  // After login, if user is not owner or admin, create a pending admin request and show modal then sign out
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!currentUser) return
        const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'agusttin.ader@gmail.com'
        if ((currentUser.email || '') === ownerEmail) {
          try { router.replace('/admin/dashboard') } catch {}
          return
        }

        // check admin via API using user's access token
        try {
          const res = await fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${accessToken}` } })
          if (res.ok) {
            // user is admin — redirect to dashboard
            try { router.replace('/admin/dashboard') } catch {}
            return
          }
        } catch {
          // ignore and proceed to create request
        }

        // create pending request (best-effort) so owner can see it
        try {
          await fetch('/api/admin/requests', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: currentUser.id, email: currentUser.email }) })
        } catch { /* ignore */ }

        // After creating the pending request, navigate to the dashboard and
        // let the dashboard UI show the pending-approval state. Do NOT
        // auto sign-out here (we want the user to see the dashboard page).
        if (!mounted) return
        try { router.replace('/admin/dashboard') } catch { /* ignore */ }
      } catch (err) {
        console.error('post-login admin check error', err)
      }
    })()
    return () => { mounted = false; if (pendingAutoSignoutRef.current) { clearTimeout(pendingAutoSignoutRef.current); pendingAutoSignoutRef.current = null } }
  }, [currentUser, accessToken, router])

  // In-app recovery handler removed.


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
        } catch {
          window.location.href = '/admin/login'
        }
      } else {
        try { router.replace('/admin/login') } catch {}
      }
    } catch (err) {
      console.error('signOut unexpected', err)
      setMessage('Error cerrando sesión')
    }
  }

  // Admin grant via ID removed from login page; use dashboard UI instead.

  return (
    <div className="admin-container admin-login" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <motion.div className="card" style={{maxWidth:420, width:'100%'}}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="brand" style={{display:'flex', alignItems:'center', gap:16}}>
          <div className="brand-mark" aria-hidden style={{width:220, height:88, display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 220px', background:'transparent', boxShadow:'none', border:'none'}}>
            <Image src="/images/logo-rect.svg" alt="La Guarida" width={220} height={88} className="object-contain block" style={{objectFit:'contain', width:'100%', height:'100%', background:'transparent', boxShadow:'none'}} />
          </div>
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
            <button className="btn whatsapp-cta" type="submit" disabled={loading} style={{width:'50%', maxWidth: '50%', padding:'12px 20px', margin:'0 auto', textAlign:'center', display:'block'}}>
              {loading && (
                <svg className="spinner" width="16" height="16" viewBox="0 0 50 50" aria-hidden>
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
              )}
              <span style={{marginLeft: loading ? 8 : 0, display:'inline-block', width:'100%', textAlign:'center'}}>{loading? 'Procesando...' : 'Iniciar sesión'}</span>
            </button>
          </div>
        </form>

        <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:8}}>
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
