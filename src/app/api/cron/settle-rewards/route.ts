import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Buzz } from "@prisma/client";
import { getPublicClient } from "@/lib/ethereum";
import { erc20Abi, formatEther, parseEther } from "viem";
import * as math from "mathjs";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

interface Reply {
  id: string;
  createdBy: string;
}

type BuzzWithReplies = Buzz & {
  replies: Reply[];
};

export async function POST(request: Request) {
  try {
    // Verify the request is from a trusted source (e.g., cron job service)
    const body = await request.json();
    const cronSecret = body.cronSecret;

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all expired, unsettled buzzes
    const expiredBuzzes = await prisma.buzz.findMany({
      where: {
        isSettled: false,
        OR: [{ deadline: { lte: new Date() } }, { isActive: false }],
      },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          where: { status: "PENDING" },
        },
      },
    });

    const results = await Promise.all(
      expiredBuzzes.map(async (buzz: BuzzWithReplies) => {
        if (buzz.rewardSettleType === "fixed") {
          await settleFixedTypeRewards(buzz);
        } else {
          await settleDefaultTypeRewards(buzz);
        }
      })
    );

    return NextResponse.json({
      message: "Settlement completed",
      settledBuzzes: results,
    });
  } catch (error) {
    console.error("Error in settle rewards job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const settleDefaultTypeRewards = async (buzz: any) => {
  const replyUserIds = buzz.replies.map((reply: any) => reply.createdBy);
  if (replyUserIds.length === 0) {
    return;
  }
  const dbUsers = await prisma.user.findMany({
    where: {
      uid: { in: replyUserIds },
    },
  });
  const dbUserMap = new Map(dbUsers.map((user: any) => [user.uid, user]));

  const userWeights = await Promise.all(
    replyUserIds.map(async (uid: string) => {
      const user = dbUserMap.get(uid);
      return await getUserFormatBalance(buzz, user);
    })
  );

  console.log("userWeights", userWeights);

  let minWeight = 0;
  userWeights.forEach((weight: number) => {
    if (weight > 0) {
      if (minWeight === 0) {
        minWeight = weight;
      } else {
        minWeight = Math.min(minWeight, weight);
      }
    }
  });
  // All users have 0 balance
  if (minWeight === 0) {
    minWeight = 1;
  }

  console.log("minWeight", minWeight);

  const refinedUserWeights = userWeights.map((weight: number) => {
    if (weight === 0) {
      return minWeight / 4;
    }
    return weight;
  });

  console.log("refinedUserWeights", refinedUserWeights);

  const totalWeight = refinedUserWeights.reduce(
    (acc: number, weight: number) => acc + weight,
    0
  );

  console.log("totalWeight", totalWeight);
  const totalTokenAmountOnChain = math
    .bignumber(buzz.tokenAmount)
    .times(math.bignumber(10).pow(buzz.tokenDecimals));

  const kolUserIds = await prisma.user.findMany({
    where: {
      kolStatus: "confirmed",
    },
    select: {
      uid: true,
    },
  });

  const kolRewardTokenAmount =
    kolUserIds.length > 0
      ? totalTokenAmountOnChain.div(math.bignumber(2))
      : math.bignumber(0);

  const userRewardTokenAmount =
    totalTokenAmountOnChain.minus(kolRewardTokenAmount);

  console.log("kolRewardTokenAmount", kolRewardTokenAmount);
  console.log("userRewardTokenAmount", userRewardTokenAmount);
  console.log("kolNumber", kolUserIds.length);

  const addUserBalance = async (
    tx: any,
    userId: string,
    amountOnChain: string
  ) => {
    const updatedBalance = await tx.userBalance.upsert({
      where: {
        // Use the unique constraint we defined in the schema
        userId_tokenAddress: {
          userId: userId,
          tokenAddress: buzz.customTokenAddress,
        },
      },
      // If no record exists, create a new one
      create: {
        userId,
        tokenAddress: buzz.customTokenAddress,
        tokenName: buzz.paymentToken,
        tokenAmountOnChain: amountOnChain,
        tokenDecimals: buzz.tokenDecimals,
      },
      // If a record exists, update the tokenAmount
      update: {
        tokenAmountOnChain: {
          // Increment the existing amount
          increment: amountOnChain,
        },
      },
    });

    return updatedBalance;
  };

  const addUserBalancesResult = await prisma.$transaction(async (tx: any) => {
    kolUserIds.forEach(async (kol: any, index: number) => {
      const kolAverageRewardTokenAmountOnChain = kolRewardTokenAmount
        .div(math.bignumber(kolUserIds.length))
        .floor()
        .toString();

      await addUserBalance(tx, kol.uid, kolAverageRewardTokenAmountOnChain);
    });

    replyUserIds.forEach(async (userId: string, index: number) => {
      // const amountOnChain =
      //   (totalTokenAmountOnChain * userWeights[index]) / totalWeight;

      const amountOnChain = userRewardTokenAmount
        .mul(math.bignumber(userWeights[index]))
        .div(math.bignumber(totalWeight))
        .floor()
        .toString();
      // Use upsert to either create a new record or update an existing one
      await addUserBalance(tx, userId, amountOnChain);
    });

    // Mark the buzz as settled
    await tx.buzz.update({
      where: { id: buzz.id },
      data: { isSettled: true },
    });
  });
};

const settleFixedTypeRewards = async (buzz: any) => {
  const totalTokenAmountOnChain = math
    .bignumber(buzz.tokenAmount)
    .times(math.bignumber(10).pow(buzz.tokenDecimals));

  const userRewardAmountOnChain = totalTokenAmountOnChain
    .div(math.bignumber(buzz.maxParticipants))
    .floor()
    .toString();

  let remainingTokenAmountOnChain = math.bignumber(totalTokenAmountOnChain);

  const replyUserIds = buzz.replies.map((reply: any) => reply.createdBy);

  const addUserBalancesResult = await prisma.$transaction(async (tx: any) => {
    replyUserIds.forEach(async (userId: string, index: number) => {
      // Check if buzz has participantMinimumTokenAmount limit
      if (
        buzz.participantMinimumTokenAmount &&
        Number(buzz.participantMinimumTokenAmount) > 0
      ) {
        const userBalance = await getUserFormatBalance(buzz, userId);
        if (userBalance < Number(buzz.participantMinimumTokenAmount)) {
          return;
        }
      }

      // Use upsert to either create a new record or update an existing one
      const updatedBalance = await tx.userBalance.upsert({
        where: {
          // Use the unique constraint we defined in the schema
          userId_tokenAddress: {
            userId: userId,
            tokenAddress: buzz.customTokenAddress,
          },
        },
        // If no record exists, create a new one
        create: {
          userId,
          tokenAddress: buzz.customTokenAddress,
          tokenName: buzz.paymentToken,
          tokenAmountOnChain: userRewardAmountOnChain,
          tokenDecimals: buzz.tokenDecimals,
        },
        // If a record exists, update the tokenAmount
        update: {
          tokenAmountOnChain: {
            // Increment the existing amount
            increment: userRewardAmountOnChain,
          },
        },
      });

      remainingTokenAmountOnChain = remainingTokenAmountOnChain.minus(
        math.bignumber(userRewardAmountOnChain)
      );
    });

    if (remainingTokenAmountOnChain.gt(0)) {
      const updatedCreatorBalance = await tx.userBalance.upsert({
        where: {
          // Use the unique constraint we defined in the schema
          userId_tokenAddress: {
            userId: buzz.createdBy,
            tokenAddress: buzz.customTokenAddress,
          },
        },
        // If no record exists, create a new one
        create: {
          userId: buzz.createdBy,
          tokenAddress: buzz.customTokenAddress,
          tokenName: buzz.paymentToken,
          tokenAmountOnChain: remainingTokenAmountOnChain.toString(),
          tokenDecimals: buzz.tokenDecimals,
        },
        // If a record exists, update the tokenAmount
        update: {
          tokenAmountOnChain: {
            // Increment the existing amount
            increment: remainingTokenAmountOnChain.toString(),
          },
        },
      });
    }

    // Mark the buzz as settled
    await tx.buzz.update({
      where: { id: buzz.id },
      data: { isSettled: true },
    });
  });
};

const getUserFormatBalance = async (buzz: any, dbUser: any) => {
  const publicClient = getPublicClient(
    Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
  );
  if (!publicClient) {
    throw new Error("Public client not found");
  }

  if (buzz.paymentToken === "BNB") {
    const userBalance = await publicClient.getBalance({
      address: dbUser.bindedWallet,
    });
    return Number(formatEther(userBalance));
  } else {
    const userBalance = await publicClient.readContract({
      address: buzz.customTokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [dbUser.bindedWallet],
    });
    return Number(formatEther(userBalance));
  }
};
