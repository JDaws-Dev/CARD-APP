import { describe, expect, it } from 'vitest';
import {
  // Constants
  STATIC_PUBLIC_ROUTES,
  EXCLUDED_ROUTES,
  SET_PAGE_PRIORITY,
  SET_PAGE_CHANGEFREQ,
  SITEMAP_XML_HEADER,
  SITEMAP_XMLNS,
  // Types
  type SitemapEntry,
  type RouteConfig,
  type SetForSitemap,
  type SitemapConfig,
  type ChangeFrequency,
  type SitemapStats,
  // Validation functions
  isValidPriority,
  isValidChangeFreq,
  isValidDateString,
  isValidUrl,
  isValidSitemapEntry,
  // URL generation functions
  normalizeBaseUrl,
  normalizePath,
  buildUrl,
  buildSetUrl,
  buildWishlistUrl,
  // Date functions
  formatDateForSitemap,
  getTodayForSitemap,
  parseDateString,
  getMostRecentDate,
  // Entry generation functions
  createEntryFromRoute,
  createSetEntry,
  generateStaticEntries,
  generateSetEntries,
  generateAllEntries,
  // XML generation functions
  escapeXml,
  generateUrlXml,
  generateSitemapXml,
  generateCompleteSitemap,
  // Utility functions
  countSitemapUrls,
  getSitemapStats,
  groupSetsByGame,
  filterSetsByAge,
  sortSetsByReleaseDate,
  checkSitemapLimits,
} from '../sitemap';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Sitemap Constants', () => {
  it('should have static public routes defined', () => {
    expect(STATIC_PUBLIC_ROUTES).toBeDefined();
    expect(STATIC_PUBLIC_ROUTES.length).toBeGreaterThan(0);
  });

  it('should have home route with highest priority', () => {
    const homeRoute = STATIC_PUBLIC_ROUTES.find((r) => r.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.priority).toBe(1.0);
  });

  it('should have sets route with high priority', () => {
    const setsRoute = STATIC_PUBLIC_ROUTES.find((r) => r.path === '/sets');
    expect(setsRoute).toBeDefined();
    expect(setsRoute?.priority).toBeGreaterThan(0.8);
  });

  it('should have excluded routes defined for auth-required pages', () => {
    expect(EXCLUDED_ROUTES).toContain('/collection');
    expect(EXCLUDED_ROUTES).toContain('/dashboard');
    expect(EXCLUDED_ROUTES).toContain('/parent-dashboard');
    expect(EXCLUDED_ROUTES).toContain('/settings');
  });

  it('should have default set page priority defined', () => {
    expect(SET_PAGE_PRIORITY).toBeGreaterThan(0);
    expect(SET_PAGE_PRIORITY).toBeLessThanOrEqual(1);
  });

  it('should have default set page change frequency defined', () => {
    expect(SET_PAGE_CHANGEFREQ).toBeDefined();
    expect(isValidChangeFreq(SET_PAGE_CHANGEFREQ)).toBe(true);
  });

  it('should have correct XML header', () => {
    expect(SITEMAP_XML_HEADER).toBe('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it('should have correct XML namespace', () => {
    expect(SITEMAP_XMLNS).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  });
});

// =============================================================================
// VALIDATION FUNCTION TESTS
// =============================================================================

describe('isValidPriority', () => {
  it('should return true for valid priorities', () => {
    expect(isValidPriority(0)).toBe(true);
    expect(isValidPriority(0.5)).toBe(true);
    expect(isValidPriority(1)).toBe(true);
    expect(isValidPriority(0.7)).toBe(true);
  });

  it('should return false for invalid priorities', () => {
    expect(isValidPriority(-0.1)).toBe(false);
    expect(isValidPriority(1.1)).toBe(false);
    expect(isValidPriority(NaN)).toBe(false);
    expect(isValidPriority(Infinity)).toBe(false);
  });
});

