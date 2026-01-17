'use client';

import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthForm } from '@/components/auth';
import { hasCompletedOnboarding } from '@/lib/onboardingFlow';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect authenticated users: to dashboard if already onboarded, otherwise to onboarding
      if (hasCompletedOnboarding()) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-kid-primary/10 to-kid-secondary/10">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-kid-primary border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-kid-primary/10 to-kid-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-4xl font-bold text-transparent">
            CardDex
          </h1>
          <p className="text-gray-600">Track your trading card collection</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
