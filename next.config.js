/** @type {import('next').NextConfig} */
// Last updated: 2026-01-17 - Added One Piece and Lorcana image domains
const nextConfig = {
  typescript: {
    // Convex files have their own compilation process
    // Skip type checking convex during Next.js build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Pokemon TCG
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
      // Yu-Gi-Oh! (YGOPRODeck)
      {
        protocol: 'https',
        hostname: 'images.ygoprodeck.com',
        pathname: '/**',
      },
      // One Piece TCG
      {
        protocol: 'https',
        hostname: 'optcg-api.ryanmichaelhirst.us',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.ryanmichaelhirst.us',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'en.onepiece-cardgame.com',
        pathname: '/**',
      },
      // Disney Lorcana (Lorcast)
      {
        protocol: 'https',
        hostname: 'lorcana-api.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lorcast.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cards.lorcast.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.lorcast.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
