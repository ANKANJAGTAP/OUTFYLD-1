'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  NightInput,
  NightTextarea,
  nightField,
  nightPrimaryBtn,
  nightGhostBtn,
  nightCard,
  Mono,
  StatusDot,
} from '@/components/night/ui';

interface Job {
  _id: string;
  title: string;
  department: string;
  employmentType: string;
}

interface ApplicationFormProps {
  job: Job;
  onBack: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  graduationYear: string;
  availability: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  coverLetter: string;
  // Voluntary Disclosure
  gender: string;
  disabilityStatus: string;
  veteranStatus: string;
  // Work Experience
  workExperience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  };
}

/** Mono-caps field label — the ledger voice. */
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400"
    >
      {children}
    </label>
  );
}

export default function ApplicationForm({ job, onBack }: ApplicationFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: '',
    branch: '',
    graduationYear: '',
    availability: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    coverLetter: '',
    gender: '',
    disabilityStatus: '',
    veteranStatus: '',
    workExperience: {
      company: '',
      role: '',
      duration: '',
      description: ''
    }
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setResumeFile(file);
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    // Validate College (Required)
    if (!formData.college.trim()) {
      setError('Please enter your college/university name');
      return false;
    }

    // Validate Branch (Required)
    if (!formData.branch.trim()) {
      setError('Please enter your branch/stream');
      return false;
    }

    // Validate Graduation Year (Required)
    if (!formData.graduationYear.trim()) {
      setError('Please enter your year of graduation');
      return false;
    }

    if (!resumeFile) {
      setError('Please upload your resume');
      return false;
    }

    // Validate LinkedIn URL (Required)
    if (!formData.linkedinUrl.trim()) {
      setError('LinkedIn profile is required');
      return false;
    }
    if (!formData.linkedinUrl.includes('linkedin.com')) {
      setError('Please enter a valid LinkedIn URL');
      return false;
    }

    // Validate GitHub URL (Required)
    if (!formData.githubUrl.trim()) {
      setError('GitHub profile is required');
      return false;
    }
    if (!formData.githubUrl.includes('github.com')) {
      setError('Please enter a valid GitHub URL');
      return false;
    }

    // Validate Gender (Required)
    if (!formData.gender) {
      setError('Please select your gender');
      return false;
    }

    // Validate Disability Status (Required)
    if (!formData.disabilityStatus) {
      setError('Please select your disability status');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Step 1: Upload resume to Cloudinary
      setUploading(true);
      const resumeFormData = new FormData();
      resumeFormData.append('file', resumeFile!);

      const uploadResponse = await fetch('/api/careers/upload-resume', {
        method: 'POST',
        body: resumeFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload resume');
      }

      const uploadData = await uploadResponse.json();
      setUploading(false);

      // Step 2: Submit application
      const applicationData = {
        jobId: job._id,
        userId: user?._id || null,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        branch: formData.branch,
        graduationYear: formData.graduationYear,
        availability: formData.availability || undefined,
        resume: {
          url: uploadData.url,
          public_id: uploadData.public_id,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
        },
        coverLetter: formData.coverLetter || undefined,
        linkedinUrl: formData.linkedinUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl || undefined,
        gender: formData.gender,
        disabilityStatus: formData.disabilityStatus,
        veteranStatus: formData.veteranStatus || undefined,
        workExperience: (formData.workExperience.company || formData.workExperience.role) ? formData.workExperience : undefined,
        source: 'website',
      };

      const response = await fetch('/api/careers/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to careers page after 3 seconds
        setTimeout(() => {
          router.push('/careers');
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your application');
      console.error(err);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pitch-900 p-4">
        <div className={`${nightCard} w-full max-w-md p-8 text-center`}>
          <CheckCircle className="mx-auto mb-5 h-10 w-10 text-flood-500" />
          <p className="nm-overline mb-3 text-flood-500">Team sheet updated</p>
          <h2 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
            Application submitted
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-chalk-400">
            Thank you for applying to the {job.title} position. We&apos;ve received your
            application and will review it shortly. You&apos;ll receive a confirmation email at{' '}
            <span className="text-chalk-100">{formData.email}</span>.
          </p>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
            Redirecting you in a moment…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch-900">
      {/* ── TRIAL PAPERWORK — form header ── */}
      <div className="nm-grain relative border-b border-pitchline px-4 pb-10 pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={onBack}
            className="nm-overline mb-8 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to job details
          </button>
          <p className="nm-overline mb-4 text-flood-500">Join the squad</p>
          <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100 sm:text-5xl">
            Apply — {job.title}
          </h1>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
            {job.department} / {job.employmentType}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* User Status Note */}
        {!user && (
          <div className="mb-8 rounded-[4px] border border-pitchline bg-pitch-800/80 px-5 py-4">
            <p className="text-sm text-chalk-400">
              <span className="nm-overline mr-2 text-flood-500">Tip</span>
              Sign in to save your application and track its status. You can also apply as a
              guest.
            </p>
          </div>
        )}

        <div className={`${nightCard} p-6 sm:p-8`}>
          <p className="nm-overline text-flood-500">Trial paperwork</p>
          <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-chalk-100">
            Application form
          </h2>
          <p className="mt-2 text-sm text-chalk-400">
            Fill in your details below. Fields marked with * are required.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-10">
            {/* Processing Warning */}
            {(submitting || uploading) && (
              <div className="rounded-[4px] border border-flood-500/50 bg-pitch-800/80 px-5 py-4">
                <p className="nm-overline flex items-center gap-2 text-flood-500">
                  <StatusDot />
                  Please wait — do not close this page
                </p>
                <p className="mt-2 text-sm text-chalk-100">
                  {uploading ? 'Uploading your resume…' : 'Submitting your application…'}
                </p>
                <p className="mt-1 text-xs text-chalk-400">
                  This may take a few moments. Closing this page will cancel your submission.
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="rounded-[4px] border border-red-700/60 bg-pitch-800/80 px-5 py-4">
                <p className="nm-overline flex items-center gap-2 text-red-500">
                  <StatusDot tone="red" />
                  Flag on the play
                </p>
                <p className="mt-2 text-sm text-chalk-100">{error}</p>
                <div className="mt-3 text-xs text-chalk-400">
                  <p>What you can do:</p>
                  <ul className="mt-1 ml-2 list-inside list-disc space-y-1">
                    <li>Check your internet connection</li>
                    <li>Make sure your resume file is under 5MB</li>
                    <li>Try submitting again</li>
                    <li>If the problem persists, contact support at admin@outfyld.in</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="border-b border-pitchline pb-3 font-display text-lg uppercase tracking-tight text-chalk-100">
                Personal information
              </h3>

              <div>
                <FieldLabel htmlFor="fullName">Full name *</FieldLabel>
                <NightInput
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="email">Email *</FieldLabel>
                  <NightInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="phone">Phone number *</FieldLabel>
                  <NightInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="college">College/University *</FieldLabel>
                  <NightInput
                    id="college"
                    name="college"
                    type="text"
                    value={formData.college}
                    onChange={handleInputChange}
                    placeholder="e.g., IIT Bombay, MIT, etc."
                    required
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="branch">Branch/Stream *</FieldLabel>
                  <NightInput
                    id="branch"
                    name="branch"
                    type="text"
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science, IT, Mechanical"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="graduationYear">Year of graduation *</FieldLabel>
                  <NightInput
                    id="graduationYear"
                    name="graduationYear"
                    type="text"
                    value={formData.graduationYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2025, 2026"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <FieldLabel htmlFor="resume">Resume/CV * (PDF or DOCX, max 5MB)</FieldLabel>
              <div className="mt-2">
                <label
                  htmlFor="resume"
                  className="flex w-full cursor-pointer items-center justify-center rounded-[4px] border border-dashed border-chalk-400/30 bg-pitch-800/50 px-4 py-8 transition-colors duration-200 ease-night hover:border-flood-500/60"
                >
                  <div className="text-center">
                    <Upload className="mx-auto mb-3 h-6 w-6 text-chalk-400" />
                    {resumeFile ? (
                      <p className="flex items-center justify-center gap-2 font-mono text-xs text-flood-500">
                        <StatusDot />
                        {resumeFile.name} (<Mono>{(resumeFile.size / 1024).toFixed(0)}</Mono> KB)
                      </p>
                    ) : (
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                        Click to upload or drag and drop
                      </p>
                    )}
                  </div>
                </label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Professional Links */}
            <div className="space-y-4">
              <h3 className="border-b border-pitchline pb-3 font-display text-lg uppercase tracking-tight text-chalk-100">
                Professional links
              </h3>

              <div>
                <FieldLabel htmlFor="linkedinUrl">LinkedIn profile *</FieldLabel>
                <NightInput
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="githubUrl">GitHub profile *</FieldLabel>
                <NightInput
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/yourusername"
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="portfolioUrl">Portfolio website (Optional)</FieldLabel>
                <NightInput
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <FieldLabel htmlFor="coverLetter">Cover letter (Optional)</FieldLabel>
              <NightTextarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                rows={6}
                maxLength={2000}
              />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                <Mono>{formData.coverLetter.length}</Mono>/2000 characters
              </p>
            </div>

            {/* Voluntary Disclosure (EEO) */}
            <div className="border-t border-pitchline pt-8">
              <h3 className="font-display text-lg uppercase tracking-tight text-chalk-100">
                Voluntary disclosure
              </h3>
              <p className="mb-4 mt-2 text-sm text-chalk-400">
                This information helps us track our diversity efforts and is kept confidential. It will not be used in hiring decisions.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="gender">Gender *</FieldLabel>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={nightField}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="disabilityStatus">Disability status *</FieldLabel>
                  <select
                    id="disabilityStatus"
                    name="disabilityStatus"
                    value={formData.disabilityStatus}
                    onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })}
                    className={nightField}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="veteranStatus">Veteran status (Optional)</FieldLabel>
                  <select
                    id="veteranStatus"
                    name="veteranStatus"
                    value={formData.veteranStatus}
                    onChange={(e) => setFormData({ ...formData, veteranStatus: e.target.value })}
                    className={nightField}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Work Experience (Optional) */}
            <div className="border-t border-pitchline pt-8">
              <h3 className="font-display text-lg uppercase tracking-tight text-chalk-100">
                Past work experience (Optional)
              </h3>
              <p className="mb-4 mt-2 text-sm text-chalk-400">
                Share your most recent or relevant work experience if you have any.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="workCompany">Company name</FieldLabel>
                  <NightInput
                    id="workCompany"
                    value={formData.workExperience.company}
                    onChange={(e) => setFormData({
                      ...formData,
                      workExperience: { ...formData.workExperience, company: e.target.value }
                    })}
                    placeholder="e.g., Google, Microsoft"
                    maxLength={100}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="workRole">Role/Position</FieldLabel>
                  <NightInput
                    id="workRole"
                    value={formData.workExperience.role}
                    onChange={(e) => setFormData({
                      ...formData,
                      workExperience: { ...formData.workExperience, role: e.target.value }
                    })}
                    placeholder="e.g., Software Engineer Intern"
                    maxLength={100}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="workDuration">Duration</FieldLabel>
                  <NightInput
                    id="workDuration"
                    value={formData.workExperience.duration}
                    onChange={(e) => setFormData({
                      ...formData,
                      workExperience: { ...formData.workExperience, duration: e.target.value }
                    })}
                    placeholder="e.g., 6 months, 1 year"
                    maxLength={50}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel htmlFor="workDescription">Description</FieldLabel>
                  <NightTextarea
                    id="workDescription"
                    value={formData.workExperience.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      workExperience: { ...formData.workExperience, description: e.target.value }
                    })}
                    placeholder="Brief description of your responsibilities and achievements..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                    <Mono>{formData.workExperience.description.length}</Mono>/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-6">
              {/* Critical Warning Note */}
              <div className="rounded-[4px] border border-pitchline bg-pitch-800/80 px-5 py-4">
                <p className="nm-overline text-flood-500">Before you submit</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-chalk-400">
                  <li>Review all your information carefully</li>
                  <li>Ensure your resume is attached and under 5MB</li>
                  <li className="text-chalk-100">Do NOT close this window or refresh the page during submission</li>
                  <li>Wait for the confirmation message before leaving</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={submitting}
                  className={nightGhostBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className={`${nightPrimaryBtn} flex-1`}
                >
                  {submitting
                    ? uploading
                      ? 'Uploading resume…'
                      : 'Submitting application…'
                    : 'Submit application'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
