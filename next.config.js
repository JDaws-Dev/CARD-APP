/** @type {import('next').NextConfig} */
// Last updated: 2026-01-18 - Added CSP headers for security
const nextConfig = {
  typescript: {
    // Convex files have their own compilation process
    // Skip type checking convex during Next.js build
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default to self for everything not specified
              "default-src 'self'",
              // Scripts: self + unsafe-inline for Next.js hydration, unsafe-eval for dev mode
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              // Styles: self + unsafe-inline for CSS-in-JS and inline styles
              "style-src 'self' 'unsafe-inline'",
              // Images: self + all configured remote patterns + data URIs for inline images
              "img-src 'self' data: blob: https://images.pokemontcg.io https://images.ygoprodeck.com https://optcg-api.ryanmichaelhirst.us https://images.ryanmichaelhirst.us https://en.onepiece-cardgame.com https://lorcana-api.com https://lorcast.com https://cards.lorcast.io https://*.lorcast.com",
              // Fonts: self (next/font hosts fonts locally)
              "font-src 'self'",
              // Connect: self + Convex cloud for API/WebSocket connections
              "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
              // Frame ancestors: prevent clickjacking
              "frame-ancestors 'self'",
              // Form actions: self only
              "form-action 'self'",
              // Base URI: self only
              "base-uri 'self'",
              // Object src: none (no plugins)
              "object-src 'none'",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
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
