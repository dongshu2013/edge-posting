import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referral = await prisma.referral.findUnique({
      where: {
        invitedUserId: user.uid,
      },
    });

    // await prisma.referral.deleteMany({
    //   where: {
    //     invitedUserId: user.uid,
    //   },
    // });

    return NextResponse.json({ showReferral: !referral });
  } catch (error) {}
}
