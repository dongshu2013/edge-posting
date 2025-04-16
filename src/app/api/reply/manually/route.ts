import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getRateLimiter } from "@/lib/rateLimiter";
import { replyHandler } from "@/lib/replyHandler";
import { getUserRole } from "@/utils/commonUtils";
import dayjs from "dayjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let userId = null;

    const userData = await getAuthUser();
    if (userData) {
      userId = userData.uid;
    } else {
      const apiKey = request.headers.get("x-api-key");
      const userApiKey = await prisma.userApiKey.findUnique({
        where: {
          apiKey: apiKey || "",
        },
      });

      if (userApiKey) {
        userId = userApiKey.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const identifier = `reply-${userId}`;
    const rateLimiter = getRateLimiter(identifier, {
      tokensPerInterval: 6,
      interval: "minute",
    });

    const isRateLimited = rateLimiter.tryRemoveTokens(1);
    if (!isRateLimited) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        uid: userId,
      },
      include: {
        kolInfo: true,
      },
    });

    if (!dbUser?.bindedWallet) {
      return NextResponse.json(
        { error: "Please bind your wallet first" },
        { status: 400 }
      );
    }
    if (!dbUser?.twitterUsername) {
      return NextResponse.json(
        { error: "Please bind your twitter account first" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { buzzId, replyLink } = body;

    if (!buzzId || !replyLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const buzz = await prisma.buzz.findUnique({
      where: { id: buzzId },
    });
    if (!buzz) {
      return NextResponse.json({ error: "Buzz not found" }, { status: 404 });
    }

    // Check if the buzz is still active
    const isExpired = !buzz.isActive || new Date() >= buzz.deadline;
    // Check if the buzz is already settled
    if (buzz.isSettled || isExpired) {
      return NextResponse.json(
        { error: "This buzz has already been settled" },
        { status: 400 }
      );
    }

    // Check if the user has already replied to this buzz
    const existingReply = await prisma.reply.findFirst({
      where: {
        buzzId,
        createdBy: userId,
      },
    });

    if (existingReply) {
      return NextResponse.json(
        { error: "You have already replied to this buzz" },
        { status: 400 }
      );
    }

    const { userRole } = await getUserRole(dbUser, buzz);
    if (!userRole) {
      return NextResponse.json(
        { error: "You are not allowed to reply to this buzz" },
        { status: 400 }
      );
    }

    // Validate the reply link is reply to the buzz
    const tweetInfoResponse = await fetch(
      `https://api.tweetscout.io/v2/tweet-info`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          tweet_link: replyLink,
        }),
      }
    );
    const tweetInfo = await tweetInfoResponse.json();

    const buzzTweetId = buzz.tweetLink.split("/").pop();

    if (
      tweetInfo?.in_reply_to_status_id_str !== buzzTweetId ||
      tweetInfo?.user?.screen_name !== dbUser.twitterUsername
    ) {
      return NextResponse.json(
        { error: "Invalid reply link" },
        { status: 400 }
      );
    }

    await prisma.replyAttempt.deleteMany({
      where: {
        buzzId,
        userId,
      },
    });

    // Create the reply with PENDING status
    const reply = await prisma.reply.create({
      data: {
        buzzId,
        replyLink: replyLink,
        text: tweetInfo.full_text,
        createdBy: userId,
        status: "PENDING",
        userRole: userRole,
      },
    });

    await prisma.buzz.update({
      where: { id: buzzId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in reply API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
