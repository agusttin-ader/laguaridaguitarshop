import Image from "next/image";
import Link from "next/link";
import { models } from "../data/models";

export default function ModelIndex() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-[#EDEDED] mb-6">Modelos</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <article
            key={m.slug}
            className="rounded-2xl overflow-hidden bg-[#0D0D0D] shadow-sm transition-shadow hover:shadow-lg"
          >
            <Link href={`/modelos/${encodeURIComponent(m.slug)}`} className="block">
              <div className="relative h-48 w-full">
                <Image
                  src={encodeURI(m.images && m.images[0] ? m.images[0] : "/images/homepage.jpeg")}
                  alt={m.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold text-[#EDEDED]">{m.title}</h2>
                <p className="mt-2 text-sm text-white/70 line-clamp-3">{m.description}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-[#EDEDED]">{m.price}</div>

                  <span className="inline-flex items-center gap-2 rounded-full bg-[#EDEDED] px-3 py-1 text-sm font-medium text-[#0D0D0D] transition-transform duration-150 group-hover:scale-105">
                    Ver detalles
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
