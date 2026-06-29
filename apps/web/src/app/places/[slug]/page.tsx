import { AcStrengthBar, GlassCard } from '@freshy/ui';

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="min-h-screen pb-10" data-page="place-detail">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center bg-surface/80 px-margin-mobile shadow-sm backdrop-blur-md">
        <h1 className="text-xl font-semibold text-primary">Place Details</h1>
      </header>

      <main className="pt-16">
        <section className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary-container">
          <div className="absolute bottom-6 left-margin-mobile">
            <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold uppercase">
              Open now
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white drop-shadow">Ice Coffee Central</h2>
            <p className="text-sm text-white/80">slug: {slug}</p>
          </div>
        </section>

        <section className="relative z-10 -mt-8 grid grid-cols-2 gap-4 px-margin-mobile">
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">Interior</span>
            <div className="text-4xl font-bold text-primary">
              19<span className="text-lg">°C</span>
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col items-center p-4 text-center">
            <span className="text-xs font-bold uppercase text-secondary">AC Strength</span>
            <div className="mt-2 w-full">
              <AcStrengthBar level={3} />
            </div>
            <span className="mt-1 text-sm font-semibold text-primary">Frigid</span>
          </GlassCard>
        </section>

        <section className="mt-6 px-margin-mobile">
          <div className="mb-4 flex flex-wrap gap-2">
            {['Free Wi-Fi', 'Quiet Zone', 'Comfy Seating'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-on-surface-variant">
            The perfect refuge from urban heat. Constant air conditioning and a quiet environment
            for work or relaxation.
          </p>
          <button
            type="button"
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-on-primary shadow-lg"
          >
            Get Directions
          </button>
        </section>

        <section className="mt-8 px-margin-mobile">
          <h3 className="mb-4 text-xl font-semibold">Climate Reviews</h3>
          <GlassCard className="p-4">
            <p className="italic text-on-surface-variant">
              &quot;The best place to work during the heat wave.&quot;
            </p>
            <p className="mt-2 text-sm text-outline">— Marco A., 2 days ago</p>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
