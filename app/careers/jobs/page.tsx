'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { NightShell } from '@/components/night/NightShell';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightLoader } from '@/components/night/NightLoader';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { Mono } from '@/components/night/ui';

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  stipend: {
    amount: string;
    type: string;
  };
  deadline?: string;
  createdAt: string;
}

/** Square-ish bordered tag — the Night Match replacement for pill badges. */
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = '/api/careers/jobs?status=open';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError('An error occurred while fetching jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NightShell>
      <LandingHeader />

      <main>
        {/* ── FIXTURE LIST HEADER ── */}
        <section className="nm-grain relative mx-auto max-w-7xl px-4 pb-6 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <Reveal>
            <Link
              href="/careers"
              className="nm-overline mb-6 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to careers
            </Link>
            <p className="nm-overline mb-4 flex items-center gap-2.5 text-chalk-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-flood-500 shadow-flood" />
              <span className="text-flood-500">Join the squad</span>
              · Transfer window open
            </p>
            <h1 className="nm-display-xl text-chalk-100">Open positions</h1>
          </Reveal>
          <Reveal delay={0.1} className="mt-6 lg:ml-[38%]">
            <p className="nm-body-l max-w-xl text-chalk-400">
              Join our team and help shape the future of sports booking.
            </p>
          </Reveal>
        </section>

        <PitchDivider flag="right" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-24">
              <NightLoader label="Checking the team sheet…" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-[4px] border border-red-900/60 bg-pitch-700/80 px-4 py-3 text-sm text-chalk-100">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center border border-pitchline bg-pitch-700/60 px-6 py-20 text-center">
              <Briefcase className="mb-5 h-10 w-10 text-flood-500" />
              <p className="font-display text-3xl uppercase tracking-tight text-chalk-100">
                No open positions
              </p>
              <p className="mt-3 max-w-sm text-sm text-chalk-400">
                Check back later or send your resume to{' '}
                <a
                  href="mailto:admin@outfyld.in"
                  className="font-mono text-chalk-100 transition-colors duration-200 ease-night hover:text-flood-500"
                >
                  admin@outfyld.in
                </a>
              </p>
            </div>
          )}

          {/* ── Jobs — fixture-list rows ── */}
          {!loading && !error && jobs.length > 0 && (
            <Reveal>
              <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
                {/* list header */}
                <div className="flex items-center justify-between border-b border-pitchline/60 px-5 py-4 sm:px-8">
                  <p className="nm-overline text-chalk-400">This week&apos;s fixtures</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                    <Mono className="text-flood-500">{String(jobs.length).padStart(2, '0')}</Mono>{' '}
                    {jobs.length === 1 ? 'position' : 'positions'}
                  </p>
                </div>

                {jobs.map((job, i) => (
                  <Link
                    key={job._id}
                    href={`/careers/jobs/${job._id}`}
                    className="group block border-b border-pitchline/60 px-5 py-7 transition-colors duration-200 ease-night last:border-b-0 hover:bg-pitch-800/60 sm:px-8"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start">
                      {/* fixture number */}
                      <span className="hidden font-mono text-sm tabular-nums text-flood-500 md:mt-1.5 md:block">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-2xl uppercase leading-none tracking-tight text-chalk-100 transition-colors duration-200 ease-night group-hover:text-flood-500 sm:text-3xl">
                            {job.title}
                          </h2>
                          <Tag tone="lime">{job.department}</Tag>
                          <Tag>{job.employmentType}</Tag>
                        </div>

                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-chalk-400">
                          {job.description.substring(0, 150)}...
                        </p>

                        {/* meta row */}
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
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
                      </div>

                      {/* kick-off arrow */}
                      <span className="nm-overline flex items-center gap-2 self-start text-chalk-400 transition-colors duration-200 ease-night group-hover:text-flood-500 md:mt-1.5 md:self-center">
                        View &amp; apply
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </main>

      <NightFooter />
    </NightShell>
  );
}
