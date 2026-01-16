import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-8">
      <div className="text-center">
        {/* Logo placeholder */}
        <div className="mb-8 text-6xl">🎴</div>

        <h1 className="mb-4 bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-5xl font-bold text-transparent">
          KidCollect
        </h1>

        <p className="mb-8 text-xl text-gray-600">
          The family-friendly Pokemon card collection tracker
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/sets"
            className="touch-target rounded-full bg-kid-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-kid-primary/90 hover:shadow-xl"
          >
            Start Collecting
          </Link>

          <Link
            href="/collection"
            className="touch-target rounded-full border-2 border-kid-secondary bg-white px-8 py-4 text-lg font-semibold text-kid-secondary shadow-lg transition hover:bg-kid-secondary/10 hover:shadow-xl"
          >
            My Collection
          </Link>

          <Link
            href="/search"
            className="touch-target rounded-full border-2 border-kid-primary bg-white px-8 py-4 text-lg font-semibold text-kid-primary shadow-lg transition hover:bg-kid-primary/10 hover:shadow-xl"
          >
            Search Cards
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid gap-8 text-left sm:grid-cols-3">
          <div className="rounded-2xl bg-white/50 p-6 shadow-sm">
            <div className="mb-3 text-3xl">📊</div>
            <h3 className="mb-2 font-semibold text-gray-900">Track Your Cards</h3>
            <p className="text-sm text-gray-600">
              See all your cards in one place. Know exactly what you have!
            </p>
          </div>

          <div className="rounded-2xl bg-white/50 p-6 shadow-sm">
            <div className="mb-3 text-3xl">🏆</div>
            <h3 className="mb-2 font-semibold text-gray-900">Earn Badges</h3>
            <p className="text-sm text-gray-600">
              Complete sets, hit milestones, and show off your achievements!
            </p>
          </div>

          <div className="rounded-2xl bg-white/50 p-6 shadow-sm">
            <div className="mb-3 text-3xl">🎁</div>
            <h3 className="mb-2 font-semibold text-gray-900">Wishlist</h3>
            <p className="text-sm text-gray-600">
              Share your wishlist with family so they know what to get you!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
