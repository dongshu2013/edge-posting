"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  getIdToken,
  User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

const isBrowser = typeof window !== "undefined";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (!isBrowser) return null;
    // Restore user state from localStorage
    const savedUser = localStorage.getItem("authUser");
    return savedUser ? JSON.parse(savedUser) : auth?.currentUser || null;
  });
  const { setUserInfo, userInfo } = useUserStore((state) => state);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const authStateInitialized = useRef(false);

  // const generateRandomBio = () => {
  //   const bios = [
  //     "Just exploring the digital frontier",
  //     "Sharing thoughts and making connections",
  //     "Here to learn and grow",
  //     "Building something amazing",
  //     "Passionate about web3 and technology",
  //     "Creating the future, one post at a time",
  //   ];
  //   return bios[Math.floor(Math.random() * bios.length)];
  // };

  // const generateRandomMood = () => {
  //   const moods = [
  //     "curious",
  //     "excited",
  //     "inspired",
  //     "focused",
  //     "creative",
  //     "energetic",
  //     "optimistic",
  //   ];
  //   return moods[Math.floor(Math.random() * moods.length)];
  // };

  const generateRandomUsername = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const timestamp = Date.now().toString(36);
    const randomLength = 6;
    let randomString = "";

    for (let i = 0; i < randomLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      randomString += chars.charAt(randomIndex);
    }

    return `user_${timestamp}_${randomString}`;
  };

  const saveUserToDatabase = useCallback(
    async (user: User) => {
      if (isSyncing || !user) return;

      try {
        setIsSyncing(true);
        console.log("Fetching user info from database...");

        const response = await fetchApi(`/api/user/${user.uid}`, {
          method: "GET",
          auth: true,
        }).catch((err) => {
          console.error("Error fetching user info from database:", err);
          return null;
        });

        // Only create user if they don't exist
        if (!response) {
          console.log("Creating new user...");
          const newUser = {
            uid: user.uid,
            email: user.email,
            username: generateRandomUsername(),
            nickname: user.displayName,
            avatar: user.photoURL,
            bio: null,
            mood: null,
          };

          const userInfo = await fetchApi("/api/user", {
            method: "POST",
            auth: true,
            body: JSON.stringify(newUser),
          });

          console.log("User created successfully", userInfo);
          setUserInfo(userInfo);
        } else {
          console.log("User created", response);
          setUserInfo(response);
        }
      } catch (error) {
        console.error("Failed to save user to database:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, setUserInfo]
  );

  useEffect(() => {
    if (!isBrowser || !auth) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Save user state to localStorage
      if (user) {
        localStorage.setItem("authUser", JSON.stringify(user));
      } else {
        localStorage.removeItem("authUser");
      }

      setUser(user);
      authStateInitialized.current = true;

      if (user) {
        try {
          console.log("Getting ID token");
          const token = await getIdToken(user);

          // Store token in localStorage and cookies
          localStorage.setItem("authToken", token);

          // Set cookie with SameSite=Strict for security
          document.cookie = `authToken=${token}; path=/; max-age=3600; SameSite=Strict`;

          // Fix sync condition check
          if (!isSyncing && !userInfo) {
            console.log("Syncing user to database");
            await saveUserToDatabase(user);
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
        }
      } else {
        // Clear token from localStorage and cookies
        localStorage.removeItem("authToken");
        document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";
        setUser(null);
        setUserInfo(null);
      }

      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, [saveUserToDatabase, isSyncing, userInfo]);

  const signInWithGoogle = async () => {
    try {
      console.log("Signing in with Google");
      setLoading(true);
      const result = await signInWithPopup(auth!, googleProvider);
      console.log("Google sign-in successful");
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      console.log("Sending magic link to", email);
      setLoading(true);
      if (!auth) throw new Error("Auth is not initialized");

      const actionCodeSettings = {
        url: window.location.origin + "/auth/verify",
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email for verification
      if (isBrowser) {
        localStorage.setItem("emailForSignIn", email);
      }
      console.log("Magic link sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending magic link:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyMagicLink = async () => {
    try {
      console.log("Verifying magic link");
      setLoading(true);
      if (!auth) throw new Error("Auth is not initialized");

      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = isBrowser ? localStorage.getItem("emailForSignIn") : null;
        if (!email) {
          throw new Error("Email not found. Please try signing in again.");
        }

        const result = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );
        if (isBrowser) {
          localStorage.removeItem("emailForSignIn");
        }
        console.log("Magic link verification successful");
        return result.user;
      }
    } catch (error) {
      console.error("Error verifying magic link:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      console.log("Signing out");
      await signOut(auth!);
      if (isBrowser) {
        localStorage.removeItem("authToken");
      }
      document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";
      setUserInfo(null);
      setUser(null);
      console.log("Sign out successful");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    userInfo,
    loading: loading || isSyncing,
    isAuthenticated: !!user && authStateInitialized.current,
    signInWithGoogle,
    sendMagicLink,
    verifyMagicLink,
    signOut: signOutUser,
  };
}
