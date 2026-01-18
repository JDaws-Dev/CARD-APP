'use client';

import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ScaleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import { BackLink } from '@/components/ui/BackLink';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-24 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <BackLink href="/" className="mb-6" aria-label="Back to Home">
          Back to Home
        </BackLink>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-kid-secondary shadow-md">
              <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          </div>
          <p className="text-gray-600 dark:text-slate-400">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-slate-300">
              Welcome to CardDex! These Terms of Service govern your use of our trading card
              collection tracking service. By using CardDex, you agree to these terms. Please read
              them carefully.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Acceptance of Terms
              </h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              By creating an account or using CardDex, you agree to be bound by these Terms of
              Service and our Privacy Policy. If you do not agree to these terms, please do not use
              our service.
            </p>
          </section>

          {/* Age Requirements */}
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div className="mb-3 flex items-center gap-2">
              <UserGroupIcon
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                Age Requirements
              </h2>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300">
              CardDex is designed for families. Children under 13 may use CardDex only with
              verifiable parental consent through a parent account. Parents are responsible for
              supervising their children&apos;s use of the service and managing their child
              profiles.
            </p>
          </section>

          {/* Account Responsibilities */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ScaleIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Responsibilities
              </h2>
            </div>
            <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-slate-300">
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate information when creating your account</li>
              <li>You may not share your account credentials with others</li>
              <li>
                Parents are responsible for all activity on child profiles under their account
              </li>
              <li>You must notify us immediately of any unauthorized account access</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Acceptable Use
              </h2>
            </div>
            <p className="mb-3 text-gray-700 dark:text-slate-300">
              CardDex is intended for personal, non-commercial use to track your trading card
              collections. You agree to:
            </p>
            <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-slate-300">
              <li>Use the service only for its intended purpose</li>
              <li>Not attempt to access other users&apos; accounts or data</li>
              <li>Not use the service to conduct any illegal activities</li>
              <li>Not upload harmful content or attempt to disrupt the service</li>
              <li>Respect the intellectual property rights of card publishers</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                Intellectual Property Notice
              </h2>
            </div>
            <p className="text-amber-700 dark:text-amber-300">
              Trading card images, names, and related content are the property of their respective
              publishers (The Pokemon Company, Konami, etc.). CardDex displays this content for
              collection tracking purposes only. CardDex and its original content are protected by
              copyright and other intellectual property laws.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Service Availability
              </h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              We strive to keep CardDex available at all times, but we do not guarantee
              uninterrupted access. We may modify, suspend, or discontinue features with reasonable
              notice. We are not liable for any data loss that may occur, though we make reasonable
              efforts to protect your collection data.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ScaleIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Limitation of Liability
              </h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              CardDex is provided &quot;as is&quot; without warranties of any kind. We are not
              responsible for the accuracy of card prices, which are provided for informational
              purposes only and should not be relied upon for buying, selling, or trading decisions.
              Our liability is limited to the maximum extent permitted by law.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Changes to Terms
              </h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              We may update these Terms of Service from time to time. We will notify you of
              significant changes via email or through the app. Continued use of CardDex after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Us</h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a
                href="mailto:legal@carddex.app"
                className="font-medium text-kid-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
              >
                legal@carddex.app
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