describe('isValidChangeFreq', () => {
  it('should return true for valid change frequencies', () => {
    const validFreqs: ChangeFrequency[] = [
      'always',
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'never',
    ];
    for (const freq of validFreqs) {
      expect(isValidChangeFreq(freq)).toBe(true);
    }
  });

  it('should return false for invalid change frequencies', () => {
    expect(isValidChangeFreq('sometimes')).toBe(false);
    expect(isValidChangeFreq('')).toBe(false);
    expect(isValidChangeFreq('DAILY')).toBe(false);
    expect(isValidChangeFreq('biweekly')).toBe(false);
  });
});

describe('isValidDateString', () => {
  it('should return true for valid YYYY-MM-DD format', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
    expect(isValidDateString('2023-12-31')).toBe(true);
    expect(isValidDateString('2026-01-17')).toBe(true);
  });

  it('should return true for valid ISO 8601 format', () => {
    expect(isValidDateString('2024-01-15T12:00:00Z')).toBe(true);
    expect(isValidDateString('2024-01-15T12:00:00.000Z')).toBe(true);
  });

  it('should return false for invalid date formats', () => {
    expect(isValidDateString('')).toBe(false);
    expect(isValidDateString('01-15-2024')).toBe(false);
    expect(isValidDateString('January 15, 2024')).toBe(false);
    expect(isValidDateString('2024/01/15')).toBe(false);
    expect(isValidDateString('invalid')).toBe(false);
  });

  it('should return false for invalid dates', () => {
    expect(isValidDateString('2024-13-01')).toBe(false); // Invalid month
    expect(isValidDateString('2024-02-30')).toBe(false); // Invalid day
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://kidcollect.app/sets')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('https://example.com/path/to/page?query=value')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('/relative/path')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });
});

describe('isValidSitemapEntry', () => {
  it('should return true for valid entries', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com/page',
      lastmod: '2024-01-15',
      changefreq: 'weekly',
      priority: 0.8,
    };
    expect(isValidSitemapEntry(entry)).toBe(true);
  });

  it('should return true for minimal valid entry', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com',
    };
    expect(isValidSitemapEntry(entry)).toBe(true);
  });

  it('should return false for entry with invalid loc', () => {
    const entry: SitemapEntry = {
      loc: 'not-a-url',
    };
    expect(isValidSitemapEntry(entry)).toBe(false);
  });

  it('should return false for entry with invalid lastmod', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com',
      lastmod: 'invalid-date',
    };
    expect(isValidSitemapEntry(entry)).toBe(false);
  });

  it('should return false for entry with invalid priority', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com',
      priority: 1.5,
    };
    expect(isValidSitemapEntry(entry)).toBe(false);
  });
});

// =============================================================================
// URL GENERATION FUNCTION TESTS
// =============================================================================

describe('normalizeBaseUrl', () => {
  it('should remove trailing slashes', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe('https://example.com');
    expect(normalizeBaseUrl('https://example.com///')).toBe('https://example.com');
  });

  it('should leave URL without trailing slash unchanged', () => {
    expect(normalizeBaseUrl('https://example.com')).toBe('https://example.com');
  });
});

describe('normalizePath', () => {
  it('should ensure path starts with /', () => {
    expect(normalizePath('sets')).toBe('/sets');
    expect(normalizePath('path/to/page')).toBe('/path/to/page');
  });

  it('should leave path with leading slash unchanged', () => {
    expect(normalizePath('/sets')).toBe('/sets');
    expect(normalizePath('/path/to/page')).toBe('/path/to/page');
  });

  it('should return / for empty path', () => {
    expect(normalizePath('')).toBe('/');
  });
});

