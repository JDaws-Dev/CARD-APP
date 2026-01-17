import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader, PageHeaderSkeleton } from '../PageHeader';
import { Cog6ToothIcon, TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Settings" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Settings" description="Customize your experience" />);

    expect(screen.getByText('Customize your experience')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Settings" />);

    // Only the title should be in the text content div
    const textContent = container.querySelector('h1');
    expect(textContent?.nextElementSibling).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<PageHeader title="Settings" icon={Cog6ToothIcon} />);

    // Icon should be rendered with aria-hidden
    const iconContainer = screen.getByRole('heading').parentElement?.previousElementSibling;
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    expect(iconContainer).toHaveClass('rounded-xl');
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<PageHeader title="Settings" />);

    // Should not have any gradient background div
    const gradientDiv = container.querySelector('.from-kid-primary');
    expect(gradientDiv).toBeNull();
  });

  it('applies correct gradient preset classes', () => {
    const { rerender, container } = render(
      <PageHeader title="Settings" icon={Cog6ToothIcon} gradient="amber" />
    );

    let iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toHaveClass('from-amber-400', 'to-orange-500');

    rerender(<PageHeader title="Settings" icon={Cog6ToothIcon} gradient="purple" />);
    iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toHaveClass('from-purple-500', 'to-indigo-500');

    rerender(<PageHeader title="Settings" icon={Cog6ToothIcon} gradient="slate" />);
    iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toHaveClass('from-slate-500', 'to-slate-700');
  });

  it('applies default gradient when no gradient prop is specified', () => {
    const { container } = render(<PageHeader title="Settings" icon={Cog6ToothIcon} />);

    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toHaveClass('from-kid-primary', 'to-kid-secondary');
  });

  it('applies custom gradient classes when provided', () => {
    const { container } = render(
      <PageHeader title="Settings" icon={Cog6ToothIcon} customGradient="from-red-500 to-blue-500" />
    );

    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toHaveClass('from-red-500', 'to-blue-500');
  });

  it('customGradient overrides gradient preset', () => {
    const { container } = render(
      <PageHeader
        title="Settings"
        icon={Cog6ToothIcon}
        gradient="amber"
        customGradient="from-red-500 to-blue-500"
      />
    );

    const iconContainer = container.querySelector('[aria-hidden="true"]');
    // Should have custom gradient, not amber gradient
    expect(iconContainer).toHaveClass('from-red-500', 'to-blue-500');
    expect(iconContainer).not.toHaveClass('from-amber-400');
  });

  it('renders actions when provided', () => {
    render(<PageHeader title="My Collection" actions={<button type="button">Add Cards</button>} />);

    expect(screen.getByRole('button', { name: 'Add Cards' })).toBeInTheDocument();
  });

  it('does not render actions container when actions not provided', () => {
    const { container } = render(<PageHeader title="Settings" />);

    // Should only have one direct child div (the title/icon area)
    const mainContainer = container.firstElementChild;
    const childDivs = mainContainer?.children;
    expect(childDivs?.length).toBe(1);
  });

  it('applies custom className', () => {
    const { container } = render(<PageHeader title="Settings" className="custom-class" />);

    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('renders in compact size correctly', () => {
    render(<PageHeader title="Search Results" size="compact" icon={TrophyIcon} />);

    // Check for compact spacing class
    const container = screen.getByRole('heading').closest('.mb-4');
    expect(container).toBeInTheDocument();
  });

  it('renders in default size correctly', () => {
    render(<PageHeader title="Settings" size="default" icon={TrophyIcon} />);

    // Check for default spacing class
    const container = screen.getByRole('heading').closest('.mb-8');
    expect(container).toBeInTheDocument();
  });

  it('uses default size when size prop is not specified', () => {
    render(<PageHeader title="Settings" icon={TrophyIcon} />);

    // Should have default (mb-8) spacing
    const container = screen.getByRole('heading').closest('.mb-8');
    expect(container).toBeInTheDocument();
  });

  it('renders with different icons correctly', () => {
    const { rerender, container } = render(
      <PageHeader title="Badges" icon={TrophyIcon} gradient="amber" />
    );

    let iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();

    rerender(<PageHeader title="Calendar" icon={CalendarDaysIcon} gradient="orange" />);
    iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });
});

describe('PageHeaderSkeleton', () => {
  it('renders icon placeholder by default', () => {
    const { container } = render(<PageHeaderSkeleton />);

    // Should have an animated skeleton for icon
    const iconSkeleton = container.querySelector('.rounded-xl.animate-pulse');
    expect(iconSkeleton).toBeInTheDocument();
    expect(iconSkeleton).toHaveClass('h-12', 'w-12');
  });

  it('hides icon placeholder when showIcon is false', () => {
    const { container } = render(<PageHeaderSkeleton showIcon={false} />);

    // Should not have rounded-xl animated element
    const iconSkeleton = container.querySelector('.rounded-xl.animate-pulse');
    expect(iconSkeleton).toBeNull();
  });

  it('renders description placeholder by default', () => {
    const { container } = render(<PageHeaderSkeleton />);

    // Should have two skeleton divs (title and description)
    const skeletons = container.querySelectorAll('.animate-pulse.rounded');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('hides description placeholder when showDescription is false', () => {
    const { container } = render(<PageHeaderSkeleton showDescription={false} />);

    // Should only have one text skeleton (the title)
    const textContainer = container.querySelector('.mb-8 > div:last-child');
    const textSkeletons = textContainer?.querySelectorAll('.animate-pulse.rounded');
    expect(textSkeletons?.length).toBe(1);
  });

  it('applies custom className', () => {
    const { container } = render(<PageHeaderSkeleton className="custom-skeleton-class" />);

    expect(container.firstElementChild).toHaveClass('custom-skeleton-class');
  });

  it('has correct skeleton dimensions', () => {
    const { container } = render(<PageHeaderSkeleton />);

    // Title skeleton
    const titleSkeleton = container.querySelector('.h-8.w-48');
    expect(titleSkeleton).toBeInTheDocument();

    // Description skeleton
    const descSkeleton = container.querySelector('.h-4.w-64');
    expect(descSkeleton).toBeInTheDocument();
  });
});

describe('GradientPreset types', () => {
  it('supports all documented gradient presets', () => {
    const presets = [
      'default',
      'amber',
      'purple',
      'indigo',
      'orange',
      'emerald',
      'rose',
      'cyan',
      'slate',
    ] as const;

    presets.forEach((preset) => {
      const { container, unmount } = render(
        <PageHeader title="Test" icon={Cog6ToothIcon} gradient={preset} />
      );

      // Each preset should render without errors and have a gradient
      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('bg-gradient-to-br');
      unmount();
    });
  });
});
