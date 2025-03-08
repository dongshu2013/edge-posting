import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User,
  getIdToken
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // If user is logged in, get their token and store it
      if (user) {
        const token = await getIdToken(user);
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!auth) throw new Error('Auth is not initialized');
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      throw err;
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      if (!auth) throw new Error('Auth is not initialized');
      setError(null);
      const actionCodeSettings = {
        url: window.location.origin + '/auth/verify',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email for verification
      window.localStorage.setItem('emailForSignIn', email);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
      throw err;
    }
  };

  const verifyMagicLink = async () => {
    try {
      if (!auth) throw new Error('Auth is not initialized');
      setError(null);
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          throw new Error('Email not found. Please try signing in again.');
        }

        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        return result.user;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify magic link');
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      if (!auth) throw new Error('Auth is not initialized');
      setError(null);
      await signOut(auth);
      localStorage.removeItem('authToken');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    }
  };

  // Helper function to get the current auth token
  const getAuthToken = async () => {
    if (!user) return null;
    return await getIdToken(user, true); // Force refresh the token
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    sendMagicLink,
    verifyMagicLink,
    signOut: signOutUser,
    getAuthToken,
  };
} 