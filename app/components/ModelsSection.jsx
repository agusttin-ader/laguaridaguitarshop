"use client";

import Image from "next/image";
import Link from "next/link";
import { models } from "../data/models";

export default function ModelsSection() {
  function getTeaser(m) {
    if (m.teaser) return m.teaser;
    if (!m.description) return "Guitarra única, sonido impecable.";
    const firstSentence = m.description.split(".").find((s) => s && s.trim().length > 0);
    if (firstSentence && firstSentence.trim().length <= 140) return firstSentence.trim() + ".";
    const short = m.description.slice(0, 120).trim();
    return short.replace(/\s+\S*$/, "") + "...";
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-3xl font-semibold text-[#EDEDED]">Destacados</h2>

      <div className="flex flex-col gap-12">
        {models.map((m, idx) => {
          let reversed = idx % 2 === 1;
          // Force invert for the middle card (index 1) per user request
          if (idx === 1) reversed = !reversed;
          // Ensure Gibson LPJ 2014 has image on the right
          if (m.slug === "gibson-lpj-2014") reversed = true;
          return (
            <article
              key={m.slug}
              className={`group w-full rounded-2xl bg-[#0d0d0d] p-6 shadow-sm overflow-hidden flex flex-col items-stretch ${
                reversed ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              <div className="relative w-full md:w-1/2 h-64 md:h-[520px] lg:h-[640px] overflow-hidden rounded-lg">
                <Image
                  src={encodeURI(m.images && m.images[0] ? m.images[0] : "/images/homepage.jpeg")}
                  alt={m.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-center transition-transform duration-500 transform-gpu group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-center px-0 md:px-8 py-6">
                <h3 className="text-3xl font-semibold text-[#EDEDED]">{m.title}</h3>
                <p className="mt-4 text-lg font-medium text-white/90">{getTeaser(m)}</p>

                <div className="mt-6 flex items-center gap-4">
                  <a
                    href={`https://wa.me/541168696491?text=${encodeURIComponent(
                      `Hola me interesa esta guitarra: ${m.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-medium text-[#0D0D0D] shadow-sm transition-transform duration-150 hover:scale-105"
                  >
                    Me interesa
                  </a>

                  <Link
                    href={`/modelos/${encodeURIComponent(m.slug)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/90 transition-colors duration-150 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  >
                    Ver guitarra
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
