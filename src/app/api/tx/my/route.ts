import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = 10;

    const txs = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAddress: user.uid }, { toAddress: user.uid }],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalCount = await prisma.transaction.count({
      where: {
        OR: [{ fromAddress: user.uid }, { toAddress: user.uid }],
      },
    });

    return NextResponse.json({
      items: txs,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
