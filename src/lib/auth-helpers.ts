import { headers } from "next/headers";

export interface AuthUser {
  uid: string;
  email: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Get headers from the request
    const headersList = await headers();
    
    // Extract user ID and email
    const userId = headersList.get("x-user-id");
    const userEmail = headersList.get("x-user-email");

    if (!userId) {
      console.warn("No user ID found in headers");
      return null;
    }

    return {
      uid: userId,
      email: userEmail,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}
