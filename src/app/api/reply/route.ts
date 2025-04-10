import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";
import { authTwitter } from "@/utils/xUtils";

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

    const dbUser = await prisma.user.findUnique({
      where: {
        uid: userId,
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
    const { buzzId } = body;

    if (!buzzId) {
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

    // Validate the reply link is reply to the buzz
    const checkCommentResponse = await fetch(
      `https://api.tweetscout.io/v2/check-comment?tweet_link=${buzz.tweetLink}&user_handle=${dbUser.twitterUsername}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
        },
        method: "GET",
      }
    );
    const checkComment = await checkCommentResponse.json();
    console.log(checkComment);
    if (!checkComment.commented || !checkComment.tweet) {
      return NextResponse.json({ error: "No reply found" }, { status: 400 });
    }

    // Check if the buzz is still active
    const isExpired = !buzz.isActive || new Date() >= buzz.deadline;

    // Check if the buzz is already settled
    // if (buzz.isSettled) {
    //   return NextResponse.json(
    //     { error: "This buzz has already been settled" },
    //     { status: 400 }
    //   );
    // }

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

    // Create the reply with PENDING status
    const reply = await prisma.reply.create({
      data: {
        buzzId,
        replyLink: `https://x.com/games_zawa/status/${checkComment.tweet.id_str}`,
        text: checkComment.tweet.full_text,
        createdBy: userId,
        status: "PENDING",
      },
    });

    // Increment the reply count
    await prisma.buzz.update({
      where: { id: buzzId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("Error in reply API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
