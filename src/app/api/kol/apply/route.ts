import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        uid: authUser.uid,
      },
    });

    if (!currentUser?.twitterUsername) {
      return NextResponse.json(
        { error: "User not linked to Twitter" },
        { status: 400 }
      );
    }

    const { area } = await request.json();
    if (!area) {
      return NextResponse.json({ error: "Area is required" }, { status: 400 });
    }

    try {
      const infoResponse = await fetch(
        `https://api.tweetscout.io/v2/info/${currentUser.twitterUsername}`,
        {
          headers: {
            Accept: "application/json",
            ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
          },
        }
      );
      const tweetscoutInfo = await infoResponse.json();

      const scoreResponse = await fetch(
        `https://api.tweetscout.io/v2/score/${currentUser.twitterUsername}`,
        {
          headers: {
            Accept: "application/json",
            ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
          },
        }
      );
      const scoreData = await scoreResponse.json();

      await prisma.kol.create({
        data: {
          twitterUsername: currentUser.twitterUsername,
          area: area,
          avatar: tweetscoutInfo.avatar,
          nickname: tweetscoutInfo.name || tweetscoutInfo.screen_name,
          followers: tweetscoutInfo.followers_count,
          description: tweetscoutInfo.description || "",
          score: scoreData?.score || 1,
          status: "pending",
          userId: currentUser.uid,
        },
      });

      return NextResponse.json({
        success: true,
      });
    } catch (err: any) {
      console.log(`Error applying to become a KOL`, err);
      return NextResponse.json(
        { error: err.message || "Failed to apply to become a KOL" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error applying to become a KOL:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}
