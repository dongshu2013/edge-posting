import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
    
    

    const body = await request.json();
    // referralCode is empty means user skip referral code
    const { referralCode } = body;

    if (!!referralCode) {
      if (referralCode === dbUser.referralCode) {
        return NextResponse.json({ error: "Can not refer to yourself" });
      }

      const invitorUser = await prisma.user.findUnique({
        where: {
          referralCode: referralCode,
        },
      });
      if (!invitorUser) {
        return NextResponse.json({ error: "Referral code not valid" });
      }
    }

    const referral = await prisma.referral.create({
      data: {
        invitedUserId: user.uid,
        referralCode: referralCode || null,
      },
    });

    return NextResponse.json({ success: true, data: referral });
  } catch (error) {
    console.error("Failed to create referral:", error);
    return NextResponse.json(
      { error: "Failed to create buzz" },
      { status: 500 }
    );
  }
}
