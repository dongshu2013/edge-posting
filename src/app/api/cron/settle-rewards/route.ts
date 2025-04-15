import { getPublicClient } from "@/lib/ethereum";
import { prisma } from "@/lib/prisma";
import { getUserFormatBalance } from "@/utils/commonUtils";
import { Buzz } from "@prisma/client";
import * as math from "mathjs";
import { NextResponse } from "next/server";
import { erc20Abi, formatEther } from "viem";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

interface Reply {
  id: string;
  createdBy: string;
  userRole: string;
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
  // const dbUsers = await prisma.user.findMany({
  //   where: {
  //     uid: { in: replyUserIds },
  //   },
  // });
  // const dbUserMap = new Map(dbUsers.map((user: any) => [user.uid, user]));

  // // Find reply user ids that are kols
  // const kols = await prisma.kol.findMany({
  //   where: {
  //     status: "confirmed",
  //     userId: { in: replyUserIds },
  //   },
  // });

  // const userWeights = await Promise.all(
  //   replyUserIds.map(async (uid: string) => {
  //     const user = dbUserMap.get(uid);
  //     return await getUserFormatBalance(buzz, user);
  //   })
  // );

  // console.log("userWeights", userWeights);

  // const totalWeight = userWeights.reduce(
  //   (acc: number, weight: number) => acc + weight,
  //   0
  // );

  const totalTokenAmountOnChain = math
    .bignumber(buzz.tokenAmount)
    .times(math.bignumber(10).pow(buzz.tokenDecimals));

  const kolUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "kol")
    .map((reply: any) => reply.createdBy);
  const holderUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "holder")
    .map((reply: any) => reply.createdBy);
  const normalUserIds = buzz.replies
    .filter((reply: any) => reply.userRole === "normal")
    .map((reply: any) => reply.createdBy);

  // const hasBalanceWeights = userWeights
  //   .filter((weight: number) => weight > 0)
  //   // Filter out kols
  //   .filter((weight: number) => {
  //     const kol = kols.find((kol: any) => kol.userId === weight);
  //     return !kol;
  //   });
  // const emptyBalanceWeights = userWeights
  //   .filter((weight: number) => weight === 0)
  //   // Filter out kols
  //   .filter((weight: number) => {
  //     const kol = kols.find((kol: any) => kol.userId === weight);
  //     return !kol;
  //   });

  // 40%
  const hasBalanceRewardTokenAmount =
    holderUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfHolders))
          .div(math.bignumber(100))
      : math.bignumber(0);
  // 10%
  const emptyBalanceRewardTokenAmount =
    normalUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfOthers))
          .div(math.bignumber(100))
      : math.bignumber(0);

  // 50%
  const kolRewardTokenAmount =
    kolUserIds.length > 0
      ? totalTokenAmountOnChain
          .mul(math.bignumber(buzz.shareOfKols))
          .div(math.bignumber(100))
      : math.bignumber(0);

  const remainingRewardTokenAmount = totalTokenAmountOnChain
    .minus(kolRewardTokenAmount)
    .minus(emptyBalanceRewardTokenAmount)
    .minus(hasBalanceRewardTokenAmount);

  console.log("totalTokenAmountOnChain", totalTokenAmountOnChain);
  console.log("kolRewardTokenAmount", kolRewardTokenAmount);
  console.log("hasBalanceRewardTokenAmount", hasBalanceRewardTokenAmount);
  console.log("emptyBalanceRewardTokenAmount", emptyBalanceRewardTokenAmount);
  console.log("remainingRewardTokenAmount", remainingRewardTokenAmount);

  const settleHistories: any[] = [];

  const addUserBalancesResult = await prisma.$transaction(async (tx: any) => {
    buzz.replies.forEach(async (reply: Reply, index: number) => {
      let amountOnChain = "0";
      if (reply.userRole === "kol") {
        amountOnChain = kolRewardTokenAmount
          .div(math.bignumber(kolUserIds.length))
          .floor()
          .toString();
      } else if (reply.userRole === "holder") {
        amountOnChain = hasBalanceRewardTokenAmount
          .div(math.bignumber(holderUserIds.length))
          .floor()
          .toString();
      } else {
        amountOnChain = emptyBalanceRewardTokenAmount
          .div(math.bignumber(normalUserIds.length))
          .floor()
          .toString();
      }

      await addUserBalance(buzz, tx, reply.createdBy, amountOnChain);
      if (math.bignumber(amountOnChain).gt(0)) {
        settleHistories.push({
          userId: reply.createdBy,
          buzzId: buzz.id,
          settleAmount: amountOnChain,
          type: reply.userRole,
        });
      }
    });

    // Return fund to creator
    if (remainingRewardTokenAmount.gt(0)) {
      await addUserBalance(
        buzz,
        tx,
        buzz.createdBy,
        remainingRewardTokenAmount.toString()
      );
      settleHistories.push({
        userId: buzz.createdBy,
        buzzId: buzz.id,
        settleAmount: remainingRewardTokenAmount.toString(),
        type: "refund",
      });
    }

    await tx.settleHistory.createMany({
      data: settleHistories,
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

  const settleHistories: any[] = [];
  const addUserBalancesResult = await prisma.$transaction(async (tx: any) => {
    replyUserIds.forEach(async (userId: string, index: number) => {
      // Check if buzz has participantMinimumTokenAmount limit
      if (
        buzz.participantMinimumTokenAmount &&
        Number(buzz.participantMinimumTokenAmount) > 0
      ) {
        const user = await prisma.user.findUnique({
          where: {
            uid: userId,
          },
        });
        if (!user) {
          return;
        }
        const userBalance = await getUserFormatBalance(buzz, user);
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

      if (math.bignumber(userRewardAmountOnChain).gt(0)) {
        settleHistories.push({
          userId,
          buzzId: buzz.id,
          settleAmount: userRewardAmountOnChain,
          type: "Normal",
        });
      }

      remainingTokenAmountOnChain = remainingTokenAmountOnChain.minus(
        math.bignumber(userRewardAmountOnChain)
      );
    });

    if (remainingTokenAmountOnChain.gt(0)) {
      settleHistories.push({
        userId: buzz.createdBy,
        buzzId: buzz.id,
        settleAmount: remainingTokenAmountOnChain.toString(),
        type: "Refund",
      });
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

  await prisma.settleHistory.createMany({
    data: settleHistories,
  });
};

const addUserBalance = async (
  buzz: any,
  tx: any,
  userId: string,
  amountOnChain: string
) => {
  if (math.bignumber(amountOnChain).lte(0)) {
    return;
  }

  const updatedBalance = await tx.userBalance
    .upsert({
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
    })
    .catch((err: any) => {
      console.error("Error adding user balance:", err);
    });

  return updatedBalance;
};

const addKolBalance = async (
  buzz: any,
  tx: any,
  kolId: string,
  amountOnChain: string
) => {
  if (math.bignumber(amountOnChain).lte(0)) {
    return;
  }

  const updatedBalance = await tx.kolBalance.upsert({
    where: {
      // Use the unique constraint we defined in the schema
      kolId_tokenAddress: {
        kolId: kolId,
        tokenAddress: buzz.customTokenAddress,
      },
    },
    // If no record exists, create a new one
    create: {
      kolId,
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
