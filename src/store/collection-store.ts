import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectionCard, WishlistCard, SetProgress } from '@/types';

interface CollectionState {
  // Current profile
  currentProfileId: string | null;
  setCurrentProfile: (profileId: string | null) => void;

  // Collection data (local cache)
  collectionCards: Map<string, CollectionCard>;
  wishlistCards: Map<string, WishlistCard>;

  // Actions
  addCard: (cardId: string, quantity?: number) => void;
  removeCard: (cardId: string) => void;
  updateQuantity: (cardId: string, quantity: number) => void;
  isCardOwned: (cardId: string) => boolean;
  getCardQuantity: (cardId: string) => number;

  // Wishlist actions
  addToWishlist: (cardId: string, isPriority?: boolean) => void;
  removeFromWishlist: (cardId: string) => void;
  togglePriority: (cardId: string) => void;
  isOnWishlist: (cardId: string) => boolean;

  // Stats
  getTotalCards: () => number;
  getUniqueCards: () => number;

  // Sync
  syncFromServer: (cards: CollectionCard[], wishlist: WishlistCard[]) => void;
  clearLocalData: () => void;
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      currentProfileId: null,
      collectionCards: new Map(),
      wishlistCards: new Map(),

      setCurrentProfile: (profileId) => set({ currentProfileId: profileId }),

      addCard: (cardId, quantity = 1) => {
        const { collectionCards, currentProfileId } = get();
        if (!currentProfileId) return;

        const existing = collectionCards.get(cardId);
        const newCard: CollectionCard = existing
          ? { ...existing, quantity: existing.quantity + quantity }
          : {
              id: crypto.randomUUID(),
              profileId: currentProfileId,
              cardId,
              quantity,
              addedAt: new Date(),
            };

        const newMap = new Map(collectionCards);
        newMap.set(cardId, newCard);
        set({ collectionCards: newMap });

        // TODO: Sync to server
      },

      removeCard: (cardId) => {
        const { collectionCards } = get();
        const newMap = new Map(collectionCards);
        newMap.delete(cardId);
        set({ collectionCards: newMap });

        // TODO: Sync to server
      },

      updateQuantity: (cardId, quantity) => {
        const { collectionCards } = get();
        const existing = collectionCards.get(cardId);
        if (!existing) return;

        if (quantity <= 0) {
          get().removeCard(cardId);
          return;
        }

        const newMap = new Map(collectionCards);
        newMap.set(cardId, { ...existing, quantity });
        set({ collectionCards: newMap });

        // TODO: Sync to server
      },

      isCardOwned: (cardId) => {
        return get().collectionCards.has(cardId);
      },

      getCardQuantity: (cardId) => {
        return get().collectionCards.get(cardId)?.quantity ?? 0;
      },

      addToWishlist: (cardId, isPriority = false) => {
        const { wishlistCards, currentProfileId } = get();
        if (!currentProfileId) return;

        const newCard: WishlistCard = {
          id: crypto.randomUUID(),
          profileId: currentProfileId,
          cardId,
          isPriority,
          addedAt: new Date(),
        };

        const newMap = new Map(wishlistCards);
        newMap.set(cardId, newCard);
        set({ wishlistCards: newMap });

        // TODO: Sync to server
      },

      removeFromWishlist: (cardId) => {
        const { wishlistCards } = get();
        const newMap = new Map(wishlistCards);
        newMap.delete(cardId);
        set({ wishlistCards: newMap });

        // TODO: Sync to server
      },

      togglePriority: (cardId) => {
        const { wishlistCards } = get();
        const existing = wishlistCards.get(cardId);
        if (!existing) return;

        const newMap = new Map(wishlistCards);
        newMap.set(cardId, { ...existing, isPriority: !existing.isPriority });
        set({ wishlistCards: newMap });

        // TODO: Sync to server
      },

      isOnWishlist: (cardId) => {
        return get().wishlistCards.has(cardId);
      },

      getTotalCards: () => {
        let total = 0;
        get().collectionCards.forEach((card) => {
          total += card.quantity;
        });
        return total;
      },

      getUniqueCards: () => {
        return get().collectionCards.size;
      },

      syncFromServer: (cards, wishlist) => {
        const cardMap = new Map<string, CollectionCard>();
        cards.forEach((card) => cardMap.set(card.cardId, card));

        const wishlistMap = new Map<string, WishlistCard>();
        wishlist.forEach((card) => wishlistMap.set(card.cardId, card));

        set({ collectionCards: cardMap, wishlistCards: wishlistMap });
      },

      clearLocalData: () => {
        set({
          currentProfileId: null,
          collectionCards: new Map(),
          wishlistCards: new Map(),
        });
      },
    }),
    {
      name: 'kidcollect-collection',
      // Custom serialization for Maps
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              collectionCards: new Map(parsed.state.collectionCards || []),
              wishlistCards: new Map(parsed.state.wishlistCards || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              collectionCards: Array.from(value.state.collectionCards.entries()),
              wishlistCards: Array.from(value.state.wishlistCards.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