describe('buildUrl', () => {
  it('should combine base URL and path correctly', () => {
    expect(buildUrl('https://example.com', '/sets')).toBe('https://example.com/sets');
    expect(buildUrl('https://example.com/', 'sets')).toBe('https://example.com/sets');
    expect(buildUrl('https://example.com/', '/sets')).toBe('https://example.com/sets');
  });

  it('should handle root path', () => {
    expect(buildUrl('https://example.com', '/')).toBe('https://example.com/');
    expect(buildUrl('https://example.com', '')).toBe('https://example.com/');
  });
});

describe('buildSetUrl', () => {
  it('should build correct set URL', () => {
    expect(buildSetUrl('https://kidcollect.app', 'sv1')).toBe('https://kidcollect.app/sets/sv1');
    expect(buildSetUrl('https://kidcollect.app', 'LOB')).toBe('https://kidcollect.app/sets/LOB');
  });

  it('should encode special characters in set ID', () => {
    expect(buildSetUrl('https://kidcollect.app', 'set with spaces')).toBe(
      'https://kidcollect.app/sets/set%20with%20spaces'
    );
  });
});

describe('buildWishlistUrl', () => {
  it('should build correct wishlist URL', () => {
    expect(buildWishlistUrl('https://kidcollect.app', 'abc123token')).toBe(
      'https://kidcollect.app/wishlist/abc123token'
    );
  });
});

// =============================================================================
// DATE FUNCTION TESTS
// =============================================================================

describe('formatDateForSitemap', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(formatDateForSitemap(date)).toBe('2024-01-15');
  });

  it('should handle different dates correctly', () => {
    expect(formatDateForSitemap(new Date('2023-12-31T00:00:00Z'))).toBe('2023-12-31');
    expect(formatDateForSitemap(new Date('2026-01-17T15:30:00Z'))).toBe('2026-01-17');
  });
});

describe('getTodayForSitemap', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const today = getTodayForSitemap();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseDateString', () => {
  it('should parse valid date strings', () => {
    const date = parseDateString('2024-01-15');
    expect(date).toBeInstanceOf(Date);
    // Use UTC methods to avoid timezone issues
    expect(date?.getUTCFullYear()).toBe(2024);
    expect(date?.getUTCMonth()).toBe(0); // January is 0
    expect(date?.getUTCDate()).toBe(15);
  });

  it('should return null for invalid date strings', () => {
    expect(parseDateString('')).toBeNull();
    expect(parseDateString('invalid')).toBeNull();
  });
});

describe('getMostRecentDate', () => {
  it('should return most recent date from array', () => {
    const dates = ['2024-01-15', '2024-06-20', '2024-03-10'];
    expect(getMostRecentDate(dates)).toBe('2024-06-20');
  });

  it('should handle undefined values in array', () => {
    const dates: (string | undefined)[] = ['2024-01-15', undefined, '2024-06-20'];
    expect(getMostRecentDate(dates)).toBe('2024-06-20');
  });

  it('should return undefined for empty array', () => {
    expect(getMostRecentDate([])).toBeUndefined();
  });

  it('should return undefined for array of invalid dates', () => {
    expect(getMostRecentDate(['invalid', 'also-invalid'])).toBeUndefined();
  });
});

// =============================================================================
// ENTRY GENERATION FUNCTION TESTS
// =============================================================================

describe('createEntryFromRoute', () => {
  it('should create entry from route config', () => {
    const route: RouteConfig = {
      path: '/sets',
      priority: 0.9,
      changefreq: 'daily',
      lastmod: '2024-01-15',
    };
    const entry = createEntryFromRoute('https://example.com', route);

    expect(entry.loc).toBe('https://example.com/sets');
    expect(entry.priority).toBe(0.9);
    expect(entry.changefreq).toBe('daily');
    expect(entry.lastmod).toBe('2024-01-15');
  });

  it('should use defaults when route has no priority/changefreq', () => {
    const route: RouteConfig = { path: '/test' };
    const entry = createEntryFromRoute('https://example.com', route, {
      priority: 0.5,
      changefreq: 'weekly',
    });

    expect(entry.priority).toBe(0.5);
    expect(entry.changefreq).toBe('weekly');
  });
});

