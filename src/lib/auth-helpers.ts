import { headers } from "next/headers";

export interface AuthUser {
  uid: string;
  email: string | null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userEmail = headersList.get("x-user-email");

    if (!userId) return null;

    return {
      uid: userId,
      email: userEmail,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}
