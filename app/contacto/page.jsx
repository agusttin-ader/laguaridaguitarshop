import ContactForm from '../components/ContactForm'
import Link from 'next/link'

export const metadata = {
  title: 'Contacto — La Guarida Guitarshop',
  description: 'Contactá con La Guarida — ventas, soporte, consultas y horarios.'
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-[#EDEDED]">Contacto</h1>
        <p className="mt-2 text-lg text-white/70">Estamos para ayudarte — preguntanos por productos, servicios y reparaciones.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-2xl bg-[#0b0b0b] p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-[#EDEDED]">Envíanos un mensaje</h2>
            <p className="mt-2 text-sm text-white/70">Completá el formulario y te responderemos lo antes posible (dentro de 24-48hs laborables).</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-[#0b0b0b] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#EDEDED]">Visítanos / Horarios</h3>
            <address className="not-italic mt-3 text-sm text-white/70">
              La Guarida Guitar Shop<br/>
              Av. Principal 1234, Local 5<br/>
              Ciudad, Provincia
            </address>
            <div className="mt-3 text-sm text-white/70">
              <div><strong>Teléfono:</strong> <a href="tel:+541168696491" className="text-[#EDEDED]">+54 11 6869 6491</a></div>
              <div className="mt-1"><strong>Email:</strong> <a href="mailto:info@laguaridaguitarshop.com" className="text-[#EDEDED]">info@laguaridaguitarshop.com</a></div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-white/80">Horarios</h4>
              <ul className="mt-2 text-sm text-white/70">
                <li>Lunes a Viernes: 10:00 — 19:00</li>
                <li>Sábado: 10:00 — 17:00</li>
                <li>Domingo: Cerrado</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0b0b0b] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#EDEDED]">Soporte Rápido</h3>
            <p className="mt-2 text-sm text-white/70">¿Consultas sobre envíos, garantías o devoluciones? Elegí una de las opciones rápidas:</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/admin/login" className="text-[#D4AF37]">Acceder al panel de administración</Link></li>
              <li><a href="https://wa.me/541168696491" className="text-[#D4AF37]" target="_blank" rel="noreferrer">Contactar por WhatsApp</a></li>
              <li><a href="mailto:info@laguaridaguitarshop.com" className="text-[#D4AF37]">Enviar email</a></li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#0b0b0b] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#EDEDED]">Síguenos</h3>
            <p className="mt-2 text-sm text-white/70">Nuestras redes sociales con novedades y lanzamientos.</p>
            <div className="mt-3 flex items-center gap-3">
              <a href="https://www.instagram.com/laguaridainstrumentos/" target="_blank" rel="noreferrer" className="text-[#D4AF37]">Instagram</a>
              <a href="https://wa.me/541168696491" target="_blank" rel="noreferrer" className="text-[#D4AF37]">WhatsApp</a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
