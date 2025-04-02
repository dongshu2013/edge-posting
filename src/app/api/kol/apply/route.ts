import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("authUser", authUser);

    const currentUser = await prisma.user.findUnique({
      where: {
        uid: authUser.uid,
      },
    });

    console.log("currentUser", currentUser);

    if (
      currentUser?.kolStatus === "confirmed" ||
      currentUser?.kolStatus === "pending"
    ) {
      return NextResponse.json(
        { error: "User already applied" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        uid: authUser.uid,
      },
      data: {
        kolStatus: "pending",
      },
    });

    return NextResponse.json({
      success: !!updatedUser,
    });
  } catch (error) {
    console.error("Error applying to become a KOL:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}
