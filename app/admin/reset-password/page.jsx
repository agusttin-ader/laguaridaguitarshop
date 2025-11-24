"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [manualAccess, setManualAccess] = useState('')
  const [manualRefresh, setManualRefresh] = useState('')

  async function trySetSessionFromParams(h = '', s = '') {
    const params = new URLSearchParams((h || '').replace(/^#/, ''))
    let access_token = params.get('access_token')
    let refresh_token = params.get('refresh_token')
    let type = params.get('type')

    if (!access_token) {
      const q = new URLSearchParams((s || '').replace(/^\?/, ''))
      access_token = q.get('access_token')
      refresh_token = q.get('refresh_token')
      type = q.get('type')
    }

    const mask = (t) => (t ? t.slice(0, 6) + '...' + t.slice(-4) : null)
    setDebugInfo({ hash: h, search: s, access_token_present: !!access_token, access_token_masked: mask(access_token), type })

    if (!access_token) return false

    try {
      setMessage('Intentando establecer sesión con token...')
      const res = await supabase.auth.setSession({ access_token, refresh_token })
      console.debug('setSession result', res)
      if (res?.error) {
        setSessionError(res.error?.message || JSON.stringify(res.error))
        setMessage('No se pudo establecer la sesión: ' + (res.error?.message || 'error desconocido'))
        return false
      }
      if (res?.data?.session) {
        setReady(true)
        setMessage('Sesión establecida. Podés ingresar tu nueva contraseña abajo.')
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search)
        } catch (_e) {}
        return true
      }
    } catch (err) {
      console.debug('setSession threw', err)
      setSessionError(String(err))
      setMessage('Error estableciendo sesión con token')
    }
    return false
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        if (!mounted) return
        if (error) {
          console.debug('getSessionFromUrl error', error)
          setMessage('Error procesando enlace: ' + (error?.message || JSON.stringify(error)))
        }
        if (data?.session) {
          setReady(true)
          setMessage('Sesión establecida. Podés ingresar tu nueva contraseña abajo.')
          return
        }

        if (typeof window !== 'undefined') {
          await trySetSessionFromParams(window.location.hash || '', window.location.search || '')
        }
      } catch (err) {
        console.debug('reset page init error', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function handleUsePasted() {
    if (!pasteUrl) return setMessage('Pegá el enlace primero')
    setMessage('Procesando enlace pegado...')
    try {
      let u
      try {
        u = new URL(pasteUrl)
      } catch (e) {
        if (pasteUrl.startsWith('#') || pasteUrl.startsWith('?')) {
          u = new URL(window.location.origin + '/admin/reset-password' + pasteUrl)
        } else {
          u = new URL(window.location.origin + '/' + pasteUrl.replace(/^\/+/, ''))
        }
      }

      const params = new URLSearchParams(u.search.replace(/^\?/, ''))
      const token = params.get('token')
      if (token && (u.pathname.includes('/verify') || u.href.includes('/auth/v1/verify'))) {
        setMessage('Abriendo enlace de verificación en nueva pestaña... Completá el flujo ahí.')
        try {
          window.open(u.href, '_blank')
        } catch (err) {
          window.location.href = u.href
        }
        return
      }

      const ok = await trySetSessionFromParams(u.hash || '', u.search || '')
      if (!ok) setMessage((m) => m || 'No se pudo establecer sesión desde el enlace pegado')
    } catch (err) {
      console.debug('Error parseando enlace pegado', err)
      setMessage('No se pudo parsear el enlace pegado. Pegá la URL completa.')
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setMessage('')
    if (!password) return setMessage('Ingresá una contraseña')
    if (password !== confirm) return setMessage('Las contraseñas no coinciden')
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (error) return setMessage(error.message || 'Error actualizando contraseña')
      try {
        await supabase.auth.signOut()
      } catch (_e) {}
      setMessage('Contraseña actualizada. Volviendo al login...')
      router.replace('/admin/login')
    } catch (err) {
      setLoading(false)
      setMessage('Error durante la actualización')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: 460, width: '100%' }}>
        <h3 style={{ marginTop: 0 }}>Restablecer contraseña</h3>
        <p className="muted">{message}</p>

        {ready ? (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Nueva contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Procesando...' : 'Actualizar contraseña'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => { try { supabase.auth.signOut() } catch (_) { } ; router.replace('/admin/login') }}>Volver al login</button>
            </div>
          </form>
        ) : (
          <div>
            <p className="muted">Si tu enlace de recuperación no funciona, podés pegar aquí el enlace completo que recibiste por email (o el enlace de verificación de Supabase).</p>

            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Pegar enlace desde el email:</label>
            <input placeholder="Pega aquí el enlace completo desde el email" value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary" type="button" onClick={handleUsePasted}>Usar enlace pegado / abrir verify</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setPasteUrl(''); setMessage('') }}>Limpiar</button>
              <button className="btn btn-ghost" type="button" onClick={() => router.replace('/admin/login')}>Volver al login</button>
              <button className="btn btn-outline" type="button" onClick={async () => {
                setMessage('Intentando usar tokens desde la URL actual...')
                if (typeof window !== 'undefined'){
                  const ok = await trySetSessionFromParams(window.location.hash || '', window.location.search || '')
                  if (!ok) setMessage('No se pudo establecer la sesión desde la URL actual. Verificá Redirect URLs en Supabase o pegá el enlace de verificación.')
                }
              }}>Reintentar</button>
            </div>
                  <div style={{marginTop:12}}>
                    <label style={{fontSize:13,display:'block',marginBottom:6}}>O pega el token manualmente (dev):</label>
                    <input placeholder="access_token" value={manualAccess} onChange={(e)=>setManualAccess(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ccc',marginBottom:6}} />
                    <input placeholder="refresh_token (opcional)" value={manualRefresh} onChange={(e)=>setManualRefresh(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ccc'}} />
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button className="btn btn-primary" type="button" onClick={async ()=>{
                        if (!manualAccess) return setMessage('Pegá el access_token primero')
                        setMessage('Intentando establecer sesión con token manual...')
                        try {
                          const res = await supabase.auth.setSession({ access_token: manualAccess, refresh_token: manualRefresh || undefined })
                          console.debug('manual setSession', res)
                          if (res?.error) {
                            setSessionError(res.error?.message || JSON.stringify(res.error))
                            setMessage('No se pudo establecer la sesión: ' + (res.error?.message || 'error desconocido'))
                          }
                          if (res?.data?.session) {
                            setReady(true)
                            setMessage('Sesión establecida manualmente. Podés ingresar una nueva contraseña.')
                          }
                        } catch (err) {
                          console.debug('manual setSession threw', err)
                          setSessionError(String(err))
                          setMessage('Error tratando de fijar sesión manualmente')
                        }
                      }}>Usar token manual</button>
                      <button className="btn btn-ghost" type="button" onClick={()=>{ setManualAccess(''); setManualRefresh(''); setMessage('') }}>Limpiar tokens</button>
                    </div>
                  </div>
          </div>
        )}

        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && debugInfo && (
          <div style={{ background: '#0b1220', color: '#cbd5e1', padding: 10, borderRadius: 6, marginTop: 12, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Debug (local only)</div>
            <div><strong>hash:</strong> <span style={{ wordBreak: 'break-all' }}>{debugInfo.hash || '(vacío)'}</span></div>
            <div><strong>search:</strong> <span style={{ wordBreak: 'break-all' }}>{debugInfo.search || '(vacío)'}</span></div>
            <div><strong>type:</strong> {debugInfo.type || '(n/a)'}</div>
            <div><strong>access_token_present:</strong> {String(!!debugInfo.access_token_present)}</div>
            <div><strong>access_token_masked:</strong> {debugInfo.access_token_masked || '(no disponible)'}</div>
            {sessionError && (
              <div style={{ marginTop: 8, padding: 8, background: '#2b2430', borderRadius: 6, color: '#ffd1d1' }}>
                <div style={{ fontWeight: 600 }}>setSession error:</div>
                <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{String(sessionError)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

