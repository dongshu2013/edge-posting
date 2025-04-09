import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-helpers";
import { zeroAddress } from "viem";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();

    const searchParams = request.nextUrl.searchParams;
    const createdBy = searchParams.get("createdBy");
    const creatorTwitterUsernames =
      searchParams.get("creatorTwitterUsernames")?.split(",") || [];
    const tokenAddresses = searchParams.get("tokenAddresses")?.split(",") || [];
    const cursor = searchParams.get("cursor");
    const limit = 10; // Number of items per page
    const sortBy =
      (searchParams.get("sortBy") as "newest" | "deadline" | "engagement") ||
      "newest";
    const onlyActive = searchParams.get("onlyActive") === "true";
    const filterToken = searchParams.get("filterToken") === "true";
    const excludeReplied = searchParams.get("excludeReplied") === "true";

    let excludedBuzzIds: string[] = [];
    if (excludeReplied) {
      // Get user replied buzz ids
      if (authUser) {
        const repliedBuzzes = await prisma.reply.findMany({
          where: {
            createdBy: authUser?.uid,
          },
          select: {
            buzzId: true,
          },
        });
        excludedBuzzIds = repliedBuzzes.map((reply) => reply.buzzId);
      }
    }
    console.log(excludedBuzzIds);

    const filterWithTokenAddress = !!authUser && filterToken;
    let filterTokenAddresses: string[] = [];
    if (filterToken && authUser) {
      const userBalances = await prisma.userBalance.findMany({
        where: {
          userId: authUser?.uid,
        },
        select: {
          tokenAddress: true,
        },
      });
      filterTokenAddresses = userBalances.map(
        (balance: any) => balance.tokenAddress
      );
      filterTokenAddresses.push(zeroAddress);
    }

    // Build the query
    const query: Prisma.BuzzFindManyArgs = {
      where: {
        ...(createdBy && { createdBy }),
        ...(creatorTwitterUsernames.length > 0 && {
          user: {
            twitterUsername: {
              in: creatorTwitterUsernames,
              mode: "insensitive",
            },
          },
        }),
        ...(tokenAddresses.length > 0 && {
          customTokenAddress: {
            in: tokenAddresses,
          },
        }),
        ...(onlyActive && { deadline: { gt: new Date() } }),
        ...(excludeReplied &&
          excludedBuzzIds.length > 0 && { id: { notIn: excludedBuzzIds } }),
        ...(filterWithTokenAddress && {
          customTokenAddress: { in: filterTokenAddresses },
        }),
      },
      take: limit + 1, // Take one extra to know if there are more items
      orderBy: {
        ...(sortBy === "newest" && { createdAt: "desc" }),
        ...(sortBy === "deadline" && { deadline: "desc" }),
        ...(sortBy === "engagement" && { replyCount: "desc" }),
      },
      select: {
        id: true,
        tweetLink: true,
        instructions: true,
        createdAt: true,
        createdBy: true,
        deadline: true,
        replyCount: true,
        isActive: true,
        tokenAmount: true,
        paymentToken: true,
        customTokenAddress: true,
        rewardSettleType: true,
        maxParticipants: true,
        user: {
          select: {
            username: true,
            avatar: true,
            twitterUsername: true,
            nickname: true,
            kolInfo: {
              select: {
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
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
