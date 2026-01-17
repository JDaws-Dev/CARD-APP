import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb', () => {
  it('renders nothing when items array is empty', () => {
    const { container } = render(<Breadcrumb items={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumb items correctly', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Learn', href: '/learn' },
          { label: 'Condition Guide' },
        ]}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Condition Guide')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Learn', href: '/learn' },
          { label: 'Current Page' },
        ]}
      />
    );

    const homeLink = screen.getByRole('link', { name: /Home/ });
    const learnLink = screen.getByRole('link', { name: /Learn/ });

    expect(homeLink).toHaveAttribute('href', '/dashboard');
    expect(learnLink).toHaveAttribute('href', '/learn');
  });

  it('does not render link for last item without href', () => {
    render(
      <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Current Page' }]} />
    );

    // The last item should not be a link
    expect(screen.queryByRole('link', { name: /Current Page/ })).toBeNull();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('marks the last item with aria-current="page"', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Current Page' }]} />
    );

    const currentPage = container.querySelector('[aria-current="page"]');
    expect(currentPage).toBeInTheDocument();
    expect(currentPage).toHaveTextContent('Current Page');
  });

  it('renders navigation with proper aria-label', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Page' }]} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders separator icons between items', () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Middle', href: '/middle' },
          { label: 'End' },
        ]}
      />
    );

    // Should have 2 separator icons (between 3 items)
    const separators = container.querySelectorAll('li[aria-hidden="true"]');
    expect(separators.length).toBe(2);
  });

  it('renders home icon on first item by default', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
    );

    // Check for HomeIcon (should be aria-hidden)
    const firstListItem = container.querySelector('ol > li:first-child');
    const homeIcon = firstListItem?.querySelector('svg[aria-hidden="true"]');
    expect(homeIcon).toBeInTheDocument();
    expect(homeIcon).toHaveClass('h-4', 'w-4');
  });

  it('hides home icon when showHomeIcon is false', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: 'Browse Sets', href: '/sets' }, { label: 'Set Name' }]}
        showHomeIcon={false}
      />
    );

    // First item should not have the HomeIcon
    const firstListItem = container.querySelector('ol > li:first-child');
    // Only the chevron separator should have svg, not the first item's link
    const linkIcon = firstListItem?.querySelector('a > svg');
    expect(linkIcon).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Page' }]}
        className="custom-breadcrumb-class"
      />
    );

    expect(container.querySelector('nav')).toHaveClass('custom-breadcrumb-class');
  });

  it('renders single item correctly', () => {
    render(<Breadcrumb items={[{ label: 'Home' }]} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    // No separators for single item
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders items with only hrefs (no current page marker)', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Parent', href: '/parent' },
        ]}
      />
    );

    // Both should be links
    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parent/ })).toBeInTheDocument();
  });

  it('applies correct styling classes to links', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />);

    const homeLink = screen.getByRole('link', { name: /Home/ });
    expect(homeLink).toHaveClass('text-gray-500', 'hover:text-kid-primary');
  });

  it('applies correct styling to current page', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current Page' }]} />
    );

    const currentPage = container.querySelector('[aria-current="page"]');
    expect(currentPage).toHaveClass('text-gray-900');
  });

  it('has proper list structure for accessibility', () => {
    render(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />);

    // Should have an ordered list
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');

    // Should have list items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });
});
