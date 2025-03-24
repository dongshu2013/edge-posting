import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log("Update profile request received for user:", params.uid);

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

    try {
      const userData = await getAuthUser();

      const { uid } = await params;

      // Only allow users to update their own profile
      if (userData?.uid !== uid) {
        console.error("User ID mismatch:", userData?.uid, "vs", uid);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await request.json();
      const { bio } = body;

      if (!bio) {
        console.error("At least one of bio or mood is required");
        return NextResponse.json(
          { error: "At least one of bio or mood is required" },
          { status: 400 }
        );
      }

      // Prepare update data
      const updateData: { bio?: string } = {};
      if (bio !== undefined) updateData.bio = bio;

      console.log("Updating profile for user:", uid, "with data:", updateData);

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { uid: userData.uid },
        data: updateData,
      });

      console.log("Profile updated successfully:", updatedUser);
      return NextResponse.json(updatedUser);
    } catch (verifyError) {
      console.error("Error verifying token:", verifyError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
