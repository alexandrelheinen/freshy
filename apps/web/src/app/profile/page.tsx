import { BottomNavBar, GlassCard } from '@freshy/ui';

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-32" data-page="profile">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-bold text-primary">Freshy</h1>
      </header>

      <main className="mt-20 px-margin-mobile">
        <section className="mb-8 flex flex-col items-center">
          <div className="mb-4 h-24 w-24 rounded-full bg-primary-container ring-4 ring-primary-container" />
          <h2 className="text-2xl font-semibold">My Profile</h2>
          <p className="text-on-surface-variant">@lucas_frescor</p>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/10 bg-primary-container/30 px-6 py-2">
            <span className="font-bold text-primary">1,250</span>
            <span className="text-sm font-bold uppercase">Relief Points</span>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <GlassCard className="flex flex-col items-center p-4">
            <span className="text-3xl font-bold text-primary">24</span>
            <span className="text-xs font-bold uppercase text-secondary">Reviews</span>
          </GlassCard>
          <GlassCard className="flex flex-col items-center p-4">
            <span className="text-3xl font-bold text-primary">12</span>
            <span className="text-xs font-bold uppercase text-secondary">Saved</span>
          </GlassCard>
        </div>

        <section>
          <h3 className="mb-4 text-lg font-semibold">Saved Places</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {['Central Library', 'Innovation Hub'].map((name) => (
              <GlassCard key={name} className="w-64 shrink-0 overflow-hidden">
                <div className="h-32 bg-primary-container/30" />
                <div className="p-4">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="text-sm text-on-surface-variant">Frigid</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </main>

      <BottomNavBar active="profile" />
    </div>
  );
}
