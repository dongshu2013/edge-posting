'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyPage() {
  const { verifyMagicLink } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const user = await verifyMagicLink();
        if (user) {
          router.push('/');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify email link');
      }
    };

    verify();
  }, [verifyMagicLink, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">
            Verifying your email...
          </p>
        </div>
      </div>
    </div>
  );
} 