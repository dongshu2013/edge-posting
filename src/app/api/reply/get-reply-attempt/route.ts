import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getRateLimiter } from "@/lib/rateLimiter";
import { replyHandler } from "@/lib/replyHandler";
import { getUserRole } from "@/utils/commonUtils";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const buzzId = request.nextUrl.searchParams.get("buzzId");
    if (!buzzId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const replyAttempt = await prisma.replyAttempt.findFirst({
      where: {
        buzzId,
        userId,
      },
    });

    return NextResponse.json({ replyAttempt });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
