export const models = [
  {
    slug: "fender-american-vintage-57-2024",
    title: "Fender American Vintage ll 57’ 2024",
    teaser: "Una Stratocaster clásica, reconstruida con especificaciones históricas y un feel impecable. Resonante, liviana y con la dinámica típica del ´57, pero con la estabilidad de una AVRI moderna.",
    price: "U$S 2,700",
    description:
      "Damos paso a un ingreso particular, esta bellísima Fender Strat avri ll 57’ en un hermoso color Vintage Blonde. Esta guitarra cuenta con un cuerpo de Ash en acabado Nitro Lacquer Gloss, un mástil de Arce con un fino Soft V Shape, trastera de Arce con 21 trastes Vintage Tall, Pickups Pure Vintage 57’ X3 junto a un clásico control de volumen y dos de tono sumado a su selector de 5 posiciones, puente tremolo Vintage y clavijas estilo Kluson. La guitarra modelo 2024, estado mint con Candy case completo.",
    images: [
      "/images/homepage.jpeg",
      "/images/strat-american-1.jpeg",
      "/images/strat-american-2.jpeg",
      "/images/strat-american-3.jpeg",
      "/images/strat-american-4.jpeg",
    ],
  },
  {
    slug: "gibson-lpj-2014",
    title: "Gibson LPJ 2014",
    teaser: "Una Les Paul liviana, directa y rockera, con construccion clásica y electrónica Gibson 490. Muy comoda, resonante y lista para cualquier estilo que necesite ataque y medios presentes.",
    price: "U$S 1,500",
    description:
      "De la camada del 120 aniversario llega esta LP con un cuerpo sólido de Caoba y una tapa de Arce tallado en un acabado nitro satin en un bello color Worn Brown. Su mástil se compone de Caoba con un perfil Rounded 50’, trastera de Rosewood, 22 trastes médium jumbo en perfecto estado. Su electrónica se compone de 2 pickups, 490 R en Neck y 490 T en Bridge, clásico selector de 3 posiciones y potenciometros independientes de volumen y tono. Su hardware cuenta con un puente Tune-O-Matic y clavijas vintage estilo Kluson. La guitarra del año 2014 se encuentra en perfecto estado.",
    images: [
      "/images/gibson-lpj-1.jpeg",
      "/images/gibson-lpj-2.jpeg",
      "/images/gibson-lpj-3.jpeg",
      "/images/gibson-lpj-4.jpeg",
      "/images/gibson-lpj-5.jpeg",
      "/images/gibson-lpj-6.jpeg",
    ],
  },
  {
    slug: "gibson-les-paul-classic-2023",
    title: "Gibson Les Paul Classic 2023’",
    teaser: "Una Les Paul moderna y versátil con estética clásica. Edición exclusiva de Sweetwater, tapa flameada impresionante y electrónica avanzada con coil split y cambio de fase.",
    price: "U$S 3,200",
    description:
      "Damos paso a esta LP bellísima, en este caso hablamos de una edición limitada y exclusiva. Esta Les Paul Classic cuenta con un cuerpo de Caoba macizo junto a una tapa de Arce veteado en acabado nitro en un color exclusivo para este modelo denominado Smokehouse Burst. Su mástil cuenta con un perfil 60’ SlimTaper bien definido junto a una trastera de Rosewood, clásico radio de 12’ con 22 trastes Médium Jumbo. Su electrónica se destaca con dos Pickups Burstbuckers 60’, selectora clásica de 3 posiciones junto a sus potes de volumen y tono independientes, brindando una gama de sonidos variados y versatilidad. La guitarra modelo 2023 se encuentra en perfecto estado, con estuche TKL Gibson y accesorios.",
    images: [
      "/images/gibson-les-paul-23-1.jpeg",
      "/images/gibson-les-paul-23-2.jpeg",
      "/images/gibson-les-paul-23-3.jpeg",
      "/images/gibson-les-paul-23-4.jpeg",
      "/images/gibson-les-paul-23-5.jpeg",
    ],
  },
];

export function getModelBySlug(slug) {
  return models.find((m) => m.slug === slug);
}
