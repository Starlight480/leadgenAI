"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-text-muted mb-10">
          Last updated: July 2026
        </p>

        {/* Content */}
        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LeadGen OS (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service. If you do not agree, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">2. Acceptable Use</h2>
            <p className="mb-2">You agree to use the Service only for lawful purposes. You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service to send unsolicited bulk communications (spam)</li>
              <li>Attempt to gain unauthorised access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use automated scripts or bots to interact with the Service in unintended ways</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">3. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You must notify us immediately if you become aware of any unauthorised use of your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">4. Data Collection</h2>
            <p className="mb-2">The Service collects and processes data you provide, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contact information and lead details you enter</li>
              <li>Campaign and outreach data</li>
              <li>Usage analytics to improve the Service</li>
            </ul>
            <p className="mt-2">
              We do not sell your data to third parties. Data is stored securely and used solely
              to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by
              LeadGen OS and are protected by international copyright, trademark, patent, trade
              secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, LeadGen OS shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages resulting from
              your use of or inability to use the Service. The Service is provided &quot;as is&quot;
              without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time,
              without prior notice, for conduct that we determine violates these Terms or is
              harmful to other users or the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">9. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us through the LeadGen OS
              platform.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border-default">
          <p className="text-[11px] text-text-muted">v0.1.0 — 2026</p>
        </div>
      </div>
    </div>
  )
}
