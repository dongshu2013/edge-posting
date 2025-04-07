import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { zeroAddress } from "viem";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Api key is required" },
        { status: 401 }
      );
    }

    const userApiKey = await prisma.userApiKey.findUnique({
      where: {
        apiKey,
      },
    });
    if (!userApiKey) {
      return NextResponse.json({ error: "Invalid api key" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        uid: userApiKey.userId,
      },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = 10; // Number of items per page
    const sortBy =
      (searchParams.get("sortBy") as "newest" | "price" | "engagement") ||
      "newest";
    const filterToken = searchParams.get("filterToken") === "true";

    const repliedBuzzes = await prisma.reply.findMany({
      where: {
        createdBy: dbUser?.uid,
      },
      select: {
        buzzId: true,
      },
    });
    const excludedBuzzIds = repliedBuzzes.map((reply) => reply.buzzId);

    let filterTokenAddresses: string[] = [];
    if (filterToken) {
      const userBalances = await prisma.userBalance.findMany({
        where: {
          userId: dbUser?.uid,
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
        ...{ deadline: { gt: new Date() } },
        ...(excludedBuzzIds.length > 0 && { id: { notIn: excludedBuzzIds } }),
        ...(filterToken && {
          customTokenAddress: { in: filterTokenAddresses },
        }),
      },
      take: limit,
      orderBy: {
        ...(sortBy === "newest" && { createdAt: "desc" }),
        ...(sortBy === "price" && { price: "desc" }),
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
        user: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    };

    const buzzes = await prisma.buzz.findMany(query);

    // Check if there are more items

    return NextResponse.json({
      buzzList: buzzes,
    });
  } catch (error) {
    console.error("Failed to fetch buzzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch buzzes" },
      { status: 500 }
    );
  }
}
