import { COMMISSION_RATE } from "@/config/common";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { authTwitter } from "@/utils/xUtils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      tweetLink,
      instructions,
      price,
      deadline,
      numberOfReplies = 100,
    } = body;

    // 验证必填字段
    if (!tweetLink || !instructions || !price || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 计算所需总金额
    const rewardAmount = parseFloat(price) * numberOfReplies;
    const commissionAmount = rewardAmount * COMMISSION_RATE;
    const totalAmount = rewardAmount + commissionAmount;

    // 检查用户余额
    const userBalance = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { balance: true },
    });

    if (!userBalance || userBalance.balance < totalAmount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // 创建 buzz、扣除余额并创建交易记录
    const result = await prisma.$transaction(async (tx) => {
      // 扣除用户余额
      await tx.user.update({
        where: { uid: user.uid },
        data: { balance: { decrement: totalAmount } },
      });

      // 创建 buzz
      const buzz = await tx.buzz.create({
        data: {
          tweetLink,
          instructions,
          price: parseFloat(price),
          createdBy: user.uid,
          deadline: new Date(deadline),
          totalReplies: numberOfReplies,
        },
      });

      // 创建交易记录
      const transaction = await tx.transaction.create({
        data: {
          amount: rewardAmount,
          type: "BURN",
          status: "COMPLETED",
          fromAddress: user.uid,
          toAddress: "SYSTEM",
          buzzId: buzz.id,
          settledAt: new Date(),
        },
      });

      // Check user referral
      let txCommissionAmount = commissionAmount;
      const referral = await tx.referral.findUnique({
        where: {
          invitedUserId: user.uid,
        },
      });

      if (referral?.invitorUserId) {
        const txReferralRewardAmount = Number(
          (commissionAmount / 2).toFixed(2)
        );
        txCommissionAmount = commissionAmount - txReferralRewardAmount;
        // Create referral reward transaction
        await tx.transaction.create({
          data: {
            amount: txReferralRewardAmount,
            type: "REFERRAL_REWARD",
            status: "COMPLETED",
            fromAddress: user.uid,
            toAddress: referral.invitorUserId,
            buzzId: buzz.id,
            settledAt: new Date(),
          },
        });
        // Send referral reward to invitor
        await tx.user.update({
          where: { uid: referral.invitorUserId },
          data: { balance: { increment: txReferralRewardAmount } },
        });
      }

      // Create commission fee transaction
      await tx.transaction.create({
        data: {
          amount: txCommissionAmount,
          type: "BURN",
          status: "COMPLETED",
          fromAddress: user.uid,
          toAddress: "SYSTEM",
          buzzId: buzz.id,
          settledAt: new Date(),
        },
      });

      return { buzz, transaction };
    });

    // Trigger QStash API to schedule the settle-rewards cron job
    try {
      const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/settle-rewards`;
      const qstashEndpoint = `https://qstash.upstash.io/v2/publish/${targetUrl}`;

      const delayInSeconds = Math.floor(
        (new Date(deadline).getTime() - Date.now()) / 1000
      );
      const publishRes = await fetch(qstashEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Delay": `${delayInSeconds}s`, // delay in seconds
        },
        body: JSON.stringify({
          cronSecret: process.env.CRON_SECRET,
          buzzId: result.buzz.id,
        }),
      });

      if (!publishRes.ok) {
        throw new Error(`QStash API error: ${publishRes.statusText}`);
      }

      const qstashResponse = await publishRes.json();
      console.log("publishRes", qstashResponse);
    } catch (qstashError) {
      console.error("Failed to schedule QStash job:", qstashError);
      // Continue execution even if QStash scheduling fails
    }

    // Get twitter text
    try {
      const beaerToken = await authTwitter();
      const twitterId = tweetLink.split("/").pop();

      const twitterResponse = await fetch(
        `https://api.twitter.com/2/tweets/${twitterId}`,
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
        throw new Error(
          `Twitter API error: ${twitterResponse.status} ${twitterResponse.statusText}`
        );
      }

      const twitterData = await twitterResponse.json();
      const fullText = twitterData?.data?.text || "";
      await prisma.buzz.update({
        where: { id: result.buzz.id },
        data: { tweetText: fullText },
      });
    } catch (twitterError) {
      console.error("Failed to get twitter text:", twitterError);
    }

    return NextResponse.json(result.buzz);
  } catch (error) {
    console.error("Failed to create buzz:", error);
    return NextResponse.json(
      { error: "Failed to create buzz" },
      { status: 500 }
    );
  }
}
