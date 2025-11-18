export const metadata = {
  title: "Producto destacado | La Guarida Guitar Shop",
  description: "Descubrí el producto destacado de la semana.",
};

export default function DestacadoPage() {
  return (
    <main className="min-h-[80vh] bg-[#0D0D0D] text-[#EDEDED]">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Producto destacado
        </h1>
        <p className="mt-3 max-w-2xl text-[#cfcfcf]">
          Pronto vas a encontrar acá el instrumento que está marcando la
          diferencia. Especificaciones, fotos de alta calidad y opciones de
          compra, todo en un solo lugar.
        </p>

        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-[#cfcfcf]">
            Placeholder: conectaremos esta página a tu producto real cuando
            esté definido. Mientras tanto, podés volver a la home o explorar los
            modelos.
          </div>
          <div className="mt-6 flex gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#EDEDED] px-5 py-2.5 text-sm font-medium text-[#0D0D0D] hover:opacity-90"
            >
              Volver al inicio
            </a>
            <a
              href="/modelos"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-[#EDEDED] hover:bg-white/10"
            >
              Ver modelos
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
