"use client"

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import HeroClient from './HeroClient'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HeroRender({ heroImage }) {
  // Server-side read of settings to avoid client flash of default image.
  return (
    <section
      className="relative w-full min-h-screen text-[#EDEDED]"
      aria-label="Hero guitarras"
    >
      {/* Background: single blurred image so the page stays performant and the hero is faded */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Image
          src={heroImage || '/images/homepage.jpeg'}
          alt=""
          fill
          sizes="100vw"
          className="object-cover filter blur-[40px] opacity-55 scale-105"
        />

        {/* Lightening at bottom so lower area appears clearer */}
        <div className="absolute left-0 right-0 bottom-0 h-1/3 bg-gradient-to-t from-white/8 to-transparent pointer-events-none" />
      </div>

      <div className="mx-auto grid max-w-7xl min-h-screen grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Left: copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start"
        >
          <motion.h1
            variants={item}
            className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          >
            Encontrá tu próximo sonido
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-4 max-w-xl text-base leading-7 text-[#cfcfcf] sm:text-lg drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
          >
            Descubrí guitarras seleccionadas para inspirarte todos los días: calidad
            premium, envío rápido y atención experta para que toques sin límites.
          </motion.p>
          <motion.div variants={item} className="mt-8">
            <Link
              href="/modelos"
              className="inline-flex items-center justify-center rounded-full bg-[#EDEDED] px-6 py-3 text-sm font-medium text-[#0D0D0D] transition-transform transition-colors duration-200 ease-out hover:scale-[1.02] hover:bg-[#D4AF37] hover:opacity-100 hover:shadow-lg hover:shadow-[#D4AF37]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            >
              Ver modelos
            </Link>
          </motion.div>
        </motion.div>

        {/* Right: visual placeholder for image */}
        <Link href="/destacado" aria-label="Ver producto destacado" className="group block">
          <motion.div
            variants={item}
            initial="hidden"
            animate="show"
            className="relative mx-auto w-full h-72 md:h-[560px] lg:h-[720px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transform-gpu transition-transform transition-shadow duration-500 ease-out cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-white/30 md:group-hover:scale-[1.02] md:group-hover:shadow-[0_30px_100px_-40px_rgba(0,0,0,0.75)] md:group-hover:ring-white/20 active:scale-[1.02] active:shadow-[0_30px_100px_-40px_rgba(0,0,0,0.75)] active:ring-white/20 will-change-transform"
          >
            <Image
              src={heroImage || '/images/homepage.jpeg'}
              alt="Guitarra eléctrica premium"
              fill
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <HeroClient />
            {/* Subtle white sheen */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_30%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_70%)]" />
            {/* Vignette for depth */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_10%,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_60%)]" />
            {/* Inner shadow */}
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]" />
          </motion.div>
        </Link>
      </div>
    </section>
  )
}
