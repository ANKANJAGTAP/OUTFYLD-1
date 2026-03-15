'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Careers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          <p className="text-gray-600 mt-2">Internship Program Agreement</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-5 text-sm">
          
          {/* Introduction */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Outfyld. By registering for any internship offered on our website and by paying the 
              processing & certificate fee of ₹249, you agree to these Terms & Conditions.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              These terms ensure smooth functioning of our internship programs and compliance with applicable 
              Indian laws.
            </p>
          </section>

          {/* Nature of Service */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Nature of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Outfyld provides online internships, which include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Learning materials</li>
              <li>Internship tasks / projects</li>
              <li>Mail support</li>
              <li>Completion certificate (digital PDF)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              No physical job placement or guaranteed employment is promised.
            </p>
          </section>

          {/* Fees & Payments */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Fees & Payments</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>A ₹249 processing & certificate generation fee is charged at registration.</li>
              <li>Payments are collected securely via Razorpay or similar payment gateways.</li>
              <li>The fee covers administrative processing, access to internship materials, evaluation, and certificate generation.</li>
              <li>Outfyld does not charge any hidden fees.</li>
            </ul>
          </section>

          {/* Internship Eligibility */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Internship Eligibility</h2>
            <p className="text-gray-700 leading-relaxed mb-2">Participants must:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Provide accurate registration details</li>
              <li>Be at least 16 years old</li>
              <li>Agree not to misuse or redistribute provided materials</li>
              <li>Complete required tasks ethically</li>
            </ul>
          </section>

          {/* Certificate Policy */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Certificate Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              A digital certificate will be issued only after successful completion of the required tasks.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">Certificates:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Are delivered by email</li>
              <li>Are intended solely for academic & skill-building purposes</li>
              <li>Do not guarantee job placement or employment</li>
            </ul>
          </section>

          {/* Refund & Cancellation */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Refund & Cancellation</h2>
            <p className="text-gray-700 leading-relaxed mb-2 font-semibold">
              The ₹249 processing & certificate fee is strictly NON-REFUNDABLE under all circumstances.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">This includes (but is not limited to) situations where:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>The participant changes their mind</li>
              <li>The participant does not complete tasks</li>
              <li>The participant is unable to continue the internship</li>
              <li>The participant violated the Terms & Conditions</li>
              <li>Technical issues related to the participant&apos;s device or internet</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              By completing the payment, the participant fully accepts that the internship fee is non-refundable 
              and non-transferable.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Outfyld does not offer cancellations, returns, partial refunds, or fee adjustments.
            </p>
          </section>

          {/* Participant Obligations */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Participant Obligations</h2>
            <p className="text-gray-700 leading-relaxed mb-2">Participants must NOT:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Submit fraudulent or plagiarized work</li>
              <li>Abuse or harass mentors or support staff</li>
              <li>Misuse or misrepresent the certificate</li>
              <li>Use Outfyld&apos;s name for illegal or misleading activities</li>
              <li>Share course files or login materials publicly</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Violation may lead to termination without refund.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content, materials, tasks, branding, logos, and website elements belong to Outfyld. 
              Participants may use them only for personal learning.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Redistribution, resale, or republishing is strictly prohibited.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Disclaimer</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Internships are for learning and experience, not employment.</li>
              <li>Outfyld does not guarantee job placement or offers.</li>
              <li>Outfyld is not responsible for losses arising from device issues, internet failure, or participant negligence.</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Outfyld&apos;s liability is strictly limited to the amount paid (₹249).
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              We are not responsible for indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* Third-Party Tools & Services */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Third-Party Tools & Services</h2>
            <p className="text-gray-700 leading-relaxed mb-2">We use third-party tools such as:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Razorpay (for payments)</li>
              <li>Email service providers</li>
              <li>Analytics tools</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              Their respective terms apply where relevant.
            </p>
          </section>

          {/* Startup Support Clarification */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">12. Startup Support Clarification</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              Outfyld is a student-led startup, and the ₹249 processing & certificate fee helps us cover essential 
              operational and developmental costs, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Platform development</li>
              <li>Course material creation</li>
              <li>Mentor support</li>
              <li>Certificate generation</li>
              <li>Internship program improvements</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              This fee is not a donation, crowdfunding activity, or fundraising request. 
              It is a standard service fee charged in exchange for valuable learning benefits.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2 mb-2">
              In return for this fee, every participant receives:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access to internship tasks</li>
              <li>Learning materials</li>
              <li>Evaluation & feedback (where applicable)</li>
              <li>A digital completion certificate</li>
              <li>A structured skill-building experience</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              This ensures the fee remains industry-standard, transparent, ethical, and compliant with Indian 
              consumer protection guidelines.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">13. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Outfyld may update or modify these Terms at any time.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Continued use of the internship services signifies acceptance of the updated Terms.
            </p>
          </section>

          {/* Stipend Clarification */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">14. Stipend Clarification</h2>
            <p className="text-gray-700 leading-relaxed mb-2 font-semibold">
              Outfyld does not guarantee any stipend, salary, or monetary compensation as part of the internship program.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              Any mention of stipend is purely for promotional or motivational purposes to encourage learning interest, 
              and should not be interpreted as an assured payment or financial benefit.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              We are a very small student-led startup, and currently we are not in a position to provide stipends to 
              interns. Participants enrolling in the internship acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>The internship is unpaid.</li>
              <li>The ₹249 fee is only for processing, training access, and certificate generation, not for stipend distribution.</li>
              <li>Outfyld shall not be liable for expectations of monetary rewards, payouts, or financial incentives.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2 font-semibold">
              By enrolling and making the payment, participants fully understand and accept that this is a learning-based 
              internship only, without any guaranteed stipend.
            </p>
          </section>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-900">
              <strong>Important:</strong> By clicking &quot;I Agree&quot; and digitally signing the offer acceptance form, 
              you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
