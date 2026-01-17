"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/components/auth";

export default function SignupPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kid-primary/10 to-kid-secondary/10">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-kid-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-kid-primary/10 to-kid-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-transparent mb-2">
            CardDex
          </h1>
          <p className="text-gray-600">Start tracking your trading card collection</p>
        </div>
        <AuthForm defaultMode="signUp" />
      </div>
    </div>
  );
}
