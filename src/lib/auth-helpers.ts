import { headers } from "next/headers";
import { adminAuth } from "./firebase-admin";

export interface AuthUser {
  uid: string;
  email: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Get headers from the request
    const headersList = await headers();

    const authHeader = headersList.get("authorization");

    if (!authHeader) {
      console.warn("No authorization header found");
      return null;
    }

    try {
      const idToken = authHeader.split("Bearer ")[1];
      // console.log("Token received, verifying...", idToken);
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      // console.log(
      //   "Token verified successfully for user:",
      //   decodedToken,
      //   decodedToken?.uid
      // );

      return {
        uid: decodedToken?.uid,
        email: decodedToken?.email || null,
      };
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return null;
    }

    // Extract user ID and email
    //   const userId = headersList.get("x-user-id");
    //   const userEmail = headersList.get("x-user-email");

    //   if (!userId) {
    //     console.warn("No user ID found in headers");
    //     return null;
    //   }

    //   return {
    //     uid: userId,
    //     email: userEmail,
    //   };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}