describe('createSetEntry', () => {
  it('should create entry for a set', () => {
    const set: SetForSitemap = {
      setId: 'sv1',
      gameSlug: 'pokemon',
      releaseDate: '2023-03-31',
    };
    const entry = createSetEntry('https://kidcollect.app', set);

    expect(entry.loc).toBe('https://kidcollect.app/sets/sv1');
    expect(entry.lastmod).toBe('2023-03-31');
    expect(entry.priority).toBe(SET_PAGE_PRIORITY);
    expect(entry.changefreq).toBe(SET_PAGE_CHANGEFREQ);
  });

  it('should use custom options when provided', () => {
    const set: SetForSitemap = {
      setId: 'LOB',
      gameSlug: 'yugioh',
    };
    const entry = createSetEntry('https://kidcollect.app', set, {
      priority: 0.8,
      changefreq: 'monthly',
    });

    expect(entry.priority).toBe(0.8);
    expect(entry.changefreq).toBe('monthly');
  });
});

describe('generateStaticEntries', () => {
  it('should generate entries for all static routes', () => {
    const entries = generateStaticEntries('https://example.com');
    expect(entries.length).toBe(STATIC_PUBLIC_ROUTES.length);
    expect(entries[0].loc).toBe('https://example.com/');
  });

  it('should filter out routes with include: false', () => {
    const routes: RouteConfig[] = [
      { path: '/', priority: 1.0 },
      { path: '/excluded', include: false },
      { path: '/sets', priority: 0.9 },
    ];
    const entries = generateStaticEntries('https://example.com', routes);
    expect(entries.length).toBe(2);
    expect(entries.find((e) => e.loc.includes('/excluded'))).toBeUndefined();
  });
});

describe('generateSetEntries', () => {
  it('should generate entries for all sets', () => {
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon', releaseDate: '2023-03-31' },
      { setId: 'LOB', gameSlug: 'yugioh', releaseDate: '2002-03-08' },
    ];
    const entries = generateSetEntries('https://kidcollect.app', sets);

    expect(entries.length).toBe(2);
    expect(entries[0].loc).toBe('https://kidcollect.app/sets/sv1');
    expect(entries[1].loc).toBe('https://kidcollect.app/sets/LOB');
  });
});

describe('generateAllEntries', () => {
  it('should combine static and set entries', () => {
    const sets: SetForSitemap[] = [{ setId: 'sv1', gameSlug: 'pokemon' }];
    const staticRoutes: RouteConfig[] = [
      { path: '/', priority: 1.0 },
      { path: '/sets', priority: 0.9 },
    ];

    const entries = generateAllEntries('https://example.com', sets, staticRoutes);

    expect(entries.length).toBe(3); // 2 static + 1 set
    expect(entries[0].loc).toBe('https://example.com/');
    expect(entries[1].loc).toBe('https://example.com/sets');
    expect(entries[2].loc).toBe('https://example.com/sets/sv1');
  });
});

// =============================================================================
// XML GENERATION FUNCTION TESTS
// =============================================================================

describe('escapeXml', () => {
  it('should escape ampersand', () => {
    expect(escapeXml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less than and greater than', () => {
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeXml("'single'")).toBe('&apos;single&apos;');
  });

  it('should handle multiple special characters', () => {
    expect(escapeXml('<"Tom & Jerry">')).toBe('&lt;&quot;Tom &amp; Jerry&quot;&gt;');
  });

  it('should leave regular text unchanged', () => {
    expect(escapeXml('Hello World')).toBe('Hello World');
  });
});

