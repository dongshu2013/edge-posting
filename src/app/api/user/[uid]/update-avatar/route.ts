import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    try {
      const userData = await getAuthUser();

      const { uid } = await params;

      // Only allow users to update their own profile
      if (userData?.uid !== uid) {
        console.error("User ID mismatch:", userData?.uid, "vs", uid);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await request.json();
      const { avatar } = body;

      if (!avatar) {
        return NextResponse.json(
          { error: "Photo URL is required" },
          { status: 400 }
        );
      }

      // Prepare update data
      const updateData: { avatar?: string } = {};
      updateData.avatar = avatar;

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { uid: userData.uid },
        data: updateData,
      });

      return NextResponse.json(updatedUser);
    } catch (verifyError) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
