'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Briefcase, MapPin, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
  openings: number;
  deadline?: string;
  createdAt: string;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/careers" className="text-green-100 hover:text-white mb-4 inline-block">
            ← Back to Careers
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Open Positions</h1>
          <p className="text-xl text-green-50">
            Join our team and help shape the future of sports booking
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No open positions</h3>
            <p className="text-gray-600">
              Check back later or send your resume to careers@outfyld.in
            </p>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Showing {jobs.length} {jobs.length === 1 ? 'position' : 'positions'}
            </p>

            {jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                      <CardDescription className="text-base">
                        {job.description.substring(0, 150)}...
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDepartmentColor(job.department)}>
                        {job.department}
                      </Badge>
                      <Badge className={getTypeColor(job.employmentType)}>
                        {job.employmentType}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.openings} {job.openings === 1 ? 'opening' : 'openings'}</span>
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
                </CardContent>

                <CardFooter>
                  <Link href={`/careers/jobs/${job._id}`} className="w-full md:w-auto">
                    <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                      View Details & Apply
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
