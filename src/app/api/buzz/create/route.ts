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
      instructions,
      deadline,
      tokenAmount,
      paymentToken,
      customTokenAddress,
      transactionHash,
      rewardSettleType,
      maxParticipants,
      participantMinimumTokenAmount,
      shareOfKols,
      shareOfHolders,
      shareOfOthers,
    }: CreateBuzzRequest = body;

    // 验证必填字段
    if (
      !tweetLink ||
      !instructions ||
      !deadline ||
      !transactionHash ||
      !paymentToken ||
      !tokenAmount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (paymentToken !== "BNB" && !customTokenAddress) {
      return NextResponse.json(
        { error: "Custom token address is required" },
        { status: 400 }
      );
    }

    if (rewardSettleType === "fixed" && !Number(maxParticipants)) {
      return NextResponse.json(
        { error: "Max participants is required" },
        { status: 400 }
      );
    }

    const shareOfKolsNumber = shareOfKols ? Number(shareOfKols) : 0;
    const shareOfHoldersNumber = shareOfHolders ? Number(shareOfHolders) : 0;
    const shareOfOthersNumber = shareOfOthers ? Number(shareOfOthers) : 0;
    const totalShare = shareOfKolsNumber + shareOfHoldersNumber + shareOfOthersNumber;
    if (totalShare !== 100) {
      return NextResponse.json(
        { error: "Total share must be 100" },
        { status: 400 }
      );
    }

    const publicClient = getPublicClient(
      Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
    );
    if (!publicClient) {
      return NextResponse.json(
        { error: "Public client not found" },
        { status: 500 }
      );
    }

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });
    if (!receipt || receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction verify failed" },
        { status: 400 }
      );
    }

    const transaction = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`,
      // hash: "0x13c709dbce119393c760e4e195bc8c043de6b475862ecd1f467ddfe408c41b32",
    });
    // console.log("transaction", transaction);
    // console.log("receipt", receipt);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 400 }
      );
    }

    if (
      transaction.to?.toLowerCase() !==
      process.env.NEXT_PUBLIC_BSC_CA?.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Transaction to address mismatch" },
        { status: 400 }
      );
    }

    // Get token metadata
    const tokenMetadata = await getTokenMetadata(
      customTokenAddress || zeroAddress
    );
    if (!tokenMetadata) {
      return NextResponse.json(
        { error: "Token metadata not found" },
        { status: 400 }
      );
    }

    // Check transaction
    if (paymentToken === "BNB") {
      // Format transaction value from wei to ether for display
      const transactionValueInEther = (
        Number(transaction.value) / 1e18
      ).toFixed(6);

      console.log("Transaction Details:", {
        value: transactionValueInEther + " BNB",
        from: transaction.from,
        to: transaction.to,
        gasUsed: receipt.gasUsed.toString(),
      });

      // Check transaction amount
      if (
        transaction.value <
        parseEther(tokenAmount.toString()) +
          parseEther(BNB_COMMISSION_FEE.toString())
      ) {
        return NextResponse.json(
          { error: "Transaction amount mismatch" },
          { status: 400 }
        );
      }
    } else {
      // Check commission amount
      if (transaction.value < parseEther(BNB_COMMISSION_FEE.toString())) {
        return NextResponse.json(
          { error: "Transaction amount not enough" },
          { status: 400 }
        );
      }

      // Check BEP20 transfer amount
      // Standard ERC20/BEP20 Transfer event topic
      const transferEventTopic =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

      console.log(receipt.logs);

      // Find the Transfer event log
      const transferLog = receipt.logs.find(
        (log) =>
          log.topics[0] === transferEventTopic &&
          log.address.toLowerCase() === customTokenAddress?.toLowerCase()
      );

      if (!transferLog) {
        return NextResponse.json(
          { error: "BEP20 token transfer not found in transaction" },
          { status: 400 }
        );
      }

      // Extract transfer details
      // topics[1] is the from address (padded to 32 bytes)
      // topics[2] is the to address (padded to 32 bytes)
      // data is the amount (as a hex string)
      const fromAddress = `0x${transferLog.topics[1]?.slice(-40) || ""}`;
      const toAddress = `0x${transferLog.topics[2]?.slice(-40) || ""}`;
      const amountHex = transferLog.data;

      // Convert hex amount to decimal
      const tokenTransferAmount = BigInt(amountHex);

      console.log("BEP20 Token Transfer Details:", {
        token: customTokenAddress,
        from: fromAddress,
        to: toAddress,
        amount: tokenTransferAmount.toString(),
      });

      // Verify sender
      if (fromAddress.toLowerCase() !== transaction.from.toLowerCase()) {
        return NextResponse.json(
          { error: "Token sender address mismatch" },
          { status: 400 }
        );
      }

      // Verify recipient
      if (
        toAddress.toLowerCase() !==
        process.env.NEXT_PUBLIC_BSC_CA?.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Token recipient address mismatch" },
          { status: 400 }
        );
      }

      // Verify amount - need to convert expected amount to BigInt for comparison
      // Note: You may need to adjust the decimal places based on the token's decimals
      const expectedAmount = BigInt(
        math
          .bignumber(tokenAmount)
          .times(math.bignumber(10).pow(tokenMetadata.decimals))
          .toString()
      );
      if (tokenTransferAmount < expectedAmount) {
        return NextResponse.json(
          { error: "Token transfer amount is less than required" },
          { status: 400 }
        );
      }
    }

    // 计算所需总金额
    // const rewardAmount = parseFloat(price) * numberOfReplies;
    // const commissionAmount = rewardAmount * COMMISSION_RATE;
    // const totalAmount = rewardAmount + commissionAmount;

    // 检查用户余额
    // const userBalance = await prisma.user.findUnique({
    //   where: { uid: user.uid },
    //   select: { balance: true },
    // });

    // if (!userBalance || userBalance.balance < totalAmount) {
    //   return NextResponse.json(
    //     { error: "Insufficient balance" },
    //     { status: 400 }
    //   );
    // }

    // 创建 buzz、扣除余额并创建交易记录
    const result = await prisma.$transaction(async (tx: any) => {
      // 扣除用户余额
      // await tx.user.update({
      //   where: { uid: user.uid },
      //   data: { balance: { decrement: totalAmount } },
      // });

      // 创建 buzz
      const buzz = await tx.buzz.create({
        data: {
          tweetLink,
          instructions,
          createdBy: user.uid,
          deadline: new Date(deadline),
          tokenAmount: tokenAmount.toString(),
          tokenDecimals: tokenMetadata.decimals,
          paymentToken: tokenMetadata.symbol || paymentToken,
          customTokenAddress: customTokenAddress || zeroAddress,
          transactionHash,
          rewardSettleType,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          participantMinimumTokenAmount:
            participantMinimumTokenAmount &&
            Number(participantMinimumTokenAmount) > 0
              ? participantMinimumTokenAmount.toString()
              : null,
          shareOfKols: shareOfKolsNumber,
          shareOfHolders: shareOfHoldersNumber,
          shareOfOthers: shareOfOthersNumber,
        },
      });

      //   // 创建交易记录
      //   const transaction = await tx.transaction.create({
      //     data: {
      //       amount: rewardAmount,
      //       type: "BURN",
      //       status: "COMPLETED",
      //       fromAddress: user.uid,
      //       toAddress: "SYSTEM",
      //       buzzId: buzz.id,
      //       settledAt: new Date(),
      //     },
      //   });

      //   // Check user referral
      //   let txCommissionAmount = commissionAmount;
      //   const referral = await tx.referral.findUnique({
      //     where: {
      //       invitedUserId: user.uid,
      //     },
      //   });

      //   if (referral?.invitorUserId) {
      //     const txReferralRewardAmount = Number(
      //       (commissionAmount / 2).toFixed(2)
      //     );
      //     txCommissionAmount = commissionAmount - txReferralRewardAmount;
      //     // Create referral reward transaction
      //     await tx.transaction.create({
      //       data: {
      //         amount: txReferralRewardAmount,
      //         type: "REFERRAL_REWARD",
      //         status: "COMPLETED",
      //         fromAddress: user.uid,
      //         toAddress: referral.invitorUserId,
      //         buzzId: buzz.id,
      //         settledAt: new Date(),
      //       },
      //     });
      //     // Send referral reward to invitor
      //     await tx.user.update({
      //       where: { uid: referral.invitorUserId },
      //       data: { balance: { increment: txReferralRewardAmount } },
      //     });
      //   }

      //   // Create commission fee transaction
      //   await tx.transaction.create({
      //     data: {
      //       amount: txCommissionAmount,
      //       type: "BURN",
      //       status: "COMPLETED",
      //       fromAddress: user.uid,
      //       toAddress: "SYSTEM",
      //       buzzId: buzz.id,
      //       settledAt: new Date(),
      //     },
      //   });

      return { buzz };
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
