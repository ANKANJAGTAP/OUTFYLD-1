'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Briefcase, Clock, Calendar, ArrowLeft, Check } from 'lucide-react';
import { format } from 'date-fns';
import ApplicationForm from '@/components/careers/ApplicationForm';
import { NightShell } from '@/components/night/NightShell';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightLoader } from '@/components/night/NightLoader';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { Mono, nightGhostBtn, nightPrimaryBtn, SweepButton } from '@/components/night/ui';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  stipend: {
    amount: string;
    type: string;
  };
  deadline?: string;
  createdAt: string;
}

const offerings = [
  'Performance-Based Stipend*',
  'Flexible work environment',
  'Completion Certificate',
  'Real-World Experience',
  'Mentorship Program',
];

/** Square-ish bordered tag — never a pill. */
function Tag({ children, tone = 'chalk' }: { children: React.ReactNode; tone?: 'chalk' | 'lime' }) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
        tone === 'lime' ? 'border-flood-500/40 text-flood-500' : 'border-chalk-400/30 text-chalk-400'
      }`}
    >
      {children}
    </span>
  );
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/careers/jobs/${params.jobId}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.job);
      } else {
        setError(data.error || 'Job not found');
      }
    } catch (err) {
      setError('Failed to load job details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NightShell>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Pulling the team sheet…" />
        </div>
      </NightShell>
    );
  }

  if (error || !job) {
    return (
      <NightShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="nm-overline mb-4 text-flood-500">Off the fixture list</p>
            <h2 className="nm-display-l text-chalk-100">Job not found</h2>
            <p className="mt-5 text-sm text-chalk-400">
              {error || 'This job posting does not exist.'}
            </p>
            <Link href="/careers/jobs" className={`${nightGhostBtn} mt-8`}>
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
          </div>
        </div>
      </NightShell>
    );
  }

  if (showApplicationForm) {
    return <ApplicationForm job={job} onBack={() => setShowApplicationForm(false)} />;
  }

  return (
    <NightShell>
      <LandingHeader />

      <main>
        {/* ── MATCH POSTER — job header ── */}
        <section className="nm-grain relative mx-auto max-w-5xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <Reveal>
            <Link
              href="/careers/jobs"
              className="nm-overline mb-8 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to all jobs
            </Link>

            <p className="nm-overline mb-4 text-flood-500">Open position</p>
            <h1 className="nm-display-l max-w-4xl text-chalk-100">{job.title}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Tag tone="lime">{job.department}</Tag>
              <Tag>{job.employmentType}</Tag>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-8 flex flex-col gap-6 border-t border-pitchline pt-6 md:flex-row md:items-center md:justify-between">
              {/* meta row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-flood-500" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-flood-500" />
                  {job.employmentType}
                </span>
                <span className="flex items-center gap-1.5 text-chalk-100">
                  <Mono className="text-flood-500">{job.stipend.amount}</Mono>
                  ({job.stipend.type})
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-flood-500" />
                    Apply by <Mono>{format(new Date(job.deadline), 'MMM dd, yyyy')}</Mono>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-flood-500" />
                  Posted <Mono>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</Mono>
                </span>
              </div>

              {/* ONE lime primary per view */}
              <button
                onClick={() => setShowApplicationForm(true)}
                className={`${nightPrimaryBtn} w-full shrink-0 md:w-auto`}
              >
                Apply now
              </button>
            </div>
          </Reveal>
        </section>

        <PitchDivider flag="right" />

        {/* ── THE BRIEF — long-form sections, hairline ledger ── */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              {/* About the Role */}
              <Reveal>
                <p className="nm-overline mb-3 text-flood-500">The brief</p>
                <h2 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
                  About the role
                </h2>
                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-chalk-400">
                  {job.description}
                </p>
              </Reveal>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <Reveal className="mt-14">
                  <p className="nm-overline mb-3 text-flood-500">Your position on the pitch</p>
                  <h2 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
                    Responsibilities
                  </h2>
                  <ul className="mt-5">
                    {job.responsibilities.map((responsibility, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-4 border-b border-pitchline/70 py-4 last:border-0"
                      >
                        <span className="font-mono text-xs tabular-nums text-flood-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm leading-relaxed text-chalk-400">
                          {responsibility}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <Reveal className="mt-14">
                  <p className="nm-overline mb-3 text-flood-500">Trial standards</p>
                  <h2 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
                    Requirements
                  </h2>
                  <ul className="mt-5">
                    {job.requirements.map((requirement, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-4 border-b border-pitchline/70 py-4 last:border-0"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
                        <span className="text-sm leading-relaxed text-chalk-400">
                          {requirement}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>

            {/* What We Offer — side rail */}
            <Reveal delay={0.08} className="mt-14 lg:col-span-4 lg:mt-0">
              <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6 lg:sticky lg:top-24">
                <p className="nm-overline text-flood-500">Contract terms</p>
                <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-chalk-100">
                  What we offer
                </h2>
                <ul className="mt-4">
                  {offerings.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 border-b border-pitchline/70 py-3 last:border-0"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
                      <span className="text-sm text-chalk-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        <PitchDivider flag="left" />

        {/* ── KICK OFF — closing apply ── */}
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="nm-display-l max-w-3xl text-chalk-100">
              Ready for <span className="text-flood-500">kick-off?</span>
            </h2>
            <div className="mt-8">
              <SweepButton onClick={() => setShowApplicationForm(true)} className="px-10 py-4">
                Apply for this position
              </SweepButton>
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
              By applying, you agree to our terms and privacy policy
            </p>
          </Reveal>
        </section>
      </main>

      <NightFooter />
    </NightShell>
  );
}
