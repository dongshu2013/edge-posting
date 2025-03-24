'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyPage() {
  const { verifyMagicLink } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        setIsVerifying(true);
        await verifyMagicLink();
        router.push('/buzz');
      } catch (err) {
        console.error('Error verifying magic link:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify magic link');
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [verifyMagicLink, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isVerifying ? 'Verifying your email...' : error ? 'Verification failed' : 'Verification successful'}
          </h2>
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/buzz')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Go back to home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isVerifying && !error && (
            <p className="mt-2 text-center text-sm text-gray-600">
              You have been successfully signed in. Redirecting...
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 