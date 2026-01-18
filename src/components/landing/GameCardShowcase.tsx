'use client';

import Image from 'next/image';
import type { GameId } from '@/lib/gameSelector';

/**
 * Sample cards for each game - using recognizable but not chase-rare cards
 * These are statically defined to avoid API calls on the landing page
 */
const SAMPLE_CARDS: Record<
  GameId,
  Array<{ name: string; imageUrl: string; alt: string }>
> = {
  pokemon: [
    {
      name: 'Pikachu',
      imageUrl: 'https://images.pokemontcg.io/sv3pt5/61.png',
      alt: 'Pikachu card from Pokemon TCG',
    },
    {
      name: 'Charizard ex',
      imageUrl: 'https://images.pokemontcg.io/sv3pt5/6.png',
      alt: 'Charizard ex card from Pokemon TCG',
    },
    {
      name: 'Eevee',
      imageUrl: 'https://images.pokemontcg.io/sv3pt5/63.png',
      alt: 'Eevee card from Pokemon TCG',
    },
  ],
  yugioh: [
    {
      name: 'Blue-Eyes White Dragon',
      imageUrl: 'https://images.ygoprodeck.com/images/cards_small/89631139.jpg',
      alt: 'Blue-Eyes White Dragon card from Yu-Gi-Oh!',
    },
    {
      name: 'Dark Magician',
      imageUrl: 'https://images.ygoprodeck.com/images/cards_small/46986414.jpg',
      alt: 'Dark Magician card from Yu-Gi-Oh!',
    },
    {
      name: 'Red-Eyes Black Dragon',
      imageUrl: 'https://images.ygoprodeck.com/images/cards_small/74677422.jpg',
      alt: 'Red-Eyes Black Dragon card from Yu-Gi-Oh!',
    },
  ],
  onepiece: [
    {
      name: 'Monkey D. Luffy',
      imageUrl: 'https://optcg-api.ryanmichaelhirst.us/api/v1/cards/image/OP01-001_p1',
      alt: 'Monkey D. Luffy card from One Piece TCG',
    },
    {
      name: 'Roronoa Zoro',
      imageUrl: 'https://optcg-api.ryanmichaelhirst.us/api/v1/cards/image/OP01-025_p1',
      alt: 'Roronoa Zoro card from One Piece TCG',
    },
    {
      name: 'Nami',
      imageUrl: 'https://optcg-api.ryanmichaelhirst.us/api/v1/cards/image/OP01-016_p1',
      alt: 'Nami card from One Piece TCG',
    },
  ],
  lorcana: [
    {
      name: 'Mickey Mouse',
      // Mickey Mouse - Brave Little Tailor from The First Chapter (set 1)
      imageUrl: 'https://cards.lorcast.io/cards/1/1/en/small.webp',
      alt: 'Mickey Mouse card from Disney Lorcana',
    },
    {
      name: 'Elsa',
      // Elsa - Snow Queen from The First Chapter (set 1)
      imageUrl: 'https://cards.lorcast.io/cards/1/43/en/small.webp',
      alt: 'Elsa card from Disney Lorcana',
    },
    {
      name: 'Stitch',
      // Stitch - Carefree Surfer from The First Chapter (set 1)
      imageUrl: 'https://cards.lorcast.io/cards/1/55/en/small.webp',
      alt: 'Stitch card from Disney Lorcana',
    },
  ],
};

// Card aspect ratios differ by game
const CARD_ASPECT_RATIOS: Record<GameId, { width: number; height: number }> = {
  pokemon: { width: 245, height: 342 },
  yugioh: { width: 245, height: 357 },
  onepiece: { width: 245, height: 342 },
  lorcana: { width: 245, height: 342 },
};

interface GameCardShowcaseProps {
  className?: string;
}

/**
 * A showcase of sample cards from all supported games
 * Displays in a fanned card arrangement for visual appeal
 */
export function GameCardShowcase({ className = '' }: GameCardShowcaseProps) {
  // Select one card from each game for the hero display
  const showcaseCards = [
    { game: 'pokemon' as GameId, card: SAMPLE_CARDS.pokemon[1] }, // Charizard
    { game: 'yugioh' as GameId, card: SAMPLE_CARDS.yugioh[0] }, // Blue-Eyes
    { game: 'onepiece' as GameId, card: SAMPLE_CARDS.onepiece[0] }, // Luffy
    { game: 'lorcana' as GameId, card: SAMPLE_CARDS.lorcana[0] }, // Mickey
  ];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative h-[280px] w-[400px] sm:h-[360px] sm:w-[500px]">
        {showcaseCards.map((item, index) => {
          const aspectRatio = CARD_ASPECT_RATIOS[item.game];
          const rotation = (index - 1.5) * 12; // -18, -6, 6, 18 degrees
          const xOffset = (index - 1.5) * 55; // Spread cards horizontally
          const zIndex = index + 1;

          return (
            <div
              key={item.game}
              className="absolute left-1/2 top-1/2 transition-transform duration-300 hover:z-50 hover:scale-110"
              style={{
                transform: `translate(-50%, -50%) translateX(${xOffset}px) rotate(${rotation}deg)`,
                zIndex,
              }}
            >
              <div
                className="overflow-hidden rounded-lg shadow-xl ring-1 ring-black/5"
                style={{
                  width: aspectRatio.width * 0.55,
                  height: aspectRatio.height * 0.55,
                }}
              >
                <Image
                  src={item.card.imageUrl}
                  alt={item.card.alt}
                  width={aspectRatio.width}
                  height={aspectRatio.height}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  unoptimized // External URLs need unoptimized
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GameCardGridProps {
  game: GameId;
  className?: string;
}

/**
 * A grid display of sample cards for a specific game
 * Used within the game selection section
 */
export function GameCardGrid({ game, className = '' }: GameCardGridProps) {
  const cards = SAMPLE_CARDS[game];
  const aspectRatio = CARD_ASPECT_RATIOS[game];

  return (
    <div className={`flex gap-2 ${className}`}>
      {cards.slice(0, 2).map((card, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-md shadow-md ring-1 ring-black/5 transition-transform hover:scale-105"
          style={{
            width: aspectRatio.width * 0.3,
            height: aspectRatio.height * 0.3,
          }}
        >
          <Image
            src={card.imageUrl}
            alt={card.alt}
            width={aspectRatio.width}
            height={aspectRatio.height}
            className="h-full w-full object-cover"
            loading="lazy"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

export { SAMPLE_CARDS };
