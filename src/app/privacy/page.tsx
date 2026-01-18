'use client';

import {
  ShieldCheckIcon,
  UserGroupIcon,
  LockClosedIcon,
  EyeSlashIcon,
  TrashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import { BackLink } from '@/components/ui/BackLink';

export default function PrivacyPage() {
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
              <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          </div>
          <p className="text-gray-600 dark:text-slate-400">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-slate-300">
              At CardDex, we take your privacy seriously, especially when it comes to protecting
              children. This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our trading card collection tracking service.
            </p>
          </section>

          {/* COPPA Compliance */}
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20">
            <div className="mb-3 flex items-center gap-2">
              <UserGroupIcon
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                COPPA Compliance
              </h2>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300">
              CardDex is designed with families in mind. We comply with the Children&apos;s Online
              Privacy Protection Act (COPPA) and do not knowingly collect personal information from
              children under 13 without verifiable parental consent.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-slate-300">
              <li>
                <strong>Account Information:</strong> Email address and password for account
                creation
              </li>
              <li>
                <strong>Profile Information:</strong> Display name and optional avatar preferences
              </li>
              <li>
                <strong>Collection Data:</strong> Information about trading cards you add to your
                collection
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our app to improve your
                experience
              </li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <EyeSlashIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-slate-300">
              <li>To provide and maintain our collection tracking service</li>
              <li>To sync your collection across devices</li>
              <li>To generate shareable wishlists for family members</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate important updates about your account</li>
            </ul>
          </section>

          {/* What We Don't Do */}
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-900/20">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheckIcon
                className="h-5 w-5 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-300">
                What We Don&apos;t Do
              </h2>
            </div>
            <ul className="list-inside list-disc space-y-2 text-rose-700 dark:text-rose-300">
              <li>We never sell your personal information</li>
              <li>We never show ads to children</li>
              <li>We never share your collection data with third parties for marketing</li>
              <li>We never send children&apos;s names or personal info to AI services</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data Retention & Deletion
              </h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              You can request deletion of your account and all associated data at any time by
              contacting us. We will process your request within 30 days. Collection data is
              automatically deleted when you delete your account.
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Us</h2>
            </div>
            <p className="text-gray-700 dark:text-slate-300">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at{' '}
              <a
                href="mailto:privacy@carddex.app"
                className="font-medium text-kid-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
              >
                privacy@carddex.app
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
