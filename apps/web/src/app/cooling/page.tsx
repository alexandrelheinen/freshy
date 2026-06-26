import { BottomNavBar, GlassCard } from '@freshy/ui';

const categories = [
  { name: 'Cafés & Padarias', count: 24 },
  { name: 'Restaurantes', count: 42 },
  { name: 'Bibliotecas', count: 8 },
  { name: 'Shoppings', count: 15 },
  { name: 'Museus', count: 12 },
  { name: 'Coworking', count: 31 },
];

export default function CoolingPage() {
  return (
    <div className="min-h-screen pb-32" data-page="cooling">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-bold text-primary">Freshy</h1>
      </header>

      <main className="mx-auto max-w-4xl px-margin-mobile pt-24">
        <section className="mb-8 rounded-xl bg-gradient-to-br from-primary-container/20 to-secondary-container/20 p-6">
          <h2 className="text-2xl font-semibold">Categorias</h2>
          <p className="mt-2 text-on-surface-variant">
            Encontre o refúgio perfeito contra o calor.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <GlassCard key={cat.name} className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/30 text-2xl">
                ❄
              </div>
              <span className="font-semibold">{cat.name}</span>
              <span className="mt-2 text-xs font-bold uppercase text-secondary">
                {cat.count} locais
              </span>
            </GlassCard>
          ))}
        </div>

        <section className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">Destaque de Hoje</h3>
          <GlassCard className="h-48 overflow-hidden">
            <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black/50 to-primary-container/30 p-4">
              <span className="text-xs font-bold uppercase text-white/90">
                Mais popular em bibliotecas
              </span>
              <h4 className="text-xl font-semibold text-white">Biblioteca Central</h4>
            </div>
          </GlassCard>
        </section>
      </main>

      <BottomNavBar active="cooling" />
    </div>
  );
}
