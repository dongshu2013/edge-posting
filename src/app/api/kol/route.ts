import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const kols = await prisma.user.findMany({
      where: {
        kolStatus: "confirmed",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalCount = await prisma.user.count({
      where: {
        kolStatus: "confirmed",
      },
    });

    return NextResponse.json({
      items: kols,
      totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch kols:", error);
    return NextResponse.json(
      { error: "Failed to fetch kols" },
      { status: 500 }
    );
  }
}
