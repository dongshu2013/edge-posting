import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getAuthUser } from "@/lib/auth-helpers";
import { getRateLimiter } from "@/lib/rateLimiter";
import { prisma } from "@/lib/prisma";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { checkIfUserFollowsTwitter } from "@/utils/xUtils";
import { getUserRole } from "@/utils/commonUtils";

export async function POST(request: Request) {
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
    return NextResponse.json({
      code: 201,
      error: "Please bind your wallet first",
    });
  }

  const { instructions, tweetText, buzzId } = await request.json();
  const existingReply = await prisma.reply.findFirst({
    where: {
      createdBy: userId,
      buzzId: buzzId,
    },
  });
  const existingReplyAttempt = await prisma.replyAttempt.findFirst({
    where: {
      buzzId,
      userId,
    },
  });

  if (existingReply || existingReplyAttempt) {
    return NextResponse.json({
      error: "You have already replied to this buzz",
    });
  }

  const identifier = `generate-reply-${userId}`;
  const rateLimiter = getRateLimiter(identifier, {
    tokensPerInterval: 6,
    interval: "minute",
  });

  const isRateLimited = rateLimiter.tryRemoveTokens(1);
  if (!isRateLimited) {
    return NextResponse.json({ error: "Rate limited" });
  }

  const user = await prisma.user.findUnique({
    where: {
      uid: userId,
    },
    include: {
      kolInfo: true,
    },
  });
  const userBio = user?.bio;
  const userMood = user?.mood;

  // Check if user has followed our twitter
  const userTwitterUsername = user?.twitterUsername;
  if (!userTwitterUsername) {
    return NextResponse.json({ error: "User twitter username not found" });
  }

  const isFollowed = await checkIfUserFollowsTwitter(userTwitterUsername);
  if (!isFollowed) {
    return NextResponse.json({ error: "User not followed", code: 101 });
  }

  const buzz = await prisma.buzz.findUnique({
    where: {
      id: buzzId,
    },
  });
  if (!buzz) {
    return NextResponse.json({ error: "Buzz not found" });
  }

  const { userRole, requiredRole } = await getUserRole(user, buzz);

  if (!userRole) {
    return NextResponse.json({
      code: 103,
      error: `Only ${requiredRole} can reply to this buzz`,
    });
  }

  try {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a professional social media reply assistant. Based on the given instructions, generate a concise, friendly, and professional response. The reply should be brief, insightful, and include appropriate emojis, total length should be less than 150 characters.",
      },
    ];

    if (userBio) {
      messages.push({
        role: "user",
        content: `My bio is: ${userBio}, my mood today is: ${userMood}`,
      });
    }

    if (instructions) {
      messages.push({
        role: "user",
        content: `Here is the tweet text I wanna reply to: ${tweetText}, and reply instruction author gave me: ${instructions}, focus on the tweet text and instructions and reply to it`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "nousresearch/hermes-3-llama-3.1-70b",
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    // console.log("Completion:", completion);

    return NextResponse.json({
      success: true,
      text: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json({ error: "Failed to generate reply" });
  }
}
