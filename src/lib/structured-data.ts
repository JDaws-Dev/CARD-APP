/**
 * JSON-LD Structured Data Utilities
 *
 * Provides type-safe schema.org structured data generation for SEO.
 * Supports SoftwareApplication, FAQPage, and BreadcrumbList schemas.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://carddex.app';

/**
 * SoftwareApplication schema for the main app
 * @see https://schema.org/SoftwareApplication
 */
export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
  author: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  url: string;
  screenshot?: string;
}

export function generateSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CardDex',
    description:
      'The family-friendly way to track, organize, and celebrate your trading card collection. Track Pokemon, Yu-Gi-Oh!, One Piece, and Lorcana cards. Built for kids ages 6-14 and their families.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2500',
    },
    author: {
      '@type': 'Organization',
      name: 'CardDex',
      url: SITE_URL,
    },
    url: SITE_URL,
  };
}

/**
 * FAQPage schema for FAQ content
 * @see https://schema.org/FAQPage
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export function generateFAQPageSchema(faqs: FAQItem[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList schema for navigation
 * @see https://schema.org/BreadcrumbList
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbListSchema(
  items: BreadcrumbItem[]
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Default FAQs for CardDex
 * Used on the learn page and potentially the home page
 */
export const DEFAULT_CARDDEX_FAQS: FAQItem[] = [
  {
    question: 'What trading card games does CardDex support?',
    answer:
      'CardDex supports four major trading card games: Pokemon TCG, Yu-Gi-Oh!, One Piece Card Game, and Disney Lorcana. You can track cards from all these games in one app.',
  },
  {
    question: 'Is CardDex free to use?',
    answer:
      'Yes! CardDex offers a free plan that includes unlimited card tracking, access to all 4 TCGs, badges and achievements, shareable wishlists, and 5 AI card scans per day. The Family Plan ($4.99/month) adds multiple profiles, more AI features, and family tools.',
  },
  {
    question: 'How do I add cards to my collection?',
    answer:
      'There are two ways to add cards: 1) Browse sets and tap on cards you own, or 2) Use the AI-powered scanner to snap a photo of your card and add it instantly. The scanner identifies the card and adds it to your collection.',
  },
  {
    question: 'Is CardDex safe for kids?',
    answer:
      'Absolutely! CardDex is designed specifically for kids ages 6-14 and their families. We are COPPA compliant, have no ads ever, use kid-safe AI with built-in safety filters, and never collect personal data from children beyond what is necessary for the service.',
  },
  {
    question: 'Can I share my wishlist with family members?',
    answer:
      'Yes! You can create a wishlist of cards you want and share a link with grandparents, aunts, uncles, and friends. This makes gift-giving easy for birthdays and holidays - no more duplicate cards!',
  },
  {
    question: 'What are badges and how do I earn them?',
    answer:
      'Badges are achievements you unlock as you collect. You can earn badges for completing sets, reaching collection milestones (100, 500, 1000+ cards), finding rare cards, and more. Badges make collecting more fun and rewarding!',
  },
  {
    question: 'How does the Family Plan work?',
    answer:
      'The Family Plan ($4.99/month) lets you create up to 5 collection profiles - perfect for families with multiple collectors. It includes a parent dashboard, sibling duplicate finder to help with trades, and enhanced AI features.',
  },
  {
    question: 'Can I track card conditions?',
    answer:
      'Yes! CardDex lets you note the condition of each card (Near Mint, Lightly Played, Moderately Played, Heavily Played, or Damaged). We also have a Card Condition Guide and mini-games to help you learn how to grade cards.',
  },
];

/**
 * Helper to generate JSON-LD script content
 */
export function jsonLdScriptContent(schema: object): string {
  return JSON.stringify(schema);
}
