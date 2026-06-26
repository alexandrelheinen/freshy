import { BottomNavBar, GlassCard, AcStrengthBar } from '@freshy/ui';

export default function ExplorePage() {
  return (
    <div className="relative min-h-screen pb-32" data-page="explore">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-primary" aria-hidden>
            ❄
          </span>
          <h1 className="text-2xl font-bold text-primary">Freshy</h1>
        </div>
      </header>

      <main className="relative h-screen w-full overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-container via-surface to-primary-container/30" />
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="h-8 w-8 rounded-full border-4 border-white bg-primary shadow-lg" />
        </div>

        <div className="absolute left-0 top-20 z-20 w-full px-margin-mobile">
          <div className="glass flex items-center rounded-xl border border-white/50 px-4 py-3 shadow-md">
            <span className="text-outline">🔍</span>
            <input
              className="ml-2 w-full border-none bg-transparent text-base focus:ring-0"
              placeholder="Find a cool spot..."
              readOnly
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto py-1">
            {['Cafes', 'Restaurants', 'Public Spaces', 'Malls'].map((c, i) => (
              <span
                key={c}
                className={`shrink-0 rounded-full px-4 py-1 text-sm font-semibold ${
                  i === 0 ? 'bg-primary text-white' : 'glass text-secondary'
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-28 left-0 z-20 w-full px-margin-mobile">
          <GlassCard className="flex items-center gap-4 p-4">
            <div className="h-24 w-24 shrink-0 rounded-xl bg-primary-container/40" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Arctic Brew Coffee</h2>
              <p className="text-sm text-secondary">250m • 4 mins walk</p>
              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase text-primary">
                  Frigid Strength
                </span>
                <AcStrengthBar level={3} />
              </div>
            </div>
            <div className="rounded-lg bg-primary-fixed px-2 py-1 text-lg font-bold text-on-primary-fixed">
              19°C
            </div>
          </GlassCard>
        </div>
      </main>

      <BottomNavBar active="explore" />
    </div>
  );
}
