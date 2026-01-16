'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OnboardingFlow } from '@/components/onboarding';
import { hasCompletedOnboarding } from '@/lib/onboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();

  // Check if user has already completed onboarding
  useEffect(() => {
    if (hasCompletedOnboarding()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <OnboardingFlow
      onComplete={() => {
        router.push('/dashboard');
      }}
    />
  );
}
