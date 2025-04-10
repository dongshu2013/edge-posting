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

    const body = await request.json();

    const { buzzId, replyLink, text } = body;

    if (!buzzId || !replyLink || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the reply link format (basic check)
    if (
      !replyLink.match(/^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/.+$/)
    ) {
      return NextResponse.json(
        { error: "Invalid reply link format" },
        { status: 400 }
      );
    }

    // Get the buzz to check if it exists and is active
    const buzz = await prisma.buzz.findUnique({
      where: { id: buzzId },
    });

    if (!buzz) {
      return NextResponse.json({ error: "Buzz not found" }, { status: 404 });
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

    try {
      const beaerToken = await authTwitter();
      const replyTwitterId = replyLink.split("/").pop();
      const twitterResponse = await fetch(
        `https://api.twitter.com/2/tweets/${replyTwitterId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: beaerToken,
          },
        }
      );

      if (!twitterResponse.ok) {
        return NextResponse.json(
          { error: "Failed to get reply tweet" },
          { status: 400 }
        );
      }

      const replyTweetData = await twitterResponse.json();
      console.log(replyTweetData);
      const replyText = replyTweetData.data.text as string;
      if (!replyText.trim().includes(text.trim())) {
        return NextResponse.json(
          { error: "Reply text does not match" },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error("Error in reply API:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Create the reply with PENDING status
    const reply = await prisma.reply.create({
      data: {
        buzzId,
        replyLink,
        text,
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
