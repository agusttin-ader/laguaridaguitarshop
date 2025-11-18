"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function ProductPage({ model }) {
  const [selected, setSelected] = useState(0);
  function handleSelect(i) {
    setSelected(i);
  }

  function prevThumb() {
    const next = (selected - 1 + model.images.length) % model.images.length;
    handleSelect(next);
  }

  function nextThumb() {
    const next = (selected + 1) % model.images.length;
    handleSelect(next);
  }

  if (!model) return null;

  const phone = "541168696491"; // +54 11 68696491 formatted for wa.me
  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    `Hola me interesa esta guitarra: ${model.title}`
  )}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: gallery */}
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 min-h-[420px] md:min-h-[560px] lg:min-h-[720px] overflow-hidden rounded-lg shadow-lg bg-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={encodeURI(model.images[selected] || "/images/homepage.jpeg")}
                  alt={`${model.title} imagen principal`}
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain object-center bg-black"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Prev/Next buttons over main image for mobile */}
            <button
              onClick={prevThumb}
              aria-label="Anterior imagen"
              className="absolute left-3 top-1/2 z-20 h-10 w-10 md:h-12 md:w-12 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/8 text-white/90 transition-all duration-200 opacity-90 hover:scale-105 hover:bg-[#D4AF37] hover:text-[#0D0D0D]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={nextThumb}
              aria-label="Siguiente imagen"
              className="absolute right-3 top-1/2 z-20 h-10 w-10 md:h-12 md:w-12 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/8 text-white/90 transition-all duration-200 opacity-90 hover:scale-105 hover:bg-[#D4AF37] hover:text-[#0D0D0D]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Thumbnails removed per request (desktop and mobile) */}
        </div>

        {/* Right: details */}
        <div className="flex flex-col justify-start">
          <h1 className="text-3xl font-semibold text-[#EDEDED]">{model.title}</h1>
          <p className="mt-4 text-lg text-white/70">{model.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-2xl font-semibold text-[#EDEDED]">{model.price}</span>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-max items-center justify-center gap-2 rounded-full bg-[#EDEDED] px-6 py-3 text-sm font-medium text-[#0D0D0D] shadow-sm transition-transform transition-colors duration-200 ease-out hover:scale-[1.02] hover:bg-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
          >
            Me interesa
          </a>
        </div>
      </div>
    </div>
  );
}
