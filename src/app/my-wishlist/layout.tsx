import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | CardDex',
  description:
    'Manage your trading card wishlist in CardDex. Add cards you want, share your list with family and friends, and track what you need for your collection.',
};

export default function MyWishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
