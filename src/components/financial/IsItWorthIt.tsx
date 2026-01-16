'use client';

import { useState, useMemo } from 'react';
import {
  ScaleIcon,
  XMarkIcon,
  ShoppingCartIcon,
  SparklesIcon,
  LightBulbIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface IsItWorthItProps {
  /** The price of the card being considered */
  cardPrice: number;
  /** Card name to display */
  cardName?: string;
  /** Callback when helper is closed */
  onClose?: () => void;
  /** Optional className for container */
  className?: string;
}

interface ComparisonItem {
  name: string;
  icon: React.ReactNode;
  priceRange: [number, number]; // [min, max]
  description: string;
  category: 'fun' | 'collect' | 'save';
}

// ============================================================================
// COMPARISON ITEMS
// ============================================================================

const COMPARISON_ITEMS: ComparisonItem[] = [
  // Fun experiences
  {
    name: 'Movie tickets',
    icon: <FilmIcon />,
    priceRange: [10, 15],
    description: 'See a movie with a friend',
    category: 'fun',
  },
  {
    name: 'Pizza party',
    icon: <PizzaIcon />,
    priceRange: [15, 25],
    description: 'Large pizza for the whole family',
    category: 'fun',
  },
  {
    name: 'Video game (used)',
    icon: <GamepadIcon />,
    priceRange: [15, 30],
    description: 'A pre-owned game to play',
    category: 'fun',
  },
  {
    name: 'New video game',
    icon: <GamepadIcon />,
    priceRange: [40, 70],
    description: 'Brand new game release',
    category: 'fun',
  },
  {
    name: 'Bowling trip',
    icon: <BowlingIcon />,
    priceRange: [20, 35],
    description: 'A few games with friends',
    category: 'fun',
  },
  {
    name: 'Mini golf',
    icon: <GolfIcon />,
    priceRange: [10, 20],
    description: 'A round of mini golf',
    category: 'fun',
  },
  // Collectibles
  {
    name: 'Booster pack',
    icon: <CardsIcon />,
    priceRange: [4, 6],
    description: 'Try your luck with new cards',
    category: 'collect',
  },
  {
    name: 'Booster box',
    icon: <BoxIcon />,
    priceRange: [100, 150],
    description: '36 packs to open',
    category: 'collect',
  },
  {
    name: 'Elite Trainer Box',
    icon: <BoxIcon />,
    priceRange: [40, 50],
    description: '9 packs plus accessories',
    category: 'collect',
  },
  {
    name: 'Card sleeves (100)',
    icon: <ShieldIcon />,
    priceRange: [8, 15],
    description: 'Protect your collection',
    category: 'collect',
  },
  {
    name: 'Binder pages',
    icon: <BinderIcon />,
    priceRange: [10, 20],
    description: 'Display your cards nicely',
    category: 'collect',
  },
  // Savings
  {
    name: 'Piggy bank deposit',
    icon: <PiggyIcon />,
    priceRange: [1, 1000],
    description: 'Save for something bigger',
    category: 'save',
  },
];

// ============================================================================
// SIMPLE SVG ICONS
// ============================================================================

function FilmIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
    </svg>
  );
}

function PizzaIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 22h20L12 2z" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
      <circle cx="14" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GamepadIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  );
}

function BowlingIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="10" cy="9" r="1.5" fill="currentColor" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GolfIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M12 3v14m0-14l6 4-6 4" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="4" width="10" height="14" rx="1" />
      <rect x="8" y="6" width="10" height="14" rx="1" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function BinderIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function PiggyIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

// ============================================================================
// COMPARISON CARD COMPONENT
// ============================================================================

