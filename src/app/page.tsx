import Link from 'next/link';
import {
  ChartBarIcon,
  TrophyIcon,
  GiftIcon,
  SparklesIcon,
  StarIcon,
  HeartIcon,
  RocketLaunchIcon,
  RectangleStackIcon,
  HandRaisedIcon,
  ShareIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  BoltIcon,
  CakeIcon,
  ArrowsRightLeftIcon,
  LockClosedIcon,
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

      {/* How It Works Section */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Getting started is super easy! Just three simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="absolute left-0 right-0 top-16 hidden h-1 bg-gradient-to-r from-kid-primary via-purple-500 to-kid-secondary md:block" />

            <div className="grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-purple-600 shadow-lg shadow-kid-primary/30">
                  <RectangleStackIcon className="h-14 w-14 text-white" />
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-kid-primary shadow-md">
                    1
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Pick Your Sets</h3>
                <p className="text-gray-600">
                  Browse through all Pokemon card sets and choose which ones you want to track.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-kid-secondary shadow-lg shadow-purple-500/30">
                  <HandRaisedIcon className="h-14 w-14 text-white" />
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-purple-500 shadow-md">
                    2
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Tap Cards You Own</h3>
                <p className="text-gray-600">
                  Just tap on any card to add it to your collection. Tap again to add more copies!
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-kid-secondary to-pink-500 shadow-lg shadow-kid-secondary/30">
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="h-10 w-10 text-white" />
                    <ShareIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-kid-secondary shadow-md">
                    3
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Earn Badges & Share</h3>
                <p className="text-gray-600">
                  Unlock cool badges as you collect, and share your wishlist with family for gifts!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 px-4 py-16 sm:px-8 sm:py-24">
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

      {/* Feature Highlights Section */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary/10 to-kid-secondary/10 px-4 py-2">
              <SparklesIcon className="h-5 w-5 text-kid-primary" />
              <span className="text-sm font-semibold text-gray-700">Powerful Features</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Built for <span className="text-kid-primary">Collectors</span> &{' '}
              <span className="text-kid-secondary">Families</span>
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              KidCollect is packed with features that make collecting fun and help families stay
              connected.
            </p>
          </div>

          {/* Achievement System Highlight */}
          <div className="mb-16 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1">
                <TrophyIcon className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Achievement System</span>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Earn Badges & Celebrate Milestones
              </h3>
              <p className="mb-6 text-gray-600">
                Collecting is more fun when you have goals! Our achievement system rewards progress
                with colorful badges that kids love to show off.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckBadgeIcon className="mt-0.5 h-5 w-5 shrink-0 text-kid-success" />
                  <span className="text-gray-700">
                    <strong>Set Completion Badges</strong> — Unlock special badges when you complete
                    an entire set
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <BoltIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <span className="text-gray-700">
                    <strong>Milestone Rewards</strong> — Celebrate reaching 100, 500, or 1000+ cards
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StarIcon className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
                  <span className="text-gray-700">
                    <strong>Rare Card Badges</strong> — Special recognition for finding rare and
                    valuable cards
                  </span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-8">
                {/* Achievement preview cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                      <TrophyIcon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Set Master</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500">
                      <StarIcon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Card Hunter</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                      <BoltIcon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Speed Collector</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white/80 p-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-kid-primary to-purple-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-600">75%</span>
                  </div>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Next badge: 25 more cards!
                  </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 opacity-50" />
                <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-200 to-amber-200 opacity-50" />
              </div>
            </div>
          </div>

          {/* Family Sharing Highlight */}
          <div className="mb-16 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="relative rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
                {/* Family profile cards */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-purple-500">
                      <span className="text-lg font-bold text-white">E</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Emma&apos;s Collection</p>
                      <p className="text-sm text-gray-500">247 cards across 5 sets</p>
                    </div>
                    <ChartBarIcon className="h-5 w-5 text-kid-primary" />
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-kid-secondary to-pink-500">
                      <span className="text-lg font-bold text-white">L</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Liam&apos;s Collection</p>
                      <p className="text-sm text-gray-500">189 cards across 3 sets</p>
                    </div>
                    <ChartBarIcon className="h-5 w-5 text-kid-secondary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/80 p-3 backdrop-blur">
                  <ArrowsRightLeftIcon className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-600">
                    12 cards to trade between siblings!
                  </span>
                </div>
                {/* Decorative elements */}
                <div className="absolute -left-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 opacity-50" />
                <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 opacity-50" />
              </div>
            </div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1">
                <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Family Sharing</span>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Track Multiple Collections Together
              </h3>
              <p className="mb-6 text-gray-600">
                Perfect for families with multiple collectors! Parents can oversee all their
                children&apos;s collections from one account and help siblings avoid buying
                duplicates.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <UserGroupIcon className="mt-0.5 h-5 w-5 shrink-0 text-kid-primary" />
                  <span className="text-gray-700">
                    <strong>Multiple Profiles</strong> — Create separate collections for each child
                    in your family
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowsRightLeftIcon className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
                  <span className="text-gray-700">
                    <strong>Duplicate Finder</strong> — See which cards siblings can trade with each
                    other
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <LockClosedIcon className="mt-0.5 h-5 w-5 shrink-0 text-kid-secondary" />
                  <span className="text-gray-700">
                    <strong>Parent Dashboard</strong> — One place to view all collections and manage
                    settings
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Wishlist for Gifts Highlight */}
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1">
                <GiftIcon className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">Wishlist & Gifts</span>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Make Gift-Giving Easy
              </h3>
              <p className="mb-6 text-gray-600">
                No more duplicate gifts or guessing what cards they need! Kids can build wishlists
                and share them with grandparents, aunts, uncles, and friends.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <HeartIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                  <span className="text-gray-700">
                    <strong>Easy Wishlists</strong> — Tap the heart on any card to add it to your
                    wishlist
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StarIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <span className="text-gray-700">
                    <strong>Priority Stars</strong> — Mark your most-wanted cards so family knows
                    what you really want
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CakeIcon className="mt-0.5 h-5 w-5 shrink-0 text-kid-primary" />
                  <span className="text-gray-700">
                    <strong>Shareable Link</strong> — One link for birthdays, holidays, or anytime!
                  </span>
                </li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/sets"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <GiftIcon className="h-5 w-5" />
                  Start Your Wishlist
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 p-8">
                {/* Wishlist preview */}
                <div className="mb-4 flex items-center justify-between rounded-xl bg-white/80 p-3 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <HeartIcon className="h-5 w-5 text-rose-500" />
                    <span className="font-semibold text-gray-700">My Wishlist</span>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-sm font-medium text-rose-600">
                    8 cards
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg">
                    <div className="h-16 w-12 rounded-lg bg-gradient-to-br from-amber-200 to-yellow-300" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Charizard EX</p>
                      <p className="text-sm text-gray-500">Scarlet & Violet</p>
                    </div>
                    <div className="flex gap-0.5">
                      <StarIcon className="h-4 w-4 text-amber-400" />
                      <StarIcon className="h-4 w-4 text-amber-400" />
                      <StarIcon className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg">
                    <div className="h-16 w-12 rounded-lg bg-gradient-to-br from-blue-200 to-cyan-300" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Pikachu VMAX</p>
                      <p className="text-sm text-gray-500">Celebrations</p>
                    </div>
                    <div className="flex gap-0.5">
                      <StarIcon className="h-4 w-4 text-amber-400" />
                      <StarIcon className="h-4 w-4 text-gray-200" />
                      <StarIcon className="h-4 w-4 text-gray-200" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 p-3 text-white">
                  <ShareIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Share with Family</span>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 opacity-50" />
                <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-full bg-gradient-to-br from-pink-200 to-red-200 opacity-50" />
              </div>
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
