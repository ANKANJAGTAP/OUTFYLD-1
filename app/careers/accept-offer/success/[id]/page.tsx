'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OfferAcceptanceSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const response = await fetch(`/api/careers/accept-offer/${applicationId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setApplication(data.application);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎉 Congratulations!</h1>
          <p className="text-xl text-gray-600">Your offer acceptance is complete</p>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <div className="border-b-2 border-green-500 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-green-600">Payment Successful</h2>
            <p className="text-gray-600 mt-2">Welcome to the OutFyld team!</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Verification Completed</p>
                <p className="text-sm text-gray-600">Your details have been verified successfully</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Digital Signature Received</p>
                <p className="text-sm text-gray-600">Your signature has been saved securely</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Payment Processed</p>
                <p className="text-sm text-gray-600">₹249 payment completed successfully</p>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Check your email!</strong> We've sent your joining letter and onboarding details to <strong>{application?.email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">📋 What's Next?</h3>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                <p className="text-gray-700">Check your email for the joining letter</p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                <p className="text-gray-700">Download and save all documents for your records</p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                <p className="text-gray-700">Wait for onboarding instructions (within 24-48 hours)</p>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                <p className="text-gray-700">Mark your calendar for your start date</p>
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/careers"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition text-center"
          >
            Back to Careers
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Print This Page
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center text-gray-600">
          <p>Need help? Contact us at <a href="mailto:hr@outfyld.in" className="text-green-600 hover:underline">hr@outfyld.in</a></p>
        </div>
      </div>
    </div>
  );
}
