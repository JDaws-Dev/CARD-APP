import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a random share token for wishlists
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format a number with commas (e.g., 1,234)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Calculate collection progress percentage
 */
export function calculateProgress(collected: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((collected / total) * 100);
}

/**
 * Get progress milestone (25%, 50%, 75%, 100%)
 */
export function getProgressMilestone(percentage: number): number | null {
  if (percentage >= 100) return 100;
  if (percentage >= 75) return 75;
  if (percentage >= 50) return 50;
  if (percentage >= 25) return 25;
  return null;
}
