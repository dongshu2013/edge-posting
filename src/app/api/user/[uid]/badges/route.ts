import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uid } = await params;
    // Only allow users to view their own transactions
    if (user.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all transactions where the user is either the sender or receiver
    const dbUser = await prisma.user.findFirst({
      where: {
        uid: user.uid,
      },
      select: {
        kolInfo: {
          select: {
            status: true,
          },
        },
      },
    });

    const badges =
      dbUser?.kolInfo?.status === "confirmed" ? [{ type: "kol" }] : [];

    const existingBuzz = await prisma.buzz.findFirst({
      where: {
        createdBy: user.uid,
      },
    });

    if (existingBuzz) {
      badges.push({ type: "task_published" });
    }

    const existingReplies = await prisma.reply.findFirst({
      where: {
        createdBy: user.uid,
      },
    });

    if (existingReplies) {
      badges.push({ type: "task_done" });
    }

    return NextResponse.json({ badges });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
