import { BNB_COMMISSION_FEE, COMMISSION_RATE } from "@/config/common";
import { getAuthUser } from "@/lib/auth-helpers";
import { getPublicClient } from "@/lib/ethereum";
import { prisma } from "@/lib/prisma";
import { getTokenMetadata } from "@/utils/evmUtils";
import { authTwitter } from "@/utils/xUtils";
import { NextResponse } from "next/server";
import { parseEther, zeroAddress } from "viem";
import * as math from "mathjs";

export interface CreateBuzzRequest {
  tweetLink: string;
  instructions: string;
  deadline: string;
  tokenAmount: number;
  paymentToken: string;
  customTokenAddress?: string;
  transactionHash: string;
  rewardSettleType: string;
  maxParticipants?: number;
  participantMinimumTokenAmount?: number;
  shareOfKols: number;
  shareOfHolders: number;
  shareOfOthers: number;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      tweetLink,
      tokenAmount,
      paymentToken,
      customTokenAddress,
    }: CreateBuzzRequest = body;

    // 验证必填字段
    if (!tweetLink || !paymentToken || !tokenAmount) {
      return NextResponse.json({ error: "Missing required fields" });
    }

    if (paymentToken !== "BNB" && !customTokenAddress) {
      return NextResponse.json({ error: "Custom token address is required" });
    }

    // Get twitter text
    let tweetText = "";
    try {
      const infoResponse = await fetch(
        `https://api.tweetscout.io/v2/tweet-info`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ApiKey: `${process.env.TWEETSCOUT_API_KEY}`,
          },
          body: JSON.stringify({
            tweet_link: tweetLink,
          }),
        }
      );
      const tweetscoutInfo = await infoResponse.json();

      if (!tweetscoutInfo?.full_text) {
        return NextResponse.json({ error: "Tweet not found" });
      }

      if (
        // tweetscoutInfo.retweeted_status ||
        // tweetscoutInfo.quoted_status ||
        tweetscoutInfo.in_reply_to_status_id_str
      ) {
        return NextResponse.json({
          error: "Tweet is a retweet or quote or reply",
          success: false,
        });
      }

      tweetText = tweetscoutInfo.full_text;
    } catch (twitterError) {
      console.error("Failed to get twitter text:", twitterError);
      return NextResponse.json({ error: "Failed to get twitter text" });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check buzz" });
  }
}
