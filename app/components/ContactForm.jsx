"use client"

import { useState } from 'react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Consulta general')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setStatus('')
    if (!name || !email || !message) return setStatus('Completá los campos requeridos')
    setLoading(true)
    try {
      // Send to a simple API route. For now the API returns ok without persistence.
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, subject, message }) })
      if (!res.ok) throw new Error(await res.text().catch(()=> 'Error'))
      setStatus('Mensaje enviado. Te contactamos en 24-48hs hábiles.')
      setName(''); setEmail(''); setSubject('Consulta general'); setMessage('')
    } catch (err) {
      console.error(err)
      setStatus('Error enviando el mensaje. Intentá nuevamente.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="sr-only">Tu nombre</label>
          <input id="contact-name" name="name" className="form-input" placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">Email</label>
          <input id="contact-email" name="email" className="form-input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="sr-only">Asunto</label>
        <select id="contact-subject" name="subject" className="form-input" value={subject} onChange={e=>setSubject(e.target.value)}>
          <option>Consulta general</option>
          <option>Soporte / garantía</option>
          <option>Envios</option>
          <option>Venta / cotización</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="sr-only">Mensaje</label>
        <textarea id="contact-message" name="message" className="form-input" placeholder="Tu mensaje" rows={6} value={message} onChange={e=>setMessage(e.target.value)} required />
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="rounded-md bg-gradient-to-b from-[#E0C36A] to-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0D0D0D] shadow-lg" disabled={loading}>{loading ? 'Enviando...' : 'Enviar mensaje'}</button>
        {status ? <div className="text-sm text-white/70">{status}</div> : null}
      </div>
    </form>
  )
}