function ComparisonCard({
  item,
  quantity,
  cardPrice,
}: {
  item: ComparisonItem;
  quantity: number;
  cardPrice: number;
}) {
  const avgPrice = (item.priceRange[0] + item.priceRange[1]) / 2;
  const isMultiple = quantity > 1;

  const categoryColors = {
    fun: 'from-purple-100 to-violet-100 border-purple-200',
    collect: 'from-blue-100 to-cyan-100 border-blue-200',
    save: 'from-green-100 to-emerald-100 border-green-200',
  };

  const iconColors = {
    fun: 'text-purple-600',
    collect: 'text-blue-600',
    save: 'text-green-600',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-gradient-to-br p-3 transition hover:shadow-md',
        categoryColors[item.category]
      )}
    >
      <div className={cn('flex-shrink-0', iconColors[item.category])}>
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-800">
          {isMultiple ? `${quantity}x ` : ''}
          {item.name}
        </p>
        <p className="text-xs text-gray-500">{item.description}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-700">
          ~${(avgPrice * quantity).toFixed(0)}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IsItWorthIt({
  cardPrice,
  cardName = 'this card',
  onClose,
  className,
}: IsItWorthItProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'fun' | 'collect' | 'save'>('all');

  // Find comparisons that fit within the card price
  const comparisons = useMemo(() => {
    return COMPARISON_ITEMS.map((item) => {
      const avgPrice = (item.priceRange[0] + item.priceRange[1]) / 2;
      const quantity = Math.floor(cardPrice / avgPrice);
      return { item, quantity, fits: quantity >= 1 };
    })
      .filter((c) => c.fits)
      .filter((c) => activeCategory === 'all' || c.item.category === activeCategory)
      .sort((a, b) => {
        // Sort by how close the total is to the card price
        const aTotalDiff = Math.abs(
          cardPrice - ((a.item.priceRange[0] + a.item.priceRange[1]) / 2) * a.quantity
        );
        const bTotalDiff = Math.abs(
          cardPrice - ((b.item.priceRange[0] + b.item.priceRange[1]) / 2) * b.quantity
        );
        return aTotalDiff - bTotalDiff;
      })
      .slice(0, 6);
  }, [cardPrice, activeCategory]);

  // Calculate some fun stats
  const boosterPacks = Math.floor(cardPrice / 5);
  const movieTickets = Math.floor(cardPrice / 12);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 shadow-lg',
        className
      )}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition hover:bg-white/50 hover:text-gray-600"
          aria-label="Close comparison helper"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <ScaleIcon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Is It Worth It?</h3>
        <p className="text-sm text-gray-500">
          What else could ${cardPrice.toFixed(2)} buy?
        </p>
      </div>

      {/* Card price display */}
      <div className="mb-6 rounded-xl bg-white/70 p-4 text-center shadow-sm">
        <p className="text-sm text-gray-500">{cardName}</p>
        <p className="text-3xl font-bold text-amber-600">${cardPrice.toFixed(2)}</p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-blue-500">
            <CardsIcon />
          </div>
          <p className="text-xl font-bold text-gray-800">{boosterPacks}</p>
          <p className="text-xs text-gray-500">booster packs</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 text-purple-500">
            <FilmIcon />
          </div>
          <p className="text-xl font-bold text-gray-800">{movieTickets}</p>
          <p className="text-xs text-gray-500">movie tickets</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'fun', 'collect', 'save'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              activeCategory === cat
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/70 text-gray-600 hover:bg-white'
            )}
          >
            {cat === 'all' ? 'All' : cat === 'fun' ? 'Fun' : cat === 'collect' ? 'Collect' : 'Save'}
          </button>
        ))}
      </div>

      {/* Comparison list */}
      <div className="space-y-2">
        {comparisons.length > 0 ? (
          comparisons.map(({ item, quantity }) => (
            <ComparisonCard
              key={item.name}
              item={item}
              quantity={quantity}
              cardPrice={cardPrice}
            />
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">No comparisons in this category</p>
          </div>
        )}
      </div>

      {/* Thinking prompt */}
      <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 p-4">
        <div className="flex items-start gap-3">
          <LightBulbIcon className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Think about it:</p>
            <p className="mt-1 text-sm text-amber-700">
              Would you rather have {cardName} or {boosterPacks} chances to pull something amazing?
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Prices are estimates. There is no wrong answer - collect what makes you happy!
      </p>
    </div>
  );
}

// ============================================================================
// COMPACT BUTTON VERSION (for card details)
// ============================================================================

interface IsItWorthItButtonProps {
  cardPrice: number;
  cardName?: string;
  className?: string;
}

export function IsItWorthItButton({ cardPrice, cardName, className }: IsItWorthItButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show for cards with meaningful price (>= $5)
  if (cardPrice < 5) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:from-amber-200 hover:to-orange-200',
          className
        )}
      >
        <ScaleIcon className="h-4 w-4" />
        Is it worth it?
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <IsItWorthIt
              cardPrice={cardPrice}
              cardName={cardName}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