describe('generateUrlXml', () => {
  it('should generate XML for basic entry', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com/page',
    };
    const xml = generateUrlXml(entry);

    expect(xml).toContain('<url>');
    expect(xml).toContain('<loc>https://example.com/page</loc>');
    expect(xml).toContain('</url>');
  });

  it('should include all optional fields when present', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com/page',
      lastmod: '2024-01-15',
      changefreq: 'weekly',
      priority: 0.8,
    };
    const xml = generateUrlXml(entry);

    expect(xml).toContain('<lastmod>2024-01-15</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');
  });

  it('should format priority with one decimal place', () => {
    const entry: SitemapEntry = {
      loc: 'https://example.com',
      priority: 1,
    };
    const xml = generateUrlXml(entry);
    expect(xml).toContain('<priority>1.0</priority>');
  });
});

describe('generateSitemapXml', () => {
  it('should generate valid XML sitemap', () => {
    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/', priority: 1.0 },
      { loc: 'https://example.com/sets', priority: 0.9 },
    ];
    const xml = generateSitemapXml(entries);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/sets</loc>');
  });

  it('should filter out invalid entries', () => {
    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/', priority: 1.0 },
      { loc: 'invalid-url' }, // Invalid
      { loc: 'https://example.com/sets', priority: 0.9 },
    ];
    const xml = generateSitemapXml(entries);

    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/sets</loc>');
    expect(xml).not.toContain('invalid-url');
  });

  it('should handle empty entries array', () => {
    const xml = generateSitemapXml([]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
  });
});

describe('generateCompleteSitemap', () => {
  it('should generate complete sitemap with static routes and sets', () => {
    const config: SitemapConfig = {
      baseUrl: 'https://kidcollect.app',
    };
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon', releaseDate: '2023-03-31' },
    ];
    const staticRoutes: RouteConfig[] = [{ path: '/', priority: 1.0 }];

    const xml = generateCompleteSitemap(config, sets, staticRoutes);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://kidcollect.app/</loc>');
    expect(xml).toContain('<loc>https://kidcollect.app/sets/sv1</loc>');
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('countSitemapUrls', () => {
  it('should count valid entries', () => {
    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/a' },
      { loc: 'https://example.com/b' },
      { loc: 'https://example.com/c' },
    ];
    expect(countSitemapUrls(entries)).toBe(3);
  });

  it('should not count invalid entries', () => {
    const entries: SitemapEntry[] = [
      { loc: 'https://example.com/a' },
      { loc: 'invalid' }, // Invalid URL
      { loc: 'https://example.com/b' },
    ];
    expect(countSitemapUrls(entries)).toBe(2);
  });
});

describe('getSitemapStats', () => {
  it('should return correct statistics', () => {
    const staticRoutes: RouteConfig[] = [
      { path: '/', lastmod: '2024-01-01' },
      { path: '/sets', lastmod: '2024-01-10' },
    ];
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon', releaseDate: '2023-03-31' },
      { setId: 'LOB', gameSlug: 'yugioh', releaseDate: '2002-03-08' },
      { setId: 'sv2', gameSlug: 'pokemon', releaseDate: '2024-06-15' },
    ];

    const stats: SitemapStats = getSitemapStats(staticRoutes, sets);

    expect(stats.totalUrls).toBe(5);
    expect(stats.staticUrls).toBe(2);
    expect(stats.setUrls).toBe(3);
    expect(stats.gamesRepresented).toEqual(['pokemon', 'yugioh']);
    expect(stats.mostRecentUpdate).toBe('2024-06-15');
  });

  it('should handle empty inputs', () => {
    const stats = getSitemapStats([], []);
    expect(stats.totalUrls).toBe(0);
    expect(stats.staticUrls).toBe(0);
    expect(stats.setUrls).toBe(0);
    expect(stats.gamesRepresented).toEqual([]);
    expect(stats.mostRecentUpdate).toBeUndefined();
  });
});

describe('groupSetsByGame', () => {
  it('should group sets by game slug', () => {
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon' },
      { setId: 'LOB', gameSlug: 'yugioh' },
      { setId: 'sv2', gameSlug: 'pokemon' },
      { setId: 'AST', gameSlug: 'yugioh' },
    ];

    const grouped = groupSetsByGame(sets);

    expect(grouped['pokemon'].length).toBe(2);
    expect(grouped['yugioh'].length).toBe(2);
    expect(grouped['pokemon'].map((s) => s.setId)).toEqual(['sv1', 'sv2']);
  });

  it('should handle empty array', () => {
    const grouped = groupSetsByGame([]);
    expect(Object.keys(grouped).length).toBe(0);
  });
});

