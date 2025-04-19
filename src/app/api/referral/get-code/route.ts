import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        uid: user.uid,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.referralCode) {
      const referralCode = generateReferralCode();
      const updatedUser = await prisma.user.update({
        where: { uid: user.uid },
        data: { referralCode },
      });

      return NextResponse.json({ referralCode: updatedUser.referralCode });
    }

    return NextResponse.json({ referralCode: dbUser.referralCode });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateReferralCode() {
  // 6 characters
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
