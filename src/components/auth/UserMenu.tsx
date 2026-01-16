"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export function UserMenu() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      <span className="text-sm font-medium">Sign Out</span>
    </button>
  );
}
