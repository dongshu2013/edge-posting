import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export function AuthButton({ buttonText }: { buttonText?: string }) {
  const { user, signInWithGoogle, sendMagicLink, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProfileClick = () => {
    if (user) {
      router.push(`/profile/${user.uid}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/buzz');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
        >
          {buttonText || "Sign In"}
        </button>

        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      Sign In
                    </Dialog.Title>

                    {emailSent ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">
                          Magic link sent! Check your email to sign in.
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={signInWithGoogle}
                          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 mb-4"
                        >
                          <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-4 h-4 mr-2"
                          />
                          Continue with Google
                        </button>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or</span>
                          </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email address
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="you@example.com"
                              required
                            />
                          </div>

                          {error && (
                            <p className="text-sm text-red-600">
                              {error}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={isSending}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {isSending ? 'Sending...' : 'Send Magic Link'}
                          </button>
                        </form>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleProfileClick}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-all duration-200"
      >
        <span className="text-gray-900">
          {user.email?.split('@')[0] || 'Profile'}
        </span>
      </button>
      <button
        onClick={handleSignOut}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200"
      >
        Sign Out
      </button>
    </div>
  );
} 