import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SeriesFilter, type SeriesFilterValue } from '../SeriesFilter';

describe('SeriesFilter', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all filter options', () => {
    render(<SeriesFilter value="all" onChange={mockOnChange} />);

    expect(screen.getByText('All Sets')).toBeInTheDocument();
    expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
    expect(screen.getByText('Sword & Shield')).toBeInTheDocument();
  });

  it('highlights the selected option', () => {
    render(<SeriesFilter value="Scarlet & Violet" onChange={mockOnChange} />);

    const svButton = screen.getByText('Scarlet & Violet').closest('button');
    const allButton = screen.getByText('All Sets').closest('button');

    expect(svButton).toHaveAttribute('aria-pressed', 'true');
    expect(allButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when a filter is clicked', () => {
    render(<SeriesFilter value="all" onChange={mockOnChange} />);

    fireEvent.click(screen.getByText('Scarlet & Violet'));

    expect(mockOnChange).toHaveBeenCalledWith('Scarlet & Violet');
  });

  it('displays set counts when provided', () => {
    const setCounts: Record<SeriesFilterValue, number> = {
      all: 45,
      'Scarlet & Violet': 20,
      'Sword & Shield': 25,
    };

    render(<SeriesFilter value="all" onChange={mockOnChange} setCounts={setCounts} />);

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('does not display counts when not provided', () => {
    render(<SeriesFilter value="all" onChange={mockOnChange} />);

    // Should only have the label text, no count badges
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const text = button.textContent || '';
      // Should not contain any numbers
      expect(text).not.toMatch(/\d+/);
    });
  });

  it('allows switching between all filter options', () => {
    render(<SeriesFilter value="all" onChange={mockOnChange} />);

    // Click Sword & Shield
    fireEvent.click(screen.getByText('Sword & Shield'));
    expect(mockOnChange).toHaveBeenCalledWith('Sword & Shield');

    mockOnChange.mockClear();

    // Click All Sets
    fireEvent.click(screen.getByText('All Sets'));
    expect(mockOnChange).toHaveBeenCalledWith('all');
  });
});
