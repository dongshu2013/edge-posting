import { NextRequest, NextResponse } from "next/server";
// import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // await adminAuth.getUser(uid);

    const user = await prisma.user.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        totalEarned: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
}
