import ContactForm from '../components/ContactForm'
import Link from 'next/link'

export const metadata = {
  title: 'Sobre Nosotros — La Guarida Guitarshop',
  description: 'La historia de La Guarida: cómo nació, nuestro enfoque y compromiso con la música.'
}

export default function AboutPage() {
  return (
    <main className="about-page mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#EDEDED]">La Guarida</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-white/70">Una tienda, una historia — dedicada a las guitarras, a las búsquedas sonoras y a quienes las tocan.</p>
      </header>

      <section className="prose prose-invert mx-auto lg:max-w-none lg:grid lg:grid-cols-12 lg:gap-12">

        <div className="lg:col-span-7 bg-gradient-to-b from-[#0b0b0b] to-[#060606] rounded-2xl p-10 shadow-lg">
          <h2 className="text-2xl font-semibold text-[#EDEDED]">Hecho por un músico, para músicos</h2>
          <p className="mt-4 text-white/80">La Guarida nació en el corazón de una ciudad que parecía detenerse durante la pandemia. Lo que comenzó como un pequeño proyecto de reparación y venta —mi proyecto personal— se convirtió, paso a paso, en un lugar donde las guitarras encuentran dueño y las voces encuentran su refugio.</p>

          <p className="mt-4 text-white/80">Durante aquellos meses inciertos, transformé un local y un sueño en un taller donde cada instrumento recibía atención personalizada: ajuste de mástiles, puentes recién calibrados y, sobre todo, cuidado humano. La gente vino con historias; me contaban canciones que necesitaban salir. Así, de a poco, La Guarida dejó de ser sólo un negocio y pasó a ser un refugio para la música.</p>

          <p className="mt-4 text-white/80">Hoy mantengo esa filosofía: trabajo con honestidad, priorizo el trato cercano y creo que una buena guitarra no sólo suena mejor, sino que tiene una historia que vale la pena cuidar. Desde instrumentos vintage hasta modelos modernos, ofrezco asesoramiento, restauración y un espacio para probar y encontrar lo que realmente te inspira.</p>

          <p className="mt-4 text-white/80">Mi compromiso es simple: calidad, transparencia y pasión por la música. Si tenés dudas, querés llevar tu instrumento para una puesta a punto, o simplemente pasar a saludar, mi puerta está abierta.</p>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-[#EDEDED]">Contacto rápido</h3>
            <p className="mt-2 text-sm text-white/70">Teléfono: <a href="tel:+541168696491" className="text-[#EDEDED]">+54 11 6869 6491</a> · Email: <a href="mailto:info@laguaridaguitarshop.com" className="text-[#EDEDED]">info@laguaridaguitarshop.com</a></p>
            <p className="mt-2 text-sm text-white/70">WhatsApp: <a href="https://wa.me/541168696491" target="_blank" rel="noreferrer" className="text-[#D4AF37]">Iniciar chat</a></p>
          </div>
        </div>

        <aside className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="rounded-2xl bg-[#0b0b0b] p-8 shadow-lg">
            <h4 className="text-xl font-semibold text-[#EDEDED]">Nuestro espacio</h4>
            <p className="mt-3 text-white/70">Un taller y una sala de escucha: probá guitarras con calma, consultá ajustes y descubrí modelos únicos traídos por nuestro equipo.</p>

            <div className="mt-6">
              <h5 className="text-sm font-medium text-white/80">Visítanos</h5>
              <address className="not-italic mt-2 text-sm text-white/70">Av. Principal 1234, Local 5<br/>Ciudad, Provincia</address>
            </div>

            <div className="mt-6">
              <h5 className="text-sm font-medium text-white/80">Horarios</h5>
              <ul className="mt-2 text-sm text-white/70">
                <li>Lunes a Viernes: 10:00 — 19:00</li>
                <li>Sábado: 10:00 — 17:00</li>
                <li>Domingo: Cerrado</li>
              </ul>
            </div>

            <div className="mt-6">
              <h5 className="text-sm font-medium text-white/80">Síguenos</h5>
              <div className="mt-2 flex gap-4">
                <a href="https://www.instagram.com/laguaridainstrumentos/" target="_blank" rel="noreferrer" className="text-[#D4AF37]">Instagram</a>
                <a href="https://wa.me/541168696491" target="_blank" rel="noreferrer" className="text-[#D4AF37]">WhatsApp</a>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
