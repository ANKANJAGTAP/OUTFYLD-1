'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Briefcase, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ApplicationForm from '@/components/careers/ApplicationForm';

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

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'Frontend':
        return 'bg-blue-100 text-blue-700';
      case 'Backend':
        return 'bg-purple-100 text-purple-700';
      case 'Full-stack':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Internship':
        return 'bg-orange-100 text-orange-700';
      case 'Full-time':
        return 'bg-emerald-100 text-emerald-700';
      case 'Part-time':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This job posting does not exist.'}</p>
          <Link href="/careers/jobs">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showApplicationForm) {
    return <ApplicationForm job={job} onBack={() => setShowApplicationForm(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/careers/jobs" className="text-green-100 hover:text-white mb-4 inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-3">{job.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getDepartmentColor(job.department)}>
                    {job.department}
                  </Badge>
                  <Badge className={getTypeColor(job.employmentType)}>
                    {job.employmentType}
                  </Badge>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => setShowApplicationForm(true)}
                className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
              >
                Apply Now
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>{job.employmentType}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-green-600">
                💰 <span>{job.stipend.amount} ({job.stipend.type})</span>
              </div>
              {job.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Apply by {format(new Date(job.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About the Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* What We Offer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What We Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Performance-Based Stipend*</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Flexible work environment</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Completion Certificate</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Real-World Experience</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">Mentorship Program</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Apply Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setShowApplicationForm(true)}
            className="bg-green-600 hover:bg-green-700 px-12"
          >
            Apply for this Position
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            By applying, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