describe('filterSetsByAge', () => {
  it('should filter sets older than max age', () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const sets: SetForSitemap[] = [
      { setId: 'new', gameSlug: 'pokemon', releaseDate: formatDateForSitemap(now) },
      { setId: 'recent', gameSlug: 'pokemon', releaseDate: formatDateForSitemap(sixMonthsAgo) },
      { setId: 'old', gameSlug: 'pokemon', releaseDate: formatDateForSitemap(twoYearsAgo) },
    ];

    const filtered = filterSetsByAge(sets, 12);

    expect(filtered.length).toBe(2);
    expect(filtered.map((s) => s.setId)).toContain('new');
    expect(filtered.map((s) => s.setId)).toContain('recent');
    expect(filtered.map((s) => s.setId)).not.toContain('old');
  });

  it('should include sets without release date', () => {
    const sets: SetForSitemap[] = [{ setId: 'nodateSet', gameSlug: 'pokemon' }];

    const filtered = filterSetsByAge(sets, 12);
    expect(filtered.length).toBe(1);
  });
});

describe('sortSetsByReleaseDate', () => {
  it('should sort sets by release date descending', () => {
    const sets: SetForSitemap[] = [
      { setId: 'old', gameSlug: 'pokemon', releaseDate: '2020-01-01' },
      { setId: 'new', gameSlug: 'pokemon', releaseDate: '2024-06-01' },
      { setId: 'mid', gameSlug: 'pokemon', releaseDate: '2022-06-01' },
    ];

    const sorted = sortSetsByReleaseDate(sets);

    expect(sorted[0].setId).toBe('new');
    expect(sorted[1].setId).toBe('mid');
    expect(sorted[2].setId).toBe('old');
  });

  it('should put sets without release date at end', () => {
    const sets: SetForSitemap[] = [
      { setId: 'noDate', gameSlug: 'pokemon' },
      { setId: 'hasDate', gameSlug: 'pokemon', releaseDate: '2024-01-01' },
    ];

    const sorted = sortSetsByReleaseDate(sets);

    expect(sorted[0].setId).toBe('hasDate');
    expect(sorted[1].setId).toBe('noDate');
  });

  it('should not mutate original array', () => {
    const sets: SetForSitemap[] = [
      { setId: 'b', gameSlug: 'pokemon', releaseDate: '2020-01-01' },
      { setId: 'a', gameSlug: 'pokemon', releaseDate: '2024-01-01' },
    ];
    const original = [...sets];

    sortSetsByReleaseDate(sets);

    expect(sets[0].setId).toBe(original[0].setId);
    expect(sets[1].setId).toBe(original[1].setId);
  });
});

