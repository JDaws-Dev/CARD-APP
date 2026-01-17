/**
 * Sitemap Generation Utilities
 *
 * Pure utility functions for generating XML sitemaps.
 * These functions create the sitemap structure for SEO and search engine indexing.
 *
 * Supports:
 * - Static routes (home, login, sets list, etc.)
 * - Dynamic routes (/sets/[setId] for all TCG sets)
 * - Priority and change frequency configuration
 * - lastmod dates based on data freshness
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Change frequency options per sitemaps.org spec
 */
export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

/**
 * A single URL entry in the sitemap
 */
export interface SitemapEntry {
  /** Absolute URL (e.g., https://kidcollect.app/sets) */
  loc: string;
  /** Last modification date in ISO 8601 format (YYYY-MM-DD) */
  lastmod?: string;
  /** Change frequency hint for crawlers */
  changefreq?: ChangeFrequency;
  /** Priority 0.0-1.0, relative to other pages on the site */
  priority?: number;
}

/**
 * Configuration for generating the sitemap
 */
export interface SitemapConfig {
  /** Base URL of the site (e.g., https://kidcollect.app) */
  baseUrl: string;
  /** Default priority for pages without explicit priority */
  defaultPriority?: number;
  /** Default change frequency for pages without explicit frequency */
  defaultChangeFreq?: ChangeFrequency;
}

/**
 * Route configuration for a page
 */
export interface RouteConfig {
  /** Path relative to base URL (e.g., /sets, /login) */
  path: string;
  /** Priority 0.0-1.0 */
  priority?: number;
  /** Change frequency */
  changefreq?: ChangeFrequency;
  /** Last modification date */
  lastmod?: string;
  /** Whether this route should be included in sitemap */
  include?: boolean;
}

/**
 * Set data needed for sitemap generation
 */
