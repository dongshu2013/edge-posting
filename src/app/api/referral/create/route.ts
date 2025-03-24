import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // referralCode is empty means user skip referral code
    const { referralCode } = body;

    if (!!referralCode) {
      if (referralCode === user.uid) {
        return NextResponse.json({ error: "Can not refer to yourself" });
      }

      const invitorUser = await prisma.user.findUnique({
        where: {
          uid: referralCode,
        },
      });
      if (!invitorUser) {
        return NextResponse.json({ error: "Referral code not valid" });
      }
    }

    const referral = await prisma.referral.create({
      data: {
        invitedUserId: user.uid,
        invitorUserId: referralCode || null,
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
