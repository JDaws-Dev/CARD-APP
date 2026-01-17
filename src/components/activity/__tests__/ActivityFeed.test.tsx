import { describe, it, expect } from 'vitest';
import { ActivityFeed, ActivityFeedSkeleton } from '../ActivityFeed';

describe('ActivityFeed', () => {
  describe('Component exports', () => {
    it('exports ActivityFeed component', () => {
      expect(ActivityFeed).toBeDefined();
      expect(typeof ActivityFeed).toBe('object'); // memo returns an object
    });

    it('exports ActivityFeedSkeleton component', () => {
      expect(ActivityFeedSkeleton).toBeDefined();
      expect(typeof ActivityFeedSkeleton).toBe('object'); // memo returns an object
    });
  });

  describe('React.memo optimization', () => {
    it('ActivityFeed is wrapped with React.memo', () => {
      // React.memo wrapped components have a $$typeof symbol and a type property
      expect(ActivityFeed).toHaveProperty('$$typeof');
      expect(ActivityFeed).toHaveProperty('type');
    });

    it('ActivityFeedSkeleton is wrapped with React.memo', () => {
      // React.memo wrapped components have a $$typeof symbol and a type property
      expect(ActivityFeedSkeleton).toHaveProperty('$$typeof');
      expect(ActivityFeedSkeleton).toHaveProperty('type');
    });

    it('ActivityFeed has displayName for debugging', () => {
      // Named memo functions have displayName containing the component name
      expect(ActivityFeed.type.name).toContain('ActivityFeed');
    });

    it('ActivityFeedSkeleton has displayName for debugging', () => {
      // Named memo functions have displayName containing the component name
      expect(ActivityFeedSkeleton.type.name).toContain('ActivityFeedSkeleton');
    });
  });
});
