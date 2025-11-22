'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for applying to the {job.title} position
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              We&apos;ve received your application and will review it shortly. You&apos;ll receive a confirmation email at <strong>{formData.email}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you in a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="text-green-100 hover:text-white mb-4 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Details
          </button>
          <h1 className="text-3xl font-bold">Apply for {job.title}</h1>
          <p className="text-green-50 mt-2">{job.department} • {job.employmentType}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* User Status Alert */}
        {!user && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              💡 <strong>Tip:</strong> Sign in to save your application and track its status. You can also apply as a guest.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Fill in your details below. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="college">College/University *</Label>
                    <Input
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
                    <Label htmlFor="branch">Branch/Stream *</Label>
                    <Input
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graduationYear">Year of Graduation *</Label>
                    <Input
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
                <Label htmlFor="resume">Resume/CV * (PDF or DOCX, max 5MB)</Label>
                <div className="mt-2">
                  <label
                    htmlFor="resume"
                    className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      {resumeFile ? (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">
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
                <h3 className="text-lg font-semibold">Professional Links</h3>

                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn Profile *</Label>
                  <Input
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
                  <Label htmlFor="githubUrl">GitHub Profile *</Label>
                  <Input
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
                  <Label htmlFor="portfolioUrl">Portfolio Website (Optional)</Label>
                  <Input
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
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.coverLetter.length}/2000 characters
                </p>
              </div>

              {/* Voluntary Disclosure (EEO) */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Voluntary Disclosure</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This information helps us track our diversity efforts and is kept confidential. It will not be used in hiring decisions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    <Label htmlFor="disabilityStatus">Disability Status *</Label>
                    <select
                      id="disabilityStatus"
                      name="disabilityStatus"
                      value={formData.disabilityStatus}
                      onChange={(e) => setFormData({ ...formData, disabilityStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="veteranStatus">Veteran Status (Optional)</Label>
                    <select
                      id="veteranStatus"
                      name="veteranStatus"
                      value={formData.veteranStatus}
                      onChange={(e) => setFormData({ ...formData, veteranStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Past Work Experience (Optional)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share your most recent or relevant work experience if you have any.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workCompany">Company Name</Label>
                    <Input
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
                    <Label htmlFor="workRole">Role/Position</Label>
                    <Input
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
                    <Label htmlFor="workDuration">Duration</Label>
                    <Input
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
                    <Label htmlFor="workDescription">Description</Label>
                    <Textarea
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
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.workExperience.description.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Uploading Resume...' : 'Submitting Application...'}
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
