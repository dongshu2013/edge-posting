import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log("Update username request received for user:", params.uid);

    // Get auth token from request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      console.error("No token found in authorization header");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify token by calling our verify-token endpoint
    try {
      const verifyResponse = await fetch(
        new URL("/api/auth/verify-token", request.url),
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (!verifyResponse.ok) {
        console.error(
          "Token verification failed:",
          await verifyResponse.text()
        );
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      const userData = await verifyResponse.json();
      console.log("User data from token:", userData);

      const { uid } = params;

      // Only allow users to update their own username
      if (userData.uid !== uid) {
        console.error("User ID mismatch:", userData.uid, "vs", uid);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await request.json();
      const { username } = body;

      if (!username) {
        console.error("username is required");
        return NextResponse.json(
          { error: "username is required" },
          { status: 400 }
        );
      }

      console.log("Updating username for user:", uid, "to:", username);

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            uid: userData.uid,
          },
        },
      });

      if (existingUser) {
        console.error("Nickname already taken:", username);
        return NextResponse.json(
          { error: "username is already taken" },
          { status: 400 }
        );
      }

      // Update nickname
      const updatedUser = await prisma.user.update({
        where: { uid: userData.uid },
        data: { username },
      });

      console.log("Username updated successfully:", updatedUser);
      return NextResponse.json(updatedUser);
    } catch (verifyError) {
      console.error("Error verifying token:", verifyError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
