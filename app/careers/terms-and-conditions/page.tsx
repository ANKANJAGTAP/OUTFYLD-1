'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NightShell } from '@/components/night/NightShell';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';

/* ── Long-form building blocks — chalk body on hairline rhythm ── */

function Section({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-pitchline/70 py-8 last:border-0">
      <h2 className="flex items-baseline gap-4">
        <span className="font-mono text-sm tabular-nums text-flood-500">{no}</span>
        <span className="font-display text-2xl uppercase tracking-tight text-chalk-100">
          {title}
        </span>
      </h2>
      <div className="mt-4 space-y-3 pl-9 text-sm leading-relaxed text-chalk-400">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-flood-500">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <NightShell>
      <LandingHeader />

      <main>
        {/* ── THE RULEBOOK — header ── */}
        <div className="nm-grain relative mx-auto max-w-4xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <Reveal>
            <Link
              href="/careers"
              className="nm-overline mb-8 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to careers
            </Link>
            <p className="nm-overline mb-4 text-flood-500">The rulebook</p>
            <h1 className="nm-display-l text-chalk-100">
              Terms &amp;
              <br />
              conditions
            </h1>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-400">
              Internship Program Agreement
            </p>
          </Reveal>
        </div>

        <PitchDivider flag="right" />

        {/* ── Content — hairline-divided laws of the game ── */}
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <Reveal>
            <Section no="01" title="Introduction">
              <p>
                Welcome to Outfyld. By registering for any internship offered on our website and
                by paying the processing &amp; certificate fee of ₹249, you agree to these Terms
                &amp; Conditions.
              </p>
              <p>
                These terms ensure smooth functioning of our internship programs and compliance
                with applicable Indian laws.
              </p>
            </Section>

            <Section no="02" title="Nature of Service">
              <p>Outfyld provides online internships, which include:</p>
              <List
                items={[
                  'Learning materials',
                  'Internship tasks / projects',
                  'Mail support',
                  'Completion certificate (digital PDF)',
                ]}
              />
              <p>No physical job placement or guaranteed employment is promised.</p>
            </Section>

            <Section no="03" title="Fees & Payments">
              <List
                items={[
                  'A ₹249 processing & certificate generation fee is charged at registration.',
                  'Payments are collected securely via Razorpay or similar payment gateways.',
                  'The fee covers administrative processing, access to internship materials, evaluation, and certificate generation.',
                  'Outfyld does not charge any hidden fees.',
                ]}
              />
            </Section>

            <Section no="04" title="Internship Eligibility">
              <p>Participants must:</p>
              <List
                items={[
                  'Provide accurate registration details',
                  'Be at least 16 years old',
                  'Agree not to misuse or redistribute provided materials',
                  'Complete required tasks ethically',
                ]}
              />
            </Section>

            <Section no="05" title="Certificate Policy">
              <p>
                A digital certificate will be issued only after successful completion of the
                required tasks.
              </p>
              <p>Certificates:</p>
              <List
                items={[
                  'Are delivered by email',
                  'Are intended solely for academic & skill-building purposes',
                  'Do not guarantee job placement or employment',
                ]}
              />
            </Section>

            <Section no="06" title="Refund & Cancellation">
              <p className="font-medium text-chalk-100">
                The ₹249 processing &amp; certificate fee is strictly NON-REFUNDABLE under all
                circumstances.
              </p>
              <p>This includes (but is not limited to) situations where:</p>
              <List
                items={[
                  'The participant changes their mind',
                  'The participant does not complete tasks',
                  'The participant is unable to continue the internship',
                  'The participant violated the Terms & Conditions',
                  "Technical issues related to the participant's device or internet",
                ]}
              />
              <p>
                By completing the payment, the participant fully accepts that the internship fee
                is non-refundable and non-transferable.
              </p>
              <p>
                Outfyld does not offer cancellations, returns, partial refunds, or fee
                adjustments.
              </p>
            </Section>

            <Section no="07" title="Participant Obligations">
              <p>Participants must NOT:</p>
              <List
                items={[
                  'Submit fraudulent or plagiarized work',
                  'Abuse or harass mentors or support staff',
                  'Misuse or misrepresent the certificate',
                  "Use Outfyld's name for illegal or misleading activities",
                  'Share course files or login materials publicly',
                ]}
              />
              <p>Violation may lead to termination without refund.</p>
            </Section>

            <Section no="08" title="Intellectual Property">
              <p>
                All content, materials, tasks, branding, logos, and website elements belong to
                Outfyld. Participants may use them only for personal learning.
              </p>
              <p>Redistribution, resale, or republishing is strictly prohibited.</p>
            </Section>

            <Section no="09" title="Disclaimer">
              <List
                items={[
                  'Internships are for learning and experience, not employment.',
                  'Outfyld does not guarantee job placement or offers.',
                  'Outfyld is not responsible for losses arising from device issues, internet failure, or participant negligence.',
                ]}
              />
            </Section>

            <Section no="10" title="Limitation of Liability">
              <p>Outfyld&apos;s liability is strictly limited to the amount paid (₹249).</p>
              <p>We are not responsible for indirect, incidental, or consequential damages.</p>
            </Section>

            <Section no="11" title="Third-Party Tools & Services">
              <p>We use third-party tools such as:</p>
              <List
                items={[
                  'Razorpay (for payments)',
                  'Email service providers',
                  'Analytics tools',
                ]}
              />
              <p>Their respective terms apply where relevant.</p>
            </Section>

            <Section no="12" title="Startup Support Clarification">
              <p>
                Outfyld is a student-led startup, and the ₹249 processing &amp; certificate fee
                helps us cover essential operational and developmental costs, including:
              </p>
              <List
                items={[
                  'Platform development',
                  'Course material creation',
                  'Mentor support',
                  'Certificate generation',
                  'Internship program improvements',
                ]}
              />
              <p>
                This fee is not a donation, crowdfunding activity, or fundraising request. It is
                a standard service fee charged in exchange for valuable learning benefits.
              </p>
              <p>In return for this fee, every participant receives:</p>
              <List
                items={[
                  'Access to internship tasks',
                  'Learning materials',
                  'Evaluation & feedback (where applicable)',
                  'A digital completion certificate',
                  'A structured skill-building experience',
                ]}
              />
              <p>
                This ensures the fee remains industry-standard, transparent, ethical, and
                compliant with Indian consumer protection guidelines.
              </p>
            </Section>

            <Section no="13" title="Modifications">
              <p>Outfyld may update or modify these Terms at any time.</p>
              <p>
                Continued use of the internship services signifies acceptance of the updated
                Terms.
              </p>
            </Section>

            <Section no="14" title="Stipend Clarification">
              <p className="font-medium text-chalk-100">
                Outfyld does not guarantee any stipend, salary, or monetary compensation as part
                of the internship program.
              </p>
              <p>
                Any mention of stipend is purely for promotional or motivational purposes to
                encourage learning interest, and should not be interpreted as an assured payment
                or financial benefit.
              </p>
              <p>
                We are a very small student-led startup, and currently we are not in a position
                to provide stipends to interns. Participants enrolling in the internship
                acknowledge and agree that:
              </p>
              <List
                items={[
                  'The internship is unpaid.',
                  'The ₹249 fee is only for processing, training access, and certificate generation, not for stipend distribution.',
                  'Outfyld shall not be liable for expectations of monetary rewards, payouts, or financial incentives.',
                ]}
              />
              <p className="font-medium text-chalk-100">
                By enrolling and making the payment, participants fully understand and accept
                that this is a learning-based internship only, without any guaranteed stipend.
              </p>
            </Section>

            {/* Footer Note — referee's whistle */}
            <div className="mt-10 border-l-2 border-flood-500 bg-pitch-800/80 px-5 py-4">
              <p className="text-xs leading-relaxed text-chalk-400">
                <span className="nm-overline mr-2 text-flood-500">Important</span>
                By clicking &quot;I Agree&quot; and digitally signing the offer acceptance form,
                you acknowledge that you have read, understood, and agree to be bound by these
                Terms and Conditions.
              </p>
            </div>
          </Reveal>
        </div>
      </main>

      <NightFooter />
    </NightShell>
  );
}
