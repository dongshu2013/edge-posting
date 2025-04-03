import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const area = searchParams.get("area");

    const where: any = {
      status: "confirmed",
    };
    if (area) {
      where.area = parseInt(area);
    }
    const kols = await prisma.kol.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalCount = await prisma.kol.count({
      where,
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
