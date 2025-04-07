import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing buzz ID" }, { status: 400 });
  }

  const page = request.nextUrl.searchParams.get("page") || 1;
  const limit = request.nextUrl.searchParams.get("limit") || 10;

  const authedUser = await getAuthUser();

  try {
    const settleHistories = await prisma.settleHistory.findMany({
      where: {
        buzzId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
        kol: {
          select: {
            nickname: true,
            twitterUsername: true,
          },
        },
        buzz: {
          select: {
            paymentToken: true,
            tokenDecimals: true,
          },
        },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalCount = await prisma.settleHistory.count({
      where: {
        buzzId: id,
      },
    });

    return NextResponse.json({
      settleHistories,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching buzz:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
