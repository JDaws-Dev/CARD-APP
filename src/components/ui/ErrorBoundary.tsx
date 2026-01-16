'use client';

import { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a user-friendly error message with retry functionality.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
  title?: string;
  message?: string;
}

/**
 * User-friendly error display component.
 * Can be used as ErrorBoundary fallback or standalone for API errors.
 */
export function ErrorFallback({ error, onReset, title, message }: ErrorFallbackProps) {
  const displayTitle = title || 'Something went wrong';
  const displayMessage =
    message || error?.message || "We couldn't load this content. Please try again.";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-gray-800">{displayTitle}</h2>
      <p className="mb-6 max-w-md text-center text-gray-500">{displayMessage}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Try Again
        </button>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Compact inline error message for use within components.
 */
export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 ${className || ''}`}>
      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-500" />
      <span className="flex-1 text-sm text-red-700">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}