describe('checkSitemapLimits', () => {
  it('should return within limits for small sitemap', () => {
    const entries: SitemapEntry[] = Array(100)
      .fill(null)
      .map((_, i) => ({ loc: `https://example.com/page${i}` }));

    const result = checkSitemapLimits(entries);

    expect(result.withinLimits).toBe(true);
    expect(result.urlCount).toBe(100);
    expect(result.maxUrls).toBe(50000);
  });

  it('should return not within limits for large sitemap', () => {
    const entries: SitemapEntry[] = Array(60000)
      .fill(null)
      .map((_, i) => ({ loc: `https://example.com/page${i}` }));

    const result = checkSitemapLimits(entries);

    expect(result.withinLimits).toBe(false);
    expect(result.urlCount).toBe(60000);
  });

  it('should handle exactly at limit', () => {
    const entries: SitemapEntry[] = Array(50000)
      .fill(null)
      .map((_, i) => ({ loc: `https://example.com/page${i}` }));

    const result = checkSitemapLimits(entries);

    expect(result.withinLimits).toBe(true);
    expect(result.urlCount).toBe(50000);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration: Full Sitemap Generation', () => {
  it('should generate a valid sitemap for multiple games', () => {
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon', releaseDate: '2023-03-31' },
      { setId: 'sv2', gameSlug: 'pokemon', releaseDate: '2023-06-09' },
      { setId: 'LOB', gameSlug: 'yugioh', releaseDate: '2002-03-08' },
      { setId: 'TFC', gameSlug: 'lorcana', releaseDate: '2023-08-18' },
    ];

    const xml = generateCompleteSitemap(
      { baseUrl: 'https://kidcollect.app' },
      sets,
      STATIC_PUBLIC_ROUTES
    );

    // Should contain XML declaration
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');

    // Should contain all static routes
    for (const route of STATIC_PUBLIC_ROUTES) {
      expect(xml).toContain(`<loc>https://kidcollect.app${route.path}</loc>`);
    }

    // Should contain all set pages
    expect(xml).toContain('<loc>https://kidcollect.app/sets/sv1</loc>');
    expect(xml).toContain('<loc>https://kidcollect.app/sets/sv2</loc>');
    expect(xml).toContain('<loc>https://kidcollect.app/sets/LOB</loc>');
    expect(xml).toContain('<loc>https://kidcollect.app/sets/TFC</loc>');

    // Should include lastmod from release dates
    expect(xml).toContain('<lastmod>2023-03-31</lastmod>');
    expect(xml).toContain('<lastmod>2023-06-09</lastmod>');
  });

  it('should correctly report stats for generated sitemap', () => {
    const sets: SetForSitemap[] = [
      { setId: 'sv1', gameSlug: 'pokemon', releaseDate: '2023-03-31' },
      { setId: 'LOB', gameSlug: 'yugioh', releaseDate: '2002-03-08' },
    ];

    const stats = getSitemapStats(STATIC_PUBLIC_ROUTES, sets);

    expect(stats.totalUrls).toBe(STATIC_PUBLIC_ROUTES.length + 2);
    expect(stats.staticUrls).toBe(STATIC_PUBLIC_ROUTES.length);
    expect(stats.setUrls).toBe(2);
    expect(stats.gamesRepresented).toContain('pokemon');
    expect(stats.gamesRepresented).toContain('yugioh');
  });
});

describe('Integration: Edge Cases', () => {
  it('should handle sets with special characters in ID', () => {
    const sets: SetForSitemap[] = [{ setId: 'Special Edition & More', gameSlug: 'pokemon' }];

    const entries = generateSetEntries('https://example.com', sets);
    const xml = generateSitemapXml(entries);

    // URL should be encoded
    expect(entries[0].loc).toContain('Special%20Edition%20%26%20More');
    // XML should be valid
    expect(xml).toContain('</urlset>');
  });

  it('should handle very large number of sets', () => {
    const sets: SetForSitemap[] = Array(10000)
      .fill(null)
      .map((_, i) => ({
        setId: `set-${i}`,
        gameSlug: 'pokemon' as const,
        releaseDate: '2024-01-01',
      }));

    const entries = generateSetEntries('https://example.com', sets);
    const limitCheck = checkSitemapLimits(entries);

    expect(entries.length).toBe(10000);
    expect(limitCheck.withinLimits).toBe(true);
  });

  it('should generate valid XML for empty sets array', () => {
    const xml = generateCompleteSitemap(
      { baseUrl: 'https://kidcollect.app' },
      [],
      STATIC_PUBLIC_ROUTES
    );

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('</urlset>');
    // Should still have static routes
    expect(xml).toContain('<loc>https://kidcollect.app/</loc>');
  });
});
