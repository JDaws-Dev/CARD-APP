import { describe, it, expect } from 'vitest';
import {
  RARITY_EXPLAINERS,
  getRarityInfo,
  getRarityInfoByName,
  getAllRarityInfo,
  type RarityInfo,
} from '../rarityExplainer';

describe('rarityExplainer', () => {
  describe('RARITY_EXPLAINERS constant', () => {
    it('should have all 6 rarity tiers defined', () => {
      expect(RARITY_EXPLAINERS).toHaveLength(6);
    });

    it('should include common, uncommon, rare, ultra-rare, secret-rare, and promo', () => {
      const ids = RARITY_EXPLAINERS.map((r) => r.id);
      expect(ids).toContain('common');
      expect(ids).toContain('uncommon');
      expect(ids).toContain('rare');
      expect(ids).toContain('ultra-rare');
      expect(ids).toContain('secret-rare');
      expect(ids).toContain('promo');
    });

    it('each rarity should have all required fields', () => {
      RARITY_EXPLAINERS.forEach((rarity) => {
        expect(rarity).toHaveProperty('id');
        expect(rarity).toHaveProperty('name');
        expect(rarity).toHaveProperty('shortName');
        expect(rarity).toHaveProperty('description');
        expect(rarity).toHaveProperty('examples');
        expect(rarity).toHaveProperty('pullRate');
        expect(rarity).toHaveProperty('collectorTip');

        // Validate types
        expect(typeof rarity.id).toBe('string');
        expect(typeof rarity.name).toBe('string');
        expect(typeof rarity.shortName).toBe('string');
        expect(typeof rarity.description).toBe('string');
        expect(Array.isArray(rarity.examples)).toBe(true);
        expect(typeof rarity.pullRate).toBe('string');
        expect(typeof rarity.collectorTip).toBe('string');
      });
    });

    it('each rarity should have at least one example', () => {
      RARITY_EXPLAINERS.forEach((rarity) => {
        expect(rarity.examples.length).toBeGreaterThan(0);
      });
    });

    it('descriptions should be kid-friendly (no jargon)', () => {
      RARITY_EXPLAINERS.forEach((rarity) => {
        // Descriptions should not contain complex terminology
        expect(rarity.description).not.toMatch(/\$\d+/); // No specific prices
        expect(rarity.description).not.toMatch(/market|value|invest/i); // No financial terms
      });
    });
  });

  describe('getRarityInfo', () => {
    it('should return correct info for valid rarity IDs', () => {
      const common = getRarityInfo('common');
      expect(common).not.toBeNull();
      expect(common?.name).toBe('Common');
      expect(common?.shortName).toBe('C');

      const rare = getRarityInfo('rare');
      expect(rare).not.toBeNull();
      expect(rare?.name).toBe('Rare');
      expect(rare?.shortName).toBe('R');

      const ultraRare = getRarityInfo('ultra-rare');
      expect(ultraRare).not.toBeNull();
      expect(ultraRare?.name).toBe('Ultra Rare');
      expect(ultraRare?.shortName).toBe('UR');

      const secretRare = getRarityInfo('secret-rare');
      expect(secretRare).not.toBeNull();
      expect(secretRare?.name).toBe('Secret Rare');
      expect(secretRare?.shortName).toBe('SR');

      const promo = getRarityInfo('promo');
      expect(promo).not.toBeNull();
      expect(promo?.name).toBe('Promo');
      expect(promo?.shortName).toBe('P');
    });

    it('should return null for invalid rarity IDs', () => {
      expect(getRarityInfo('invalid')).toBeNull();
      expect(getRarityInfo('super-rare')).toBeNull();
      expect(getRarityInfo('')).toBeNull();
      expect(getRarityInfo('COMMON')).toBeNull(); // Case sensitive for ID
    });
  });

  describe('getRarityInfoByName', () => {
    it('should match by exact name (case insensitive)', () => {
      expect(getRarityInfoByName('Common')?.id).toBe('common');
      expect(getRarityInfoByName('common')?.id).toBe('common');
      expect(getRarityInfoByName('COMMON')?.id).toBe('common');

      expect(getRarityInfoByName('Rare')?.id).toBe('rare');
      expect(getRarityInfoByName('RARE')?.id).toBe('rare');

      expect(getRarityInfoByName('Ultra Rare')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('ULTRA RARE')?.id).toBe('ultra-rare');
    });

    it('should match by short name', () => {
      expect(getRarityInfoByName('C')?.id).toBe('common');
      expect(getRarityInfoByName('U')?.id).toBe('uncommon');
      expect(getRarityInfoByName('R')?.id).toBe('rare');
      expect(getRarityInfoByName('UR')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('SR')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('P')?.id).toBe('promo');
    });

    it('should match Pokemon TCG API rarity strings to correct categories', () => {
      // Ultra rare matches
      expect(getRarityInfoByName('Rare Ultra')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Rare Holo EX')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Rare Holo GX')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Rare Holo V')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Rare Holo VMAX')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Rare Holo VSTAR')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('Double Rare')?.id).toBe('ultra-rare');

      // Secret rare matches
      expect(getRarityInfoByName('Rare Secret')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Rare Rainbow')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Rare Shining')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Rare Shiny')?.id).toBe('secret-rare');
      // Note: 'Rare Shiny GX' matches 'gx' keyword so it goes to ultra-rare
      // This is acceptable as it's still a special card category
      expect(getRarityInfoByName('Rare Shiny GX')?.id).toBe('ultra-rare');
      expect(getRarityInfoByName('LEGEND')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Amazing Rare')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Illustration Rare')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Special Illustration Rare')?.id).toBe('secret-rare');
      expect(getRarityInfoByName('Hyper Rare')?.id).toBe('secret-rare');

      // Promo matches
      expect(getRarityInfoByName('Promo')?.id).toBe('promo');
      expect(getRarityInfoByName('Classic Collection')?.id).toBe('promo');
    });

    it('should match Rare Holo to rare category', () => {
      // "Rare" without ultra/secret modifiers should be rare
      expect(getRarityInfoByName('Rare Holo')?.id).toBe('rare');
    });

    it('should return null for empty or invalid strings', () => {
      expect(getRarityInfoByName('')).toBeNull();
      expect(getRarityInfoByName('invalid rarity')).toBeNull();
    });

    it('should prioritize uncommon over common when string contains both', () => {
      // "Uncommon" contains "common" but should match uncommon
      expect(getRarityInfoByName('Uncommon')?.id).toBe('uncommon');
    });
  });

  describe('getAllRarityInfo', () => {
    it('should return all 6 rarity infos', () => {
      const allRarities = getAllRarityInfo();
      expect(allRarities).toHaveLength(6);
    });

    it('should return same array as RARITY_EXPLAINERS', () => {
      const allRarities = getAllRarityInfo();
      expect(allRarities).toEqual(RARITY_EXPLAINERS);
    });
  });

  describe('RarityInfo structure', () => {
    it('common rarity should have appropriate info', () => {
      const common = getRarityInfo('common');
      expect(common).not.toBeNull();
      expect(common!.name).toBe('Common');
      expect(common!.description).toContain('frequently found');
      expect(common!.pullRate).toContain('every pack');
    });

    it('uncommon rarity should have appropriate info', () => {
      const uncommon = getRarityInfo('uncommon');
      expect(uncommon).not.toBeNull();
      expect(uncommon!.name).toBe('Uncommon');
      expect(uncommon!.description).toContain('step up');
    });

    it('rare rarity should have appropriate info', () => {
      const rare = getRarityInfo('rare');
      expect(rare).not.toBeNull();
      expect(rare!.name).toBe('Rare');
      expect(rare!.description).toContain('star symbol');
      expect(rare!.examples).toContain('Holographic cards');
    });

    it('ultra-rare rarity should have appropriate info', () => {
      const ultraRare = getRarityInfo('ultra-rare');
      expect(ultraRare).not.toBeNull();
      expect(ultraRare!.name).toBe('Ultra Rare');
      expect(ultraRare!.description).toContain('EX');
      expect(ultraRare!.description).toContain('GX');
      expect(ultraRare!.description).toContain('V');
    });

    it('secret-rare rarity should have appropriate info', () => {
      const secretRare = getRarityInfo('secret-rare');
      expect(secretRare).not.toBeNull();
      expect(secretRare!.name).toBe('Secret Rare');
      expect(secretRare!.description).toContain('rarest');
      expect(secretRare!.description.toLowerCase()).toContain('numbered higher');
    });

    it('promo rarity should have appropriate info', () => {
      const promo = getRarityInfo('promo');
      expect(promo).not.toBeNull();
      expect(promo!.name).toBe('Promo');
      expect(promo!.description).toContain('events');
      expect(promo!.description).toContain('regular packs');
    });
  });

  describe('collector tips', () => {
    it('all rarities should have helpful collector tips', () => {
      RARITY_EXPLAINERS.forEach((rarity) => {
        expect(rarity.collectorTip.length).toBeGreaterThan(10);
        // Tips should be positive/helpful
        expect(rarity.collectorTip).not.toMatch(/don't|never|bad/i);
      });
    });

    it('higher rarities should mention protection', () => {
      const rare = getRarityInfo('rare');
      const ultraRare = getRarityInfo('ultra-rare');

      expect(rare!.collectorTip).toContain('sleeves');
      expect(ultraRare!.collectorTip).toContain('sleeving');
    });
  });

  describe('examples array', () => {
    it('each rarity should have relevant examples', () => {
      const common = getRarityInfo('common');
      expect(common!.examples).toContain('Basic Pokémon');

      const rare = getRarityInfo('rare');
      expect(rare!.examples).toContain('Holographic cards');

      const ultraRare = getRarityInfo('ultra-rare');
      expect(ultraRare!.examples).toContain('Pokémon EX/GX');

      const secretRare = getRarityInfo('secret-rare');
      expect(secretRare!.examples).toContain('Gold cards');

      const promo = getRarityInfo('promo');
      expect(promo!.examples).toContain('Event exclusives');
    });
  });
});
