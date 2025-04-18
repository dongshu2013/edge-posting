import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const areas = searchParams.get("areas");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const sortField = searchParams.get("sortField");
    const sortDirection = searchParams.get("sortDirection");
    console.log("areas", areas);

    const where: any = {
      status: "confirmed",
    };
    if (areas) {
      if (!areas.includes("0")) {
        where.area = {
          in: areas.split(",").map((area) => parseInt(area)),
        };
      }
    }
    if (minScore) {
      where.score = {
        gte: parseInt(minScore),
      };
    }
    if (maxScore) {
      where.score = {
        lte: parseInt(maxScore),
      };
    }

    const orderBy: any = {};
    if (sortField) {
      orderBy[sortField] = sortDirection || "desc";
    }

    const kols = await prisma.kol.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
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
