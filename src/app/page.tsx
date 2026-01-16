import Link from 'next/link';
import {
  ChartBarIcon,
  TrophyIcon,
  GiftIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';

// Decorative floating card component
function FloatingCard({ className, delay = '0s' }: { className?: string; delay?: string }) {
  return (
    <div
      className={`absolute rounded-xl bg-gradient-to-br from-white to-gray-100 shadow-lg ${className}`}
      style={{
        animation: `float 3s ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <SparklesIcon className="h-6 w-6 text-pokemon-yellow" />
      </div>
    </div>
  );
}

// Decorative star component
function FloatingStar({
  className,
  delay = '0s',
  color = 'text-pokemon-yellow',
}: {
  className?: string;
  delay?: string;
  color?: string;
}) {
  return (
    <StarIcon
      className={`absolute h-6 w-6 ${color} ${className}`}
      style={{
        animation: `twinkle 2s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        {/* Decorative elements */}
        <FloatingCard className="left-[5%] top-[15%] h-16 w-12 -rotate-12 opacity-60" delay="0s" />
        <FloatingCard
          className="right-[8%] top-[20%] h-14 w-10 rotate-12 opacity-50"
          delay="0.5s"
        />
        <FloatingCard
          className="bottom-[20%] left-[10%] hidden h-12 w-9 rotate-6 opacity-40 sm:block"
          delay="1s"
        />
        <FloatingStar className="left-[15%] top-[30%]" delay="0.2s" />
        <FloatingStar className="right-[15%] top-[25%]" delay="0.7s" color="text-kid-secondary" />
        <FloatingStar
          className="bottom-[30%] right-[20%] hidden sm:block"
          delay="1.2s"
          color="text-kid-primary"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <SparklesIcon className="h-5 w-5 text-pokemon-yellow" />
            <span className="text-sm font-medium text-gray-700">Made for young collectors</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Track Your{' '}
            <span className="bg-gradient-to-r from-kid-primary via-purple-500 to-kid-secondary bg-clip-text text-transparent">
              Pokemon Cards
            </span>
            <br />
            Like a Pro!
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 sm:text-xl">
            The fun and easy way for kids to organize their collection, earn badges, and share
            wishlists with family!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sets"
              className="touch-target group flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-kid-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-kid-primary/40"
            >
              <RocketLaunchIcon className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
              Start Collecting Free
            </Link>
            <Link
              href="/collection"
              className="touch-target rounded-full border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-sm transition-all hover:border-kid-primary hover:text-kid-primary hover:shadow-md"
            >
              View My Collection
            </Link>
          </div>

          {/* Social proof mini */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4 text-red-400" />
              <span>Kid-safe & family friendly</span>
            </div>
            <div className="flex items-center gap-1">
              <TrophyIcon className="h-4 w-4 text-amber-400" />
              <span>Fun badges to earn</span>
            </div>
            <div className="flex items-center gap-1">
              <GiftIcon className="h-4 w-4 text-kid-secondary" />
              <span>Easy wishlists for gifts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything You Need to Be a <span className="text-kid-primary">Super Collector</span>
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              KidCollect makes tracking your Pokemon cards fun and easy.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 inline-flex rounded-2xl bg-kid-primary/10 p-3">
                <ChartBarIcon className="h-8 w-8 text-kid-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Track Every Card</h3>
              <p className="text-gray-600">
                Add cards with a single tap. See your progress on every set. Know exactly what you
                have and what you need!
              </p>
              <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-kid-primary/5 transition-all group-hover:scale-150" />
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 inline-flex rounded-2xl bg-amber-500/10 p-3">
                <TrophyIcon className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Earn Cool Badges</h3>
              <p className="text-gray-600">
                Complete sets, reach milestones, and collect badges. Show off your achievements to
                friends and family!
              </p>
              <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-amber-500/5 transition-all group-hover:scale-150" />
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 inline-flex rounded-2xl bg-kid-secondary/10 p-3">
                <GiftIcon className="h-8 w-8 text-kid-secondary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Share Wishlists</h3>
              <p className="text-gray-600">
                Mark cards you want and share your wishlist link with family. Perfect for birthdays
                and holidays!
              </p>
              <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-kid-secondary/5 transition-all group-hover:scale-150" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="bg-gradient-to-r from-kid-primary to-purple-600 px-4 py-12 sm:px-8">
        <div className="mx-auto grid max-w-4xl gap-8 text-center text-white sm:grid-cols-3">
          <div>
            <div className="mb-2 text-4xl font-bold">500+</div>
            <div className="text-indigo-200">Pokemon Sets</div>
          </div>
          <div>
            <div className="mb-2 text-4xl font-bold">20,000+</div>
            <div className="text-indigo-200">Cards to Collect</div>
          </div>
          <div>
            <div className="mb-2 text-4xl font-bold">100%</div>
            <div className="text-indigo-200">Free to Use</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full bg-kid-success/10 px-4 py-2">
            <span className="text-sm font-medium text-kid-success">Ready to start?</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">
            Start Your Collection Today!
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Join other young collectors and take control of your Pokemon card collection. It&apos;s
            free, fun, and family-friendly!
          </p>
          <Link
            href="/sets"
            className="touch-target inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-10 py-4 text-lg font-bold text-white shadow-lg shadow-kid-primary/30 transition-all hover:scale-105 hover:shadow-xl"
          >
            <SparklesIcon className="h-5 w-5" />
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-8 text-center text-sm text-gray-400">
        <p>KidCollect is not affiliated with The Pokemon Company or Nintendo.</p>
        <p className="mt-2">Made with love for young collectors everywhere.</p>
      </footer>
    </main>
  );
}
