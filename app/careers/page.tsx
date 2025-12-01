import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, TrendingUp, Award, MapPin, Clock, Lightbulb, HandshakeIcon, BookOpen } from 'lucide-react';
import CareersPageNotifications from '@/components/careers/CareersPageNotifications';
import { Suspense } from 'react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Notifications for offer acceptance */}
      <Suspense fallback={null}>
        <CareersPageNotifications />
      </Suspense>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Join the OutFyld Team
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-50">
            Build the future of sports and turf booking in India
          </p>
          <Link href="/careers/jobs">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              View Open Positions
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Why Work at OutFyld?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Growth Mindset</h3>
              <p className="text-gray-600">
                Rapid career progression in a fast-growing startup environment
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Team</h3>
              <p className="text-gray-600">
                Work with passionate, talented people
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Impact</h3>
              <p className="text-gray-600">
               Bring real change to Indian sports
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexibility</h3>
              <p className="text-gray-600">
                Remote-friendly culture with flexible working hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Culture Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Our Culture
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation First</h3>
              <p className="text-gray-600">
                We encourage creative thinking and aren&apos;t afraid to try new approaches. Your ideas matter here.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <HandshakeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
              <p className="text-gray-600">
                We believe in teamwork. Every voice is heard, and every contribution is valued.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Learning</h3>
              <p className="text-gray-600">
                Continuous learning is part of our DNA. We invest in your growth through training and mentorship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perks & Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Perks & Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Performance-Based Stipend*</h4>
                <p className="text-gray-600">Competitive internship stipends based on your contribution</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Completion Certificate</h4>
                <p className="text-gray-600">Official certificate upon successful internship completion</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Flexible Work</h4>
                <p className="text-gray-600">Remote work options and flexible hours</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Real-World Experience</h4>
                <p className="text-gray-600">Work on live projects that impact thousands of users</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Mentorship Program</h4>
                <p className="text-gray-600">Direct guidance from experienced team leads and founders</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4">
              <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-semibold text-lg">Free Turf Access</h4>
                <p className="text-gray-600">Complimentary access to partner turfs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Preview */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl mb-8 text-green-50">
            Check out our open positions and apply today
          </p>
          <Link href="/careers/jobs">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Briefcase className="w-5 h-5 mr-2" />
              View All Openings
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-4">Don&apos;t see a role that fits?</h3>
          <p className="text-gray-600 mb-6">
            We&apos;re always looking for talented people. Send us your resume at{' '}
            <a href="mailto:careers@outfyld.in" className="text-green-600 hover:underline">
              admin@outfyld.in
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