export interface SetForSitemap {
  /** Set ID (e.g., sv1, LOB) */
  setId: string;
  /** Game slug (pokemon, yugioh, etc.) */
  gameSlug: string;
  /** Release date as string (YYYY-MM-DD) */
  releaseDate?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Static public routes that should be included in the sitemap
 * These are accessible without authentication
 */
export const STATIC_PUBLIC_ROUTES: RouteConfig[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/login', priority: 0.5, changefreq: 'monthly' },
  { path: '/signup', priority: 0.5, changefreq: 'monthly' },
  { path: '/sets', priority: 0.9, changefreq: 'daily' },
  { path: '/learn', priority: 0.7, changefreq: 'weekly' },
  { path: '/condition-guide', priority: 0.6, changefreq: 'monthly' },
  { path: '/browse', priority: 0.8, changefreq: 'daily' },
];

/**
 * Routes that should NOT be included in the sitemap (private/auth-required)
 */
export const EXCLUDED_ROUTES = [
  '/collection',
  '/dashboard',
  '/my-wishlist',
  '/parent-dashboard',
  '/profile',
  '/settings',
  '/streak',
  '/timeline',
  '/onboarding',
  '/badges',
  '/compare',
  '/search',
];

/**
 * Default priority for dynamic set pages
 */
export const SET_PAGE_PRIORITY = 0.7;

/**
 * Default change frequency for set pages
 */
export const SET_PAGE_CHANGEFREQ: ChangeFrequency = 'weekly';

/**
 * XML sitemap header
 */
export const SITEMAP_XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * XML sitemap namespace
 */
export const SITEMAP_XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a priority value is valid (0.0-1.0)
 */
export function isValidPriority(priority: number): boolean {
  return typeof priority === 'number' && priority >= 0 && priority <= 1;
}

/**
 * Check if a change frequency is valid
 */
export function isValidChangeFreq(freq: string): freq is ChangeFrequency {
  const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  return validFreqs.includes(freq);
}

/**
 * Check if a date string is valid ISO 8601 format (YYYY-MM-DD or full ISO)
 */
export function isValidDateString(date: string): boolean {
  if (!date) return false;
  // Accept YYYY-MM-DD format - validate the actual date values
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    // Check valid ranges
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    // Create date using UTC to avoid timezone issues
    const parsed = new Date(Date.UTC(year, month - 1, day));
    // Verify the date components match (catches invalid dates like Feb 30)
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }
  // Accept full ISO 8601 format
  if (/^\d{4}-\d{2}-\d{2}T/.test(date)) {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  return false;
}

/**
 * Validate a URL string
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a sitemap entry
 */
export function isValidSitemapEntry(entry: SitemapEntry): boolean {
  if (!entry.loc || !isValidUrl(entry.loc)) return false;
  if (entry.lastmod && !isValidDateString(entry.lastmod)) return false;
  if (entry.changefreq && !isValidChangeFreq(entry.changefreq)) return false;
  if (entry.priority !== undefined && !isValidPriority(entry.priority)) return false;
  return true;
}

// =============================================================================
// URL GENERATION FUNCTIONS
// =============================================================================

/**
 * Normalize a base URL by removing trailing slash
 */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Normalize a path by ensuring it starts with /
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Build a full URL from base URL and path
 */
export function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const normalizedPath = normalizePath(path);
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * Build the URL for a set detail page
 */
export function buildSetUrl(baseUrl: string, setId: string): string {
  return buildUrl(baseUrl, `/sets/${encodeURIComponent(setId)}`);
}

/**
 * Build the URL for a shared wishlist page
 */
export function buildWishlistUrl(baseUrl: string, token: string): string {
  return buildUrl(baseUrl, `/wishlist/${encodeURIComponent(token)}`);
}

// =============================================================================
// DATE FUNCTIONS
// =============================================================================

/**
 * Format a date to YYYY-MM-DD format
 */
export function formatDateForSitemap(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date in sitemap format
 */
export function getTodayForSitemap(): string {
  return formatDateForSitemap(new Date());
}

/**
 * Parse a date string to a Date object
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Get the most recent date from an array of date strings
 */
export function getMostRecentDate(dates: (string | undefined)[]): string | undefined {
  const validDates = dates
    .filter((d): d is string => !!d)
    .map((d) => parseDateString(d))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates.length > 0 ? formatDateForSitemap(validDates[0]) : undefined;
}

// =============================================================================
// SITEMAP ENTRY GENERATION
// =============================================================================

/**
 * Create a sitemap entry from a route config
 */
export function createEntryFromRoute(
  baseUrl: string,
  route: RouteConfig,
  defaults?: { priority?: number; changefreq?: ChangeFrequency }
): SitemapEntry {
  return {
    loc: buildUrl(baseUrl, route.path),
    lastmod: route.lastmod,
    changefreq: route.changefreq ?? defaults?.changefreq,
    priority: route.priority ?? defaults?.priority,
  };
}

/**
 * Create a sitemap entry for a set detail page
 */
export function createSetEntry(
  baseUrl: string,
  set: SetForSitemap,
  options?: { priority?: number; changefreq?: ChangeFrequency }
): SitemapEntry {
  return {
    loc: buildSetUrl(baseUrl, set.setId),
    lastmod: set.releaseDate,
    changefreq: options?.changefreq ?? SET_PAGE_CHANGEFREQ,
    priority: options?.priority ?? SET_PAGE_PRIORITY,
  };
}

/**
 * Generate sitemap entries for static routes
 */
export function generateStaticEntries(
  baseUrl: string,
  routes: RouteConfig[] = STATIC_PUBLIC_ROUTES
): SitemapEntry[] {
  return routes
    .filter((route) => route.include !== false)
    .map((route) => createEntryFromRoute(baseUrl, route));
}

/**
 * Generate sitemap entries for all sets
 */
export function generateSetEntries(
  baseUrl: string,
  sets: SetForSitemap[],
  options?: { priority?: number; changefreq?: ChangeFrequency }
): SitemapEntry[] {
  return sets.map((set) => createSetEntry(baseUrl, set, options));
}

/**
 * Generate all sitemap entries
 */
export function generateAllEntries(
  baseUrl: string,
  sets: SetForSitemap[],
  staticRoutes?: RouteConfig[]
): SitemapEntry[] {
  const staticEntries = generateStaticEntries(baseUrl, staticRoutes);
  const setEntries = generateSetEntries(baseUrl, sets);
  return [...staticEntries, ...setEntries];
}

// =============================================================================
// XML GENERATION
// =============================================================================

/**
 * Escape special XML characters in a string
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate XML for a single URL entry
 */
export function generateUrlXml(entry: SitemapEntry): string {
  const lines: string[] = ['  <url>'];
  lines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);

  if (entry.lastmod) {
    lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
  }
  if (entry.changefreq) {
    lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
  }
  if (entry.priority !== undefined) {
    lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
}

/**
 * Generate a complete XML sitemap from entries
 */
export function generateSitemapXml(entries: SitemapEntry[]): string {
  const validEntries = entries.filter(isValidSitemapEntry);

  const lines: string[] = [
    SITEMAP_XML_HEADER,
    `<urlset xmlns="${SITEMAP_XMLNS}">`,
    ...validEntries.map(generateUrlXml),
    '</urlset>',
  ];

  return lines.join('\n');
}

/**
 * Generate a complete sitemap XML from config and sets
 */
export function generateCompleteSitemap(
  config: SitemapConfig,
  sets: SetForSitemap[],
  staticRoutes?: RouteConfig[]
): string {
  const entries = generateAllEntries(config.baseUrl, sets, staticRoutes);
  return generateSitemapXml(entries);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Count the total number of URLs in a sitemap
 */
export function countSitemapUrls(entries: SitemapEntry[]): number {
  return entries.filter(isValidSitemapEntry).length;
}

/**
 * Get sitemap statistics
 */
export interface SitemapStats {
  totalUrls: number;
  staticUrls: number;
  setUrls: number;
  gamesRepresented: string[];
  mostRecentUpdate?: string;
}

export function getSitemapStats(staticRoutes: RouteConfig[], sets: SetForSitemap[]): SitemapStats {
  const games = [...new Set(sets.map((s) => s.gameSlug))].sort();
  const allDates = [...staticRoutes.map((r) => r.lastmod), ...sets.map((s) => s.releaseDate)];

  return {
    totalUrls: staticRoutes.length + sets.length,
    staticUrls: staticRoutes.length,
    setUrls: sets.length,
    gamesRepresented: games,
    mostRecentUpdate: getMostRecentDate(allDates),
  };
}

/**
 * Group sets by game for analysis
 */
export function groupSetsByGame(sets: SetForSitemap[]): Record<string, SetForSitemap[]> {
  return sets.reduce(
    (acc, set) => {
      if (!acc[set.gameSlug]) {
        acc[set.gameSlug] = [];
      }
      acc[set.gameSlug].push(set);
      return acc;
    },
    {} as Record<string, SetForSitemap[]>
  );
}

/**
 * Filter sets by release date (only include sets released within N months)
 */
export function filterSetsByAge(sets: SetForSitemap[], maxAgeMonths: number): SetForSitemap[] {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);

  return sets.filter((set) => {
    if (!set.releaseDate) return true; // Include sets without release date
    const releaseDate = parseDateString(set.releaseDate);
    return releaseDate ? releaseDate >= cutoffDate : true;
  });
}

/**
 * Sort sets by release date (most recent first)
 */
export function sortSetsByReleaseDate(sets: SetForSitemap[]): SetForSitemap[] {
  return [...sets].sort((a, b) => {
    if (!a.releaseDate && !b.releaseDate) return 0;
    if (!a.releaseDate) return 1;
    if (!b.releaseDate) return -1;
    return b.releaseDate.localeCompare(a.releaseDate);
  });
}

/**
 * Check if sitemap is within recommended size limits
 * Sitemaps should have at most 50,000 URLs and be under 50MB uncompressed
 */
export function checkSitemapLimits(entries: SitemapEntry[]): {
  withinLimits: boolean;
  urlCount: number;
  maxUrls: number;
} {
  const MAX_URLS = 50000;
  const urlCount = entries.length;
  return {
    withinLimits: urlCount <= MAX_URLS,
    urlCount,
    maxUrls: MAX_URLS,
  };
}
