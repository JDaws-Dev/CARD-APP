/**
 * KidCollect Type Definitions
 */

// =============================================================================
// USER & FAMILY
// =============================================================================

export interface Family {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'family';
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
}

export interface Profile {
  id: string;
  familyId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

// =============================================================================
// COLLECTION
// =============================================================================

export interface CollectionCard {
  id: string;
  profileId: string;
  cardId: string;
  quantity: number;
  addedAt: Date;
}

export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  setsStarted: number;
  setsCompleted: number;
}

export interface SetProgress {
  setId: string;
  setName: string;
  collected: number;
  total: number;
  percentage: number;
}

// =============================================================================
// WISHLIST
// =============================================================================

export interface WishlistCard {
  id: string;
  profileId: string;
  cardId: string;
  isPriority: boolean;
  addedAt: Date;
}

export interface WishlistShare {
  id: string;
  profileId: string;
  shareToken: string;
  createdAt: Date;
  expiresAt: Date | null;
}

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

export type AchievementType =
  | 'set_completion'
  | 'collector_milestone'
  | 'type_specialist'
  | 'pokemon_fan'
  | 'streak';

export interface Achievement {
  id: string;
  profileId: string;
  achievementType: AchievementType;
  achievementKey: string;
  achievementData: Record<string, unknown> | null;
  earnedAt: Date;
}

export interface AchievementDefinition {
  key: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}

// =============================================================================
// ACTIVITY
// =============================================================================

export type ActivityAction = 'card_added' | 'card_removed' | 'achievement_earned';

export interface ActivityLog {
  id: string;
  profileId: string;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// =============================================================================
// UI STATE
// =============================================================================

export interface CardWithOwnership {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  imageSmall: string;
  imageLarge: string;
  owned: boolean;
  quantity: number;
  onWishlist: boolean;
  isPriority: boolean;
}
