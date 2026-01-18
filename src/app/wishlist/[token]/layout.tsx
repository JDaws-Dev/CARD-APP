import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Wishlist | CardDex',
  description:
    'View this collectors trading card wishlist on CardDex. Help them complete their collection by choosing the perfect trading card gift from their wishlist.',
};

export default function SharedWishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
