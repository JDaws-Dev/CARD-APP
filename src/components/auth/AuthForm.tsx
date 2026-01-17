"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import {
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type AuthMode = "signIn" | "signUp";
type AccountType = "family" | "individual" | null;
type SignUpStep = "account-type" | "credentials";

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export function AuthForm({ defaultMode = "signIn" }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("account-type");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn("password", {
        email,
        password,
        flow: mode,
        // Pass account type to backend for profile creation
        ...(mode === "signUp" && accountType ? { accountType } : {}),
      });
      // If signup succeeded without redirect, show verification pending
      if (mode === "signUp") {
        setVerificationPending(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      // Check if error indicates email verification is needed
      if (
        errorMessage.toLowerCase().includes("verify") ||
        errorMessage.toLowerCase().includes("verification")
      ) {
        setVerificationPending(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setSignUpStep("credentials");
  };

  const handleBackToAccountType = () => {
    setSignUpStep("account-type");
    setError(null);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError(null);

    try {
      // Attempt to sign in again to trigger verification email resend
      await signIn("password", {
        email,
        password,
        flow: "signUp",
      });
      setResendSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch {
      // Expected to fail if email needs verification, but email should be resent
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } finally {
      setResendLoading(false);
    }
  };

  // Verification pending UI
  if (verificationPending) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-kid-primary to-kid-secondary rounded-full flex items-center justify-center mb-4">
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-gray-900">{email}</span>. Please
              check your inbox and click the link to verify your account.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                Don&apos;t see the email? Check your spam folder or click below
                to resend.
              </p>
            </div>

            {resendSuccess && (
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Verification email sent!
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-kid-primary to-kid-secondary hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2"
              >
                {resendLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setVerificationPending(false);
                  setMode("signIn");
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account type selection step for signup
  if (mode === "signUp" && signUpStep === "account-type") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 text-center mb-6">
            How will you be using CardDex?
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleAccountTypeSelect("family")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-kid-primary hover:bg-kid-primary/5 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-kid-primary transition-colors">
                    Family Account
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage collections for your kids. Create separate profiles, set parental controls, and track their progress.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAccountTypeSelect("individual")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-kid-secondary hover:bg-kid-secondary/5 transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-kid-secondary to-purple-500 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-kid-secondary transition-colors">
                    Individual Collector
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track your own collection. Perfect for solo collectors who want to organize their cards.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode("signIn")}
              className="text-kid-primary hover:text-kid-primary/80 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {mode === "signIn" ? "Welcome Back!" : "Create Account"}
        </h2>

        {mode === "signUp" && accountType && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {accountType === "family" ? (
                <UserGroupIcon className="w-5 h-5 text-kid-primary" />
              ) : (
                <UserIcon className="w-5 h-5 text-kid-secondary" />
              )}
              <span className="text-sm text-gray-700">
                {accountType === "family" ? "Family Account" : "Individual Collector"}
              </span>
            </div>
            <button
              onClick={handleBackToAccountType}
              className="text-sm text-kid-primary hover:text-kid-primary/80 font-medium"
            >
              Change
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-kid-primary focus:border-transparent transition-colors"
              placeholder={accountType === "family" ? "parent@example.com" : "collector@example.com"}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-kid-primary focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-kid-primary to-kid-secondary hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-opacity"
          >
            {loading
              ? "Please wait..."
              : mode === "signIn"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              if (mode === "signIn") {
                setSignUpStep("account-type");
                setAccountType(null);
              }
            }}
            className="text-kid-primary hover:text-kid-primary/80 text-sm font-medium"
          >
            {mode === "signIn"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
