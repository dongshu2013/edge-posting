import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const createdBy = searchParams.get("createdBy");
    const cursor = searchParams.get("cursor");
    const limit = 10; // Number of items per page

    // Build the query
    const query: Prisma.BuzzFindManyArgs = {
      where: {
        ...(createdBy && { createdBy }),
      },
      take: limit + 1, // Take one extra to know if there are more items
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        tweetLink: true,
        instructions: true,
        price: true,
        createdAt: true,
        createdBy: true,
        deadline: true,
        replyCount: true,
        totalReplies: true,
        isActive: true,
        user: {
          select: {
            username: true,
          },
        },
      },
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
    };

    const buzzes = await prisma.buzz.findMany(query);

    // Check if there are more items
    const hasMore = buzzes.length > limit;
    const items = hasMore ? buzzes.slice(0, -1) : buzzes;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Failed to fetch buzzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch buzzes" },
      { status: 500 }
    );
  }
}
