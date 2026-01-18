"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import {
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserGroupIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type AuthMode = "signIn" | "signUp";
type AccountType = "family" | "individual" | null;
type SignUpStep = "account-type" | "credentials";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
  ];
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter((r) => r.met).length;

  if (metCount === 0) return { label: "", color: "bg-gray-200", width: "w-0" };
  if (metCount === 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (metCount === 2) return { label: "Fair", color: "bg-orange-500", width: "w-2/4" };
  if (metCount === 3) return { label: "Good", color: "bg-yellow-500", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}
          />
        </div>
        {strength.label && (
          <span className={`text-xs font-medium ${
            strength.label === "Strong" ? "text-green-600" :
            strength.label === "Good" ? "text-yellow-600" :
            strength.label === "Fair" ? "text-orange-600" : "text-red-600"
          }`}>
            {strength.label}
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            )}
            <span className={req.met ? "text-green-600" : "text-gray-500"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google sign-in failed";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? "Please wait..." : "Sign up with Google"}
          </button>

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
            {mode === "signUp" && <PasswordStrengthIndicator password={password} />}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-kid-primary to-kid-secondary hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-opacity"
          >
            {loading
              ? "Please wait..."
              : mode === "signIn"
                ? "Sign In"
                : "Create Account"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading
              ? "Please wait..."
              : mode === "signIn"
                ? "Sign in with Google"
                : "Sign up with Google"}
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
