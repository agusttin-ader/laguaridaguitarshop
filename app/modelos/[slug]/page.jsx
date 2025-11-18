import { getModelBySlug, models } from "../../data/models";
import ProductPage from "../../components/ProductPage";

export default async function ModelRoute({ params }) {
  const { slug } = await params;
  const model = getModelBySlug(slug);

  if (!model) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Modelo no encontrado</h1>
        <p className="mt-4 text-sm text-white/70">El modelo que buscás no existe.</p>
        <div className="mt-6 text-sm text-white/60">
          <div>Slug solicitado: <strong>{slug}</strong></div>
          <div className="mt-3">Slugs disponibles:</div>
          <ul className="mt-2 list-disc list-inside text-sm text-white/60">
            {models.map((mm) => (
              <li key={mm.slug}>{mm.slug}</li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  // ProductPage is a client component that handles the interactive gallery
  return <ProductPage model={model} />;
}
