import { describe, it, expect } from 'vitest';
import {
  MAX_PRIORITY_ITEMS,
  canAddPriority,
  validatePriorityToggle,
  getPriorityStatus,
} from '../wishlist';

describe('Wishlist Priority Logic', () => {
  describe('MAX_PRIORITY_ITEMS', () => {
    it('should be set to 5', () => {
      expect(MAX_PRIORITY_ITEMS).toBe(5);
    });
  });

  describe('canAddPriority', () => {
    it('should allow adding when no priority items exist', () => {
      const result = canAddPriority(0);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.max).toBe(5);
    });

    it('should allow adding when under the limit', () => {
      const result = canAddPriority(3);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should allow adding at 4 items (one slot remaining)', () => {
      const result = canAddPriority(4);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should not allow adding when at the limit', () => {
      const result = canAddPriority(5);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should not allow adding when over the limit', () => {
      const result = canAddPriority(6);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should always return max as 5', () => {
      expect(canAddPriority(0).max).toBe(5);
      expect(canAddPriority(3).max).toBe(5);
      expect(canAddPriority(5).max).toBe(5);
    });
  });

  describe('validatePriorityToggle', () => {
    describe('toggling OFF (removing priority)', () => {
      it('should always allow toggling off regardless of count', () => {
        expect(validatePriorityToggle(5, true).allowed).toBe(true);
        expect(validatePriorityToggle(10, true).allowed).toBe(true);
        expect(validatePriorityToggle(0, true).allowed).toBe(true);
      });

      it('should not include a reason when toggling off', () => {
        const result = validatePriorityToggle(5, true);
        expect(result.reason).toBeUndefined();
      });
    });

    describe('toggling ON (adding priority)', () => {
      it('should allow when under the limit', () => {
        expect(validatePriorityToggle(0, false).allowed).toBe(true);
        expect(validatePriorityToggle(2, false).allowed).toBe(true);
        expect(validatePriorityToggle(4, false).allowed).toBe(true);
      });

      it('should not allow when at the limit', () => {
        const result = validatePriorityToggle(5, false);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Maximum of 5 priority items allowed');
      });

      it('should not allow when over the limit', () => {
        const result = validatePriorityToggle(6, false);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeDefined();
      });

      it('should not include a reason when allowed', () => {
        const result = validatePriorityToggle(3, false);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });
  });

  describe('getPriorityStatus', () => {
    it('should return correct status for empty list', () => {
      const result = getPriorityStatus([]);
      expect(result.count).toBe(0);
      expect(result.max).toBe(5);
      expect(result.remaining).toBe(5);
      expect(result.isFull).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should return correct status for partially filled list', () => {
      const items = ['card-1', 'card-2', 'card-3'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(3);
      expect(result.remaining).toBe(2);
      expect(result.isFull).toBe(false);
      expect(result.items).toEqual(items);
    });

    it('should return correct status when full', () => {
      const items = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.isFull).toBe(true);
      expect(result.items).toEqual(items);
    });

    it('should handle edge case of over limit gracefully', () => {
      const items = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];
      const result = getPriorityStatus(items);
      expect(result.count).toBe(6);
      expect(result.remaining).toBe(0);
      expect(result.isFull).toBe(true);
    });

    it('should preserve the items array reference', () => {
      const items = ['card-a', 'card-b'];
      const result = getPriorityStatus(items);
      expect(result.items).toBe(items);
    });
  });
});

describe('Priority Logic Integration Scenarios', () => {
  it('should correctly model adding first priority item', () => {
    // Start with 0 priority items
    const beforeStatus = getPriorityStatus([]);
    expect(beforeStatus.isFull).toBe(false);

    // Check if we can add
    const canAdd = canAddPriority(beforeStatus.count);
    expect(canAdd.canAdd).toBe(true);

    // Validate the toggle
    const validation = validatePriorityToggle(beforeStatus.count, false);
    expect(validation.allowed).toBe(true);
  });

  it('should correctly model reaching the limit', () => {
    // Start with 4 priority items
    const currentItems = ['c1', 'c2', 'c3', 'c4'];
    const beforeStatus = getPriorityStatus(currentItems);
    expect(beforeStatus.remaining).toBe(1);

    // Can still add one more
    const canAdd = canAddPriority(beforeStatus.count);
    expect(canAdd.canAdd).toBe(true);

    // After adding, should be full
    const afterItems = [...currentItems, 'c5'];
    const afterStatus = getPriorityStatus(afterItems);
    expect(afterStatus.isFull).toBe(true);
    expect(afterStatus.remaining).toBe(0);

    // Cannot add more
    const canAddMore = canAddPriority(afterStatus.count);
    expect(canAddMore.canAdd).toBe(false);
  });

  it('should correctly model removing priority when full', () => {
    // Start with 5 priority items (full)
    const fullItems = ['c1', 'c2', 'c3', 'c4', 'c5'];
    const fullStatus = getPriorityStatus(fullItems);
    expect(fullStatus.isFull).toBe(true);

    // Should be able to toggle off
    const validation = validatePriorityToggle(fullStatus.count, true);
    expect(validation.allowed).toBe(true);

    // After removing one, should have room
    const afterItems = fullItems.slice(0, 4);
    const afterStatus = getPriorityStatus(afterItems);
    expect(afterStatus.isFull).toBe(false);
    expect(afterStatus.remaining).toBe(1);
  });
});
